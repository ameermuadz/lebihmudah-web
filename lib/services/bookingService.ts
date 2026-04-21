import { prisma } from "@/lib/db";

export interface CreateBookingInput {
  propertyId: string;
  userContact: string;
  moveInDate: string;
}

export interface BookingResult {
  confirmationId: string;
  propertyId: string;
  userContact: string;
  moveInDate: string;
  status: string;
  createdAt: string;
}

export async function createBooking(
  input: CreateBookingInput,
): Promise<BookingResult | null> {
  const property = await prisma.property.findUnique({
    where: { id: input.propertyId },
    select: { id: true },
  });

  if (!property) {
    return null;
  }

  const booking = await prisma.booking.create({
    data: {
      propertyId: input.propertyId,
      userContact: input.userContact,
      moveInDate: input.moveInDate,
      status: "CONFIRMED",
    },
  });

  return {
    confirmationId: booking.id,
    propertyId: booking.propertyId,
    userContact: booking.userContact,
    moveInDate: booking.moveInDate,
    status: booking.status,
    createdAt: booking.createdAt.toISOString(),
  };
}
