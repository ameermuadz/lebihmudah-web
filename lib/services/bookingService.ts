import { prisma } from "@/lib/db";
import { BookingListItem, BookingStatus } from "@/lib/types";

export class BookingRangeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BookingRangeError";
  }
}

export class BookingConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BookingConflictError";
  }
}

export class BookingCancellationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BookingCancellationError";
  }
}

export class BookingTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BookingTransitionError";
  }
}

export class BookingAuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BookingAuthorizationError";
  }
}

export interface CreateBookingInput {
  propertyId: string;
  userId?: string | null;
  userContact: string;
  moveInDate: string;
  moveOutDate: string;
}

export interface BookingResult {
  confirmationId: string;
  propertyId: string;
  userContact: string;
  moveInDate: string;
  moveOutDate: string;
  status: BookingStatus;
  createdAt: string;
  userId?: string | null;
  userName?: string | null;
}

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

const toIsoDate = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const isValidIsoDate = (value: string) => {
  if (!isoDatePattern.test(value)) {
    return false;
  }

  const parsedDate = new Date(`${value}T00:00:00`);

  return !Number.isNaN(parsedDate.getTime()) && toIsoDate(parsedDate) === value;
};

const compareIsoDates = (left: string, right: string) =>
  left.localeCompare(right);

type BookingWithRelations = {
  id: string;
  propertyId: string;
  userId: string | null;
  userContact: string;
  moveInDate: string;
  moveOutDate: string;
  status: string;
  createdAt: Date;
  property: {
    id: string;
    ownerId: string;
    title: string;
    location: string;
    images: Array<{ url: string; sortOrder: number }>;
  };
  user: { id: string; name: string } | null;
};

const sortByOrder = <T extends { sortOrder: number }>(a: T, b: T) =>
  a.sortOrder - b.sortOrder;

const getPrimaryImageUrl = (
  images: Array<{ url: string; sortOrder: number }>,
) => [...images].sort(sortByOrder)[0]?.url ?? "/mock1.svg";

const mapBookingListItem = (
  booking: BookingWithRelations,
): BookingListItem => ({
  confirmationId: booking.id,
  propertyId: booking.propertyId,
  propertyTitle: booking.property.title,
  propertyLocation: booking.property.location,
  propertyImage: getPrimaryImageUrl(booking.property.images),
  userContact: booking.userContact,
  moveInDate: booking.moveInDate,
  moveOutDate: booking.moveOutDate,
  status: booking.status as BookingStatus,
  createdAt: booking.createdAt.toISOString(),
  userId: booking.userId,
  userName: booking.user?.name ?? null,
});

export async function createBooking(
  input: CreateBookingInput,
): Promise<BookingResult | null> {
  const moveInDate = input.moveInDate.trim();
  const moveOutDate = input.moveOutDate.trim();

  if (!isValidIsoDate(moveInDate) || !isValidIsoDate(moveOutDate)) {
    throw new BookingRangeError(
      "moveInDate and moveOutDate must use the YYYY-MM-DD format",
    );
  }

  if (compareIsoDates(moveOutDate, moveInDate) <= 0) {
    throw new BookingRangeError("moveOutDate must be after moveInDate");
  }

  const booking = await prisma.$transaction(async (tx) => {
    const property = await tx.property.findUnique({
      where: { id: input.propertyId },
      select: { id: true, availabilityDate: true },
    });

    if (!property) {
      return null;
    }

    if (compareIsoDates(moveInDate, property.availabilityDate) < 0) {
      throw new BookingRangeError(
        `This property is available from ${property.availabilityDate}`,
      );
    }

    const conflictingBooking = await tx.booking.findFirst({
      where: {
        propertyId: input.propertyId,
        status: {
          in: ["PENDING", "CONFIRMED"],
        },
        moveInDate: {
          lt: moveOutDate,
        },
        moveOutDate: {
          gt: moveInDate,
        },
      },
      select: {
        moveInDate: true,
        moveOutDate: true,
      },
    });

    if (conflictingBooking) {
      throw new BookingConflictError(
        `This property is already booked from ${conflictingBooking.moveInDate} to ${conflictingBooking.moveOutDate}.`,
      );
    }

    const createdBooking = await tx.booking.create({
      data: {
        propertyId: input.propertyId,
        userId: input.userId ?? null,
        userContact: input.userContact,
        moveInDate,
        moveOutDate,
        status: "PENDING",
      },
      include: {
        user: true,
      },
    });

    await tx.property.update({
      where: { id: property.id },
      data: {
        availabilityDate: moveOutDate,
      },
    });

    return createdBooking;
  });

  if (!booking) {
    return null;
  }

  return {
    confirmationId: booking.id,
    propertyId: booking.propertyId,
    userContact: booking.userContact,
    moveInDate: booking.moveInDate,
    moveOutDate: booking.moveOutDate,
    status: booking.status as BookingStatus,
    createdAt: booking.createdAt.toISOString(),
    userId: booking.userId,
    userName: booking.user?.name ?? null,
  };
}

export async function getUserBookings(
  userId: string,
): Promise<BookingListItem[]> {
  const bookings = await prisma.booking.findMany({
    where: { userId },
    include: {
      property: {
        include: {
          images: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [{ moveInDate: "asc" }, { createdAt: "desc" }],
  });

  return bookings.map((booking) => mapBookingListItem(booking));
}

export async function getOwnerBookings(
  ownerId: string,
): Promise<BookingListItem[]> {
  const bookings = await prisma.booking.findMany({
    where: {
      property: {
        ownerId,
      },
    },
    include: {
      property: {
        include: {
          images: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [{ createdAt: "desc" }],
  });

  return bookings.map((booking) => mapBookingListItem(booking));
}

export async function getPendingBookings(
  ownerId: string,
): Promise<BookingListItem[]> {
  const bookings = await prisma.booking.findMany({
    where: {
      status: "PENDING",
      property: {
        ownerId,
      },
    },
    include: {
      property: {
        include: {
          images: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [{ createdAt: "asc" }],
  });

  return bookings.map((booking) => mapBookingListItem(booking));
}

export async function updateBookingStatus(input: {
  bookingId: string;
  ownerId: string;
  status: Extract<BookingStatus, "CONFIRMED" | "CANCELLED">;
}): Promise<BookingListItem | null> {
  const booking = await prisma.booking.findUnique({
    where: { id: input.bookingId },
    include: {
      property: {
        include: {
          images: true,
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

  if (!booking) {
    return null;
  }

  if (booking.property.ownerId !== input.ownerId) {
    throw new BookingAuthorizationError(
      "You can only manage bookings for your own properties",
    );
  }

  if (booking.status === input.status) {
    throw new BookingTransitionError(
      `Booking is already ${input.status.toLowerCase()}`,
    );
  }

  if (booking.status === "CANCELLED") {
    throw new BookingTransitionError("Cancelled bookings cannot be changed");
  }

  if (booking.status !== "PENDING" && input.status === "CONFIRMED") {
    throw new BookingTransitionError("Only pending bookings can be confirmed");
  }

  if (input.status === "CONFIRMED") {
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        propertyId: booking.propertyId,
        id: {
          not: booking.id,
        },
        status: {
          in: ["PENDING", "CONFIRMED"],
        },
        moveInDate: {
          lt: booking.moveOutDate,
        },
        moveOutDate: {
          gt: booking.moveInDate,
        },
      },
      select: {
        moveInDate: true,
        moveOutDate: true,
      },
    });

    if (conflictingBooking) {
      throw new BookingConflictError(
        `This property is already reserved from ${conflictingBooking.moveInDate} to ${conflictingBooking.moveOutDate}.`,
      );
    }
  }

  const updatedBooking = await prisma.booking.update({
    where: { id: booking.id },
    data: { status: input.status },
    include: {
      property: {
        include: {
          images: true,
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

  return mapBookingListItem(updatedBooking);
}

export async function cancelBooking(input: {
  bookingId: string;
  userId: string;
}): Promise<BookingListItem | null> {
  const booking = await prisma.booking.findFirst({
    where: {
      id: input.bookingId,
      userId: input.userId,
    },
    include: {
      property: {
        include: {
          images: true,
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

  if (!booking) {
    return null;
  }

  if (booking.status === "CANCELLED") {
    throw new BookingCancellationError("This booking is already cancelled");
  }

  const todayIso = toIsoDate(new Date());

  if (compareIsoDates(booking.moveOutDate, todayIso) <= 0) {
    throw new BookingCancellationError("Past bookings cannot be cancelled");
  }

  const updatedBooking = await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "CANCELLED" },
    include: {
      property: {
        include: {
          images: true,
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

  return mapBookingListItem(updatedBooking);
}
