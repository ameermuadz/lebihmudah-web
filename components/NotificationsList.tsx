"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { NotificationListItem } from "@/lib/types";

interface NotificationsListProps {
  notifications: NotificationListItem[];
}

const formatDateLabel = (value: string) => {
  const parsedDate = new Date(value);

  return new Intl.DateTimeFormat("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsedDate);
};

const targetLabelByType: Record<NotificationListItem["type"], string> = {
  BOOKING_REQUESTED: "Open booking",
  BOOKING_ACCEPTED: "Open booking",
  BOOKING_REJECTED: "Open booking",
  BOOKING_CANCELLED_BY_OWNER: "Open booking",
  BOOKING_CANCELLED_BY_RENTER: "Open booking",
  PROPERTY_UPDATED: "Open property",
};

const accentByType: Record<
  NotificationListItem["type"],
  { dot: string; chip: string }
> = {
  BOOKING_REQUESTED: {
    dot: "bg-amber-500",
    chip: "bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-100",
  },
  BOOKING_ACCEPTED: {
    dot: "bg-emerald-500",
    chip: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-100",
  },
  BOOKING_REJECTED: {
    dot: "bg-rose-500",
    chip: "bg-rose-100 text-rose-900 dark:bg-rose-950/70 dark:text-rose-100",
  },
  BOOKING_CANCELLED_BY_OWNER: {
    dot: "bg-rose-500",
    chip: "bg-rose-100 text-rose-900 dark:bg-rose-950/70 dark:text-rose-100",
  },
  BOOKING_CANCELLED_BY_RENTER: {
    dot: "bg-rose-500",
    chip: "bg-rose-100 text-rose-900 dark:bg-rose-950/70 dark:text-rose-100",
  },
  PROPERTY_UPDATED: {
    dot: "bg-sky-500",
    chip: "bg-sky-100 text-sky-900 dark:bg-sky-950/70 dark:text-sky-100",
  },
};

export default function NotificationsList({
  notifications,
}: NotificationsListProps) {
  const router = useRouter();
  const [pendingNotificationId, setPendingNotificationId] = useState<
    string | null
  >(null);

  const handleOpen = async (notification: NotificationListItem) => {
    setPendingNotificationId(notification.id);

    try {
      await fetch(`/api/notifications/${notification.id}`, {
        method: "PATCH",
      });
    } catch {
      // opening still continues even if mark-read fails
    } finally {
      router.push(notification.targetUrl);
      setPendingNotificationId(null);
    }
  };

  return (
    <div className="space-y-4">
      {notifications.map((notification) => (
        <button
          key={notification.id}
          type="button"
          onClick={() => void handleOpen(notification)}
          className={`w-full rounded-[28px] border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:bg-white dark:hover:bg-zinc-900 md:p-5 ${
            notification.isRead
              ? "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
              : "border-emerald-200 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/30"
          }`}
        >
          <div className="flex items-start gap-3">
            <span
              className={`mt-1 h-2.5 w-2.5 rounded-full ${accentByType[notification.type].dot}`}
            />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  {notification.title}
                </p>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${accentByType[notification.type].chip}`}
                >
                  {targetLabelByType[notification.type]}
                </span>
              </div>
              <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                {notification.message}
              </p>
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                <span>{formatDateLabel(notification.createdAt)}</span>
                <span>
                  {pendingNotificationId === notification.id
                    ? "Opening..."
                    : notification.isRead
                      ? "Read"
                      : "Unread"}
                </span>
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
