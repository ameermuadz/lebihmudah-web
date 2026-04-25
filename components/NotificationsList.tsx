"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import type { NotificationListItem } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

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
  OWNER_MESSAGE_REQUEST: "Open chat",
  OWNER_MESSAGE_REPLY: "Open chat",
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
  OWNER_MESSAGE_REQUEST: {
    dot: "bg-violet-500",
    chip: "bg-violet-100 text-violet-900 dark:bg-violet-950/70 dark:text-violet-100",
  },
  OWNER_MESSAGE_REPLY: {
    dot: "bg-indigo-500",
    chip: "bg-indigo-100 text-indigo-900 dark:bg-indigo-950/70 dark:text-indigo-100",
  },
};

export default function NotificationsList({
  notifications: initialNotifications,
}: NotificationsListProps) {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const { data: notifications = initialNotifications } = useSWR<NotificationListItem[]>(
    "/api/notifications",
    fetcher,
    { fallbackData: initialNotifications, refreshInterval: 5000 },
  );
  const [pendingNotificationId, setPendingNotificationId] = useState<
    string | null
  >(null);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const handleMarkAsRead = async (id: string) => {
    setPendingNotificationId(id);
    try {
      await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
      });
      void mutate("/api/notifications");
    } catch {
      // ignore errors
    } finally {
      setPendingNotificationId(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    setIsMarkingAll(true);
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
      });
      void mutate("/api/notifications");
    } catch {
      // ignore errors
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleOpen = async (notification: NotificationListItem) => {
    if (notification.isRead) {
      router.push(notification.targetUrl);
      return;
    }

    setPendingNotificationId(notification.id);
    try {
      await fetch(`/api/notifications/${notification.id}`, {
        method: "PATCH",
      });
      void mutate("/api/notifications");
    } catch {
      // opening still continues even if mark-read fails
    } finally {
      router.push(notification.targetUrl);
      setPendingNotificationId(null);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}` : "No unread notifications"}
        </h2>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={isMarkingAll}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-500 disabled:opacity-50 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            {isMarkingAll ? "Marking..." : "Mark all as read"}
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <section className="rounded-[32px] border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 md:p-8">
          You have no notifications yet.
        </section>
      ) : null}

      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`group relative overflow-hidden rounded-[28px] border transition-all ${
            notification.isRead
              ? "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
              : "border-emerald-200 bg-emerald-50 shadow-sm dark:border-emerald-900/60 dark:bg-emerald-950/30"
          }`}
        >
          <div className="flex items-start">
            <button
              type="button"
              onClick={() => void handleOpen(notification)}
              className="flex-1 p-4 text-left md:p-5"
            >
              <div className="flex items-start gap-3">
                <span
                  className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${accentByType[notification.type].dot}`}
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
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    {formatDateLabel(notification.createdAt)}
                  </div>
                </div>
              </div>
            </button>

            {!notification.isRead && (
              <div className="flex items-center self-stretch pr-4 md:pr-5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleMarkAsRead(notification.id);
                  }}
                  disabled={pendingNotificationId === notification.id}
                  className="rounded-full bg-white/80 px-4 py-2 text-xs font-semibold text-emerald-700 shadow-sm transition hover:bg-white hover:text-emerald-800 disabled:opacity-50 dark:bg-zinc-800/80 dark:text-emerald-400 dark:hover:bg-zinc-800 dark:hover:text-emerald-300"
                >
                  {pendingNotificationId === notification.id ? "..." : "Read"}
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
