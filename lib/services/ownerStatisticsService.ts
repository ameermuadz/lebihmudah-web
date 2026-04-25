import { prisma } from "@/lib/db";
import { OwnerStatistics } from "@/lib/types";

export async function getOwnerStatistics(
  ownerId: string,
): Promise<OwnerStatistics> {
  const [
    propertyCount,
    pendingBookingCount,
    bookedBookingCount,
    cancelledBookingCount,
  ] = await Promise.all([
    prisma.property.count({
      where: { ownerId },
    }),
    prisma.booking.count({
      where: {
        status: "PENDING",
        property: {
          ownerId,
        },
      },
    }),
    prisma.booking.count({
      where: {
        status: "CONFIRMED",
        property: {
          ownerId,
        },
      },
    }),
    prisma.booking.count({
      where: {
        status: "CANCELLED",
        property: {
          ownerId,
        },
      },
    }),
  ]);

  const overallBookingCount =
    pendingBookingCount + bookedBookingCount + cancelledBookingCount;

  return {
    properties: {
      overall: propertyCount,
    },
    bookings: {
      overall: overallBookingCount,
      pending: pendingBookingCount,
      booked: bookedBookingCount,
      cancelled: cancelledBookingCount,
    },
  };
}
