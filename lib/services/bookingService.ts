import { prisma } from "@/lib/db";

export interface CreateBookingInput {
  propertyId: string;
  userId?: string | null;
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
  userId?: string | null;
  userName?: string | null;
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
      userId: input.userId ?? null,
      userContact: input.userContact,
      moveInDate: input.moveInDate,
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
    status: booking.status,
    createdAt: booking.createdAt.toISOString(),
    userId: booking.userId,
    userName: booking.user?.name ?? null,
  };
}
