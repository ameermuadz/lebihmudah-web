import { PrismaClient } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import type { NotificationKind, NotificationListItem } from "@/lib/types";

type NotificationWriter = Pick<PrismaClient, "notification">;

const mapNotification = (notification: {
  id: string;
  type: string;
  title: string;
  message: string;
  targetUrl: string;
  isRead: boolean;
  createdAt: Date;
}): NotificationListItem => ({
  id: notification.id,
  type: notification.type as NotificationKind,
  title: notification.title,
  message: notification.message,
  targetUrl: notification.targetUrl,
  isRead: notification.isRead,
  createdAt: notification.createdAt.toISOString(),
});

export async function createNotification(
  input: {
    recipientUserId: string;
    type: NotificationKind;
    title: string;
    message: string;
    targetUrl: string;
  },
  db: NotificationWriter = prisma,
) {
  return db.notification.create({
    data: {
      recipientUserId: input.recipientUserId,
      type: input.type,
      title: input.title,
      message: input.message,
      targetUrl: input.targetUrl,
    },
  });
}

export async function getNotificationsForUser(
  userId: string,
): Promise<NotificationListItem[]> {
  const notifications = await prisma.notification.findMany({
    where: { recipientUserId: userId },
    orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
  });

  return notifications.map(mapNotification);
}

export async function markNotificationAsRead(input: {
  notificationId: string;
  userId: string;
}): Promise<NotificationListItem | null> {
  const notification = await prisma.notification.findFirst({
    where: {
      id: input.notificationId,
      recipientUserId: input.userId,
    },
  });

  if (!notification) {
    return null;
  }

  const updatedNotification = await prisma.notification.update({
    where: { id: notification.id },
    data: {
      isRead: true,
      readAt: notification.readAt ?? new Date(),
    },
  });

  return mapNotification(updatedNotification);
}

export async function notifyOwnerOfNewBookingRequest(
  input: {
    ownerUserId: string;
    bookingId: string;
    propertyTitle: string;
    renterLabel: string;
  },
  db: NotificationWriter = prisma,
) {
  return createNotification(
    {
      recipientUserId: input.ownerUserId,
      type: "BOOKING_REQUESTED",
      title: "New booking request",
      message: `${input.renterLabel} requested ${input.propertyTitle}.`,
      targetUrl: `/bookings/${input.bookingId}`,
    },
    db,
  );
}

export async function notifyOwnerOfRenterCancellation(
  input: {
    ownerUserId: string;
    bookingId: string;
    propertyTitle: string;
    renterLabel: string;
  },
  db: NotificationWriter = prisma,
) {
  return createNotification(
    {
      recipientUserId: input.ownerUserId,
      type: "BOOKING_CANCELLED_BY_RENTER",
      title: "Booking cancelled",
      message: `${input.renterLabel} cancelled the booking for ${input.propertyTitle}.`,
      targetUrl: `/bookings/${input.bookingId}`,
    },
    db,
  );
}

export async function notifyRenterOfBookingDecision(
  input: {
    renterUserId: string;
    bookingId: string;
    propertyTitle: string;
    previousStatus: string;
    nextStatus: "CONFIRMED" | "CANCELLED";
  },
  db: NotificationWriter = prisma,
) {
  const isAcceptance = input.nextStatus === "CONFIRMED";
  const isRejection =
    input.nextStatus === "CANCELLED" && input.previousStatus === "PENDING";

  return createNotification(
    {
      recipientUserId: input.renterUserId,
      type: isAcceptance
        ? "BOOKING_ACCEPTED"
        : isRejection
          ? "BOOKING_REJECTED"
          : "BOOKING_CANCELLED_BY_OWNER",
      title: isAcceptance
        ? "Booking accepted"
        : isRejection
          ? "Booking rejected"
          : "Booking cancelled by owner",
      message: isAcceptance
        ? `Your booking for ${input.propertyTitle} was accepted.`
        : isRejection
          ? `Your booking for ${input.propertyTitle} was rejected.`
          : `Your confirmed booking for ${input.propertyTitle} was cancelled by the owner.`,
      targetUrl: `/bookings/${input.bookingId}`,
    },
    db,
  );
}

export async function notifyRentersOfPropertyUpdate(
  input: {
    recipientUserIds: string[];
    propertyId: string;
    propertyTitle: string;
  },
  db: NotificationWriter = prisma,
) {
  const uniqueRecipientIds = [...new Set(input.recipientUserIds)].filter(Boolean);

  await Promise.all(
    uniqueRecipientIds.map((recipientUserId) =>
      createNotification(
        {
          recipientUserId,
          type: "PROPERTY_UPDATED",
          title: "Property updated",
          message: `The details for ${input.propertyTitle} were updated by the owner.`,
          targetUrl: `/properties/${input.propertyId}`,
        },
        db,
      ),
    ),
  );
}
