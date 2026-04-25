"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import useSWR, { mutate } from "swr";
import type { BookingListItem, BookingTimelineCategory } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface SessionUser {
  id: string;
  name: string;
  email: string;
}

interface BookingsClientProps {
  user: SessionUser;
  initialBookings: BookingListItem[];
}

const sectionOrder: Array<{
  key: BookingTimelineCategory;
  title: string;
  description: string;
}> = [
  {
    key: "pending",
    title: "Pending",
    description: "Requests waiting for owner approval.",
  },
  {
    key: "upcoming",
    title: "Upcoming",
    description: "Future stays that you can still manage.",
  },
  {
    key: "current",
    title: "Current Stay",
    description: "Bookings that are active right now.",
  },
  {
    key: "past",
    title: "Past",
    description: "Completed stays from your history.",
  },
  {
    key: "cancelled",
    title: "Cancelled",
    description: "Bookings that were cancelled before move-out.",
  },
];

const formatDateLabel = (value: string) => {
  const parsedDate = new Date(`${value}T00:00:00`);

  return new Intl.DateTimeFormat("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
};

const compareDates = (left: string, right: string) => left.localeCompare(right);

const toIsoDate = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getBookingCategory = (booking: BookingListItem, todayIso: string) => {
  if (booking.status === "PENDING") {
    return "pending" as const;
  }

  if (booking.status === "CANCELLED") {
    return "cancelled" as const;
  }

  if (booking.moveOutDate <= todayIso) {
    return "past" as const;
  }

  if (booking.moveInDate <= todayIso && booking.moveOutDate > todayIso) {
    return "current" as const;
  }

  return "upcoming" as const;
};

const categoryBadgeStyles: Record<BookingTimelineCategory, string> = {
  pending:
    "bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-100",
  upcoming: "bg-blue-100 text-blue-900 dark:bg-blue-950/70 dark:text-blue-100",
  current:
    "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-100",
  past: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
  cancelled: "bg-rose-100 text-rose-900 dark:bg-rose-950/70 dark:text-rose-100",
};

export default function BookingsClient({
  user,
  initialBookings,
}: BookingsClientProps) {
  const router = useRouter();
  const { data: bookings = initialBookings } = useSWR<BookingListItem[]>(
    "/api/bookings",
    fetcher,
    { fallbackData: initialBookings, refreshInterval: 5000 },
  );
  const [message, setMessage] = useState("");
  const [pendingBookingId, setPendingBookingId] = useState<string | null>(null);

  const todayIso = toIsoDate(new Date());

  const groupedBookings = sectionOrder.reduce(
    (groups, section) => {
      groups[section.key] = bookings
        .filter(
          (booking) => getBookingCategory(booking, todayIso) === section.key,
        )
        .sort((left, right) => compareDates(left.moveInDate, right.moveInDate));

      return groups;
    },
    {} as Record<BookingTimelineCategory, BookingListItem[]>,
  );

  const counts: Record<BookingTimelineCategory, number> = {
    pending: groupedBookings.pending.length,
    upcoming: groupedBookings.upcoming.length,
    current: groupedBookings.current.length,
    past: groupedBookings.past.length,
    cancelled: groupedBookings.cancelled.length,
  };

  const handleCancel = async (bookingId: string) => {
    setPendingBookingId(bookingId);
    setMessage("");

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
      });
      const data = (await response.json()) as
        | BookingListItem
        | { error?: string };

      if (!response.ok) {
        throw new Error(
          data && "error" in data && data.error
            ? data.error
            : "Unable to cancel booking",
        );
      }

      const cancelledBooking = data as BookingListItem;
      await mutate("/api/bookings");
      setMessage(
        `Cancelled ${cancelledBooking.propertyTitle} for ${formatDateLabel(cancelledBooking.moveInDate)} to ${formatDateLabel(cancelledBooking.moveOutDate)}.`,
      );
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      setMessage(reason);
    } finally {
      setPendingBookingId(null);
    }
  };

  const openBookingDetails = (bookingId: string) => {
    router.push(`/bookings/${bookingId}`);
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {sectionOrder.map((section) => (
          <div
            key={section.key}
            className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
              {section.title}
            </p>
            <p className="mt-2 text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
              {counts[section.key]}
            </p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {section.description}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-[32px] border border-zinc-200 bg-white p-5 shadow-[0_24px_80px_-48px_rgba(0,0,0,0.35)] dark:border-zinc-800 dark:bg-zinc-900 md:p-6">
        <div className="flex flex-col gap-3 border-b border-zinc-200 pb-5 dark:border-zinc-800 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500 dark:text-zinc-400">
              Booking dashboard
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
              My bookings
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
              Signed in as {user.name} ({user.email}). Track upcoming stays,
              review past bookings, and cancel active reservations when plans
              change.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
          >
            Browse properties
          </Link>
        </div>

        {message ? (
          <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
            {message}
          </p>
        ) : null}

        <div className="mt-6 space-y-6">
          {sectionOrder.map((section) => {
            const items = groupedBookings[section.key];

            return (
              <section key={section.key} className="space-y-3">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                      {section.title}
                    </h2>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {section.description}
                    </p>
                  </div>
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {items.length} booking{items.length === 1 ? "" : "s"}
                  </span>
                </div>

                {items.length === 0 ? (
                  <div className="rounded-[28px] border border-dashed border-zinc-300 bg-zinc-50 p-6 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
                    No {section.title.toLowerCase()} bookings right now.
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {items.map((booking) => {
                      const category = getBookingCategory(booking, todayIso);
                      const canCancel =
                        category === "pending" ||
                        category === "upcoming" ||
                        category === "current";

                      return (
                        <article
                          key={booking.confirmationId}
                          role="link"
                          tabIndex={0}
                          aria-label={`Open booking details for ${booking.propertyTitle}`}
                          onClick={() =>
                            openBookingDetails(booking.confirmationId)
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              openBookingDetails(booking.confirmationId);
                            }
                          }}
                          className="cursor-pointer rounded-[28px] border border-zinc-200 bg-zinc-50 p-4 shadow-sm transition hover:border-emerald-200 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-emerald-900/50 dark:hover:bg-zinc-900 md:p-5"
                        >
                          <div className="flex flex-col gap-4 md:flex-row md:items-start">
                            <Link
                              href={`/bookings/${booking.confirmationId}`}
                              onClick={(event) => event.stopPropagation()}
                              className="relative h-28 w-full overflow-hidden rounded-2xl md:h-24 md:w-28"
                            >
                              <Image
                                src={booking.propertyImage}
                                alt={booking.propertyTitle}
                                fill
                                className="object-cover"
                              />
                            </Link>

                            <div className="min-w-0 flex-1 space-y-3">
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                  <Link
                                    href={`/bookings/${booking.confirmationId}`}
                                    onClick={(event) => event.stopPropagation()}
                                    className="block truncate text-lg font-semibold text-zinc-900 transition hover:text-emerald-700 dark:text-zinc-100 dark:hover:text-emerald-300"
                                  >
                                    {booking.propertyTitle}
                                  </Link>
                                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                    {booking.propertyLocation}
                                  </p>
                                </div>
                                <span
                                  className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${categoryBadgeStyles[category]}`}
                                >
                                  {section.title}
                                </span>
                              </div>

                              <div className="grid gap-2 text-sm text-zinc-700 dark:text-zinc-300 sm:grid-cols-2">
                                <p>
                                  Stay: {formatDateLabel(booking.moveInDate)} to{" "}
                                  {formatDateLabel(booking.moveOutDate)}
                                </p>
                                <p>Booking status: {booking.status}</p>
                                <p>Reference: {booking.confirmationId}</p>
                                <p>
                                  Created on{" "}
                                  {formatDateLabel(
                                    booking.createdAt.slice(0, 10),
                                  )}
                                </p>
                              </div>

                              <div className="flex flex-wrap gap-3">
                                <Link
                                  href={`/properties/${booking.propertyId}`}
                                  onClick={(event) => event.stopPropagation()}
                                  className="inline-flex items-center justify-center rounded-2xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:border-zinc-400 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
                                >
                                  View property
                                </Link>
                                {canCancel ? (
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      void handleCancel(booking.confirmationId);
                                    }}
                                    disabled={
                                      pendingBookingId ===
                                      booking.confirmationId
                                    }
                                    className="inline-flex items-center justify-center rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:bg-zinc-400 dark:disabled:bg-zinc-700"
                                  >
                                    {pendingBookingId === booking.confirmationId
                                      ? "Cancelling..."
                                      : booking.status === "PENDING"
                                        ? "Cancel request"
                                        : "Cancel booking"}
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </section>
    </div>
  );
}
