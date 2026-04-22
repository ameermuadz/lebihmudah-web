import { prisma } from "@/lib/db";

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
  status: string;
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

export async function createBooking(
  input: CreateBookingInput,
): Promise<BookingResult | null> {
  const property = await prisma.property.findUnique({
    where: { id: input.propertyId },
    select: { id: true, availabilityDate: true },
  });

  if (!property) {
    return null;
  }

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

  if (compareIsoDates(moveInDate, property.availabilityDate) < 0) {
    throw new BookingRangeError(
      `This property is available from ${property.availabilityDate}`,
    );
  }

  const conflictingBooking = await prisma.booking.findFirst({
    where: {
      propertyId: input.propertyId,
      status: {
        not: "CANCELLED",
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

  const booking = await prisma.booking.create({
    data: {
      propertyId: input.propertyId,
      userId: input.userId ?? null,
      userContact: input.userContact,
      moveInDate,
      moveOutDate,
      status: "CONFIRMED",
    },
    include: {
      user: true,
    },
  });

  return {
    confirmationId: booking.id,
    propertyId: booking.propertyId,
    userContact: booking.userContact,
    moveInDate: booking.moveInDate,
    moveOutDate: booking.moveOutDate,
    status: booking.status,
    createdAt: booking.createdAt.toISOString(),
    userId: booking.userId,
    userName: booking.user?.name ?? null,
  };
}
