import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { prisma } from "@/lib/db";
import type { BookingLoaAttachment } from "@/lib/types";

export class BookingLoaUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BookingLoaUnavailableError";
  }
}

type BookingLoaRecord = {
  id: string;
  status: string;
  moveInDate: string;
  moveOutDate: string;
  userContact: string;
  loaPdfUrl: string | null;
  loaGeneratedAt: Date | null;
  createdAt: Date;
  property: {
    id: string;
    title: string;
    location: string;
    price: number;
    rooms: number;
    petsAllowed: boolean;
    owner: {
      id: string;
      name: string;
      email: string;
      phone: string | null;
    };
  };
  user: {
    id: string;
    name: string;
  } | null;
};

const loaDirectory = path.join(process.cwd(), "public", "loas");

const buildLoaFileName = (bookingId: string) => `loa-${bookingId}.pdf`;

const buildLoaUrl = (bookingId: string) =>
  `/loas/${buildLoaFileName(bookingId)}`;

const formatDateLabel = (value: string) => {
  const parsedDate = new Date(`${value}T00:00:00`);

  return new Intl.DateTimeFormat("en-MY", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsedDate);
};

const formatDateTimeLabel = (value: Date) =>
  new Intl.DateTimeFormat("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-MY", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const wrapText = (
  text: string,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  size: number,
  maxWidth: number,
) => {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;

    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      currentLine = candidate;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    if (font.widthOfTextAtSize(word, size) > maxWidth) {
      let chunk = "";
      for (const character of word) {
        const chunkCandidate = `${chunk}${character}`;
        if (font.widthOfTextAtSize(chunkCandidate, size) <= maxWidth) {
          chunk = chunkCandidate;
        } else {
          if (chunk) {
            lines.push(chunk);
          }
          chunk = character;
        }
      }

      currentLine = chunk;
      continue;
    }

    currentLine = word;
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
};

const drawWrappedText = (
  page: ReturnType<PDFDocument["addPage"]>,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  text: string,
  x: number,
  y: number,
  size: number,
  maxWidth: number,
  color = rgb(0.15, 0.17, 0.2),
) => {
  const lines = wrapText(text, font, size, maxWidth);
  let currentY = y;

  for (const line of lines) {
    page.drawText(line, {
      x,
      y: currentY,
      size,
      font,
      color,
    });
    currentY -= size + 4;
  }

  return currentY;
};

const createBookingLoaPdf = async (booking: BookingLoaRecord) => {
  const pdfDocument = await PDFDocument.create();
  const page = pdfDocument.addPage([595.28, 841.89]);
  const boldFont = await pdfDocument.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDocument.embedFont(StandardFonts.Helvetica);

  const width = page.getWidth();
  const margin = 48;
  const contentWidth = width - margin * 2;

  page.drawText("Letter of Agreement", {
    x: margin,
    y: 785,
    size: 22,
    font: boldFont,
    color: rgb(0.08, 0.47, 0.33),
  });
  page.drawText("LebihMudah.my Property Booking", {
    x: margin,
    y: 758,
    size: 11,
    font: regularFont,
    color: rgb(0.35, 0.35, 0.38),
  });

  let cursorY = 720;

  const sectionTitle = (title: string) => {
    page.drawText(title, {
      x: margin,
      y: cursorY,
      size: 13,
      font: boldFont,
      color: rgb(0.08, 0.47, 0.33),
    });
    cursorY -= 20;
  };

  const row = (label: string, value: string) => {
    page.drawText(`${label}:`, {
      x: margin,
      y: cursorY,
      size: 10.5,
      font: boldFont,
      color: rgb(0.18, 0.18, 0.2),
    });
    cursorY = drawWrappedText(
      page,
      regularFont,
      value,
      margin + 104,
      cursorY,
      10.5,
      contentWidth - 104,
      rgb(0.18, 0.18, 0.2),
    );
    cursorY -= 8;
  };

  sectionTitle("Agreement Summary");
  row("Booking ID", booking.id);
  row("Property", `${booking.property.title} (${booking.property.id})`);
  row("Location", booking.property.location);
  row(
    "Stay Period",
    `${formatDateLabel(booking.moveInDate)} to ${formatDateLabel(booking.moveOutDate)}`,
  );
  row("Generated On", formatDateTimeLabel(new Date()));

  cursorY -= 6;
  sectionTitle("Parties");
  row(
    "Owner",
    `${booking.property.owner.name} | ${booking.property.owner.email}${booking.property.owner.phone ? ` | ${booking.property.owner.phone}` : ""}`,
  );
  row("Renter", `${booking.user?.name ?? "Renter"} | ${booking.userContact}`);

  cursorY -= 6;
  sectionTitle("Property Details");
  row("Rent", `RM ${formatMoney(booking.property.price)}/month`);
  row("Rooms", `${booking.property.rooms}`);
  row("Pets", booking.property.petsAllowed ? "Allowed" : "Not allowed");
  row("Current Availability", booking.moveOutDate);

  cursorY -= 6;
  sectionTitle("Agreement Terms");
  cursorY = drawWrappedText(
    page,
    regularFont,
    "This agreement is generated automatically after the owner confirms a renter booking. The renter and owner should keep a copy of this PDF as the booking record and reference it when reviewing the stay details.",
    margin,
    cursorY,
    10.5,
    contentWidth,
    rgb(0.18, 0.18, 0.2),
  );

  cursorY -= 18;
  page.drawRectangle({
    x: margin,
    y: cursorY - 4,
    width: contentWidth,
    height: 1,
    color: rgb(0.85, 0.86, 0.88),
  });
  cursorY -= 24;
  cursorY = drawWrappedText(
    page,
    regularFont,
    "This PDF is generated by LebihMudah.my and stored as the official LOA attachment for this confirmed booking.",
    margin,
    cursorY,
    9.5,
    contentWidth,
    rgb(0.42, 0.42, 0.45),
  );

  return pdfDocument.save();
};

const persistBookingLoa = async (booking: BookingLoaRecord) => {
  const fileName = buildLoaFileName(booking.id);
  const filePath = path.join(loaDirectory, fileName);
  const loaPdfUrl = buildLoaUrl(booking.id);
  const loaGeneratedAt = new Date();

  await mkdir(loaDirectory, { recursive: true });

  const pdfBytes = await createBookingLoaPdf(booking);
  await writeFile(filePath, pdfBytes);

  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      loaPdfUrl,
      loaGeneratedAt,
    },
  });

  return {
    bookingId: booking.id,
    loaPdfUrl,
    loaGeneratedAt: loaGeneratedAt.toISOString(),
  } satisfies BookingLoaAttachment;
};

const loadBookingForLoa = async (bookingId: string) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      property: {
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return booking as BookingLoaRecord | null;
};

export async function ensureBookingLoa(
  bookingId: string,
): Promise<BookingLoaAttachment | null> {
  const booking = await loadBookingForLoa(bookingId);

  if (!booking || booking.status !== "CONFIRMED") {
    return null;
  }

  const filePath = path.join(loaDirectory, buildLoaFileName(booking.id));

  if (booking.loaPdfUrl && booking.loaGeneratedAt && existsSync(filePath)) {
    return {
      bookingId: booking.id,
      loaPdfUrl: booking.loaPdfUrl,
      loaGeneratedAt: booking.loaGeneratedAt.toISOString(),
    };
  }

  return persistBookingLoa(booking);
}

export async function getBookingLoaForRenter(input: {
  bookingId: string;
  userId: string;
}): Promise<BookingLoaAttachment | null> {
  const booking = await prisma.booking.findFirst({
    where: {
      id: input.bookingId,
      userId: input.userId,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!booking) {
    return null;
  }

  if (booking.status !== "CONFIRMED") {
    throw new BookingLoaUnavailableError(
      "LOA is only available for confirmed bookings",
    );
  }

  return ensureBookingLoa(booking.id);
}

export async function getBookingLoaForOwner(input: {
  bookingId: string;
  ownerId: string;
}): Promise<BookingLoaAttachment | null> {
  const booking = await prisma.booking.findFirst({
    where: {
      id: input.bookingId,
      property: {
        ownerId: input.ownerId,
      },
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!booking) {
    return null;
  }

  if (booking.status !== "CONFIRMED") {
    throw new BookingLoaUnavailableError(
      "LOA is only available for confirmed bookings",
    );
  }

  return ensureBookingLoa(booking.id);
}
