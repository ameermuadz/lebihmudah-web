"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { BookingStatus } from "@/lib/types";

export type BookingStatusSectionItem = {
  confirmationId: string;
  propertyId: string;
  propertyTitle?: string | null;
  propertyLocation?: string | null;
  userContact: string;
  moveInDate: string;
  moveOutDate: string;
  status: BookingStatus;
  createdAt: string;
  userId?: string | null;
  userName?: string | null;
  loaPdfUrl?: string | null;
  loaGeneratedAt?: string | null;
};

interface BookingStatusSectionsProps {
  title: string;
  description?: string;
  bookings: BookingStatusSectionItem[];
  propertyTitle?: string;
  propertyLocation?: string;
  showPropertyLinks?: boolean;
  visibleStatuses?: BookingStatus[];
}

const STATUS_ORDER: Array<{
  value: BookingStatus;
  label: string;
  badgeClassName: string;
  borderClassName: string;
}> = [
  {
    value: "PENDING",
    label: "Pending",
    badgeClassName:
      "bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-100",
    borderClassName: "border-amber-200 dark:border-amber-900/50",
  },
  {
    value: "CONFIRMED",
    label: "Confirmed",
    badgeClassName:
      "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-100",
    borderClassName: "border-emerald-200 dark:border-emerald-900/50",
  },
  {
    value: "CANCELLED",
    label: "Cancelled",
    badgeClassName:
      "bg-rose-100 text-rose-900 dark:bg-rose-950/70 dark:text-rose-100",
    borderClassName: "border-rose-200 dark:border-rose-900/50",
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

export default function BookingStatusSections({
  title,
  description,
  bookings,
  propertyTitle,
  propertyLocation,
  showPropertyLinks = true,
  visibleStatuses = ["PENDING", "CONFIRMED", "CANCELLED"],
}: BookingStatusSectionsProps) {
  const router = useRouter();
  const sections = STATUS_ORDER.filter((section) =>
    visibleStatuses.includes(section.value),
  ).map((section) => ({
    ...section,
    items: bookings.filter((booking) => booking.status === section.value),
  }));

  return (
    <section className="space-y-4 rounded-[32px] border border-zinc-200 bg-white p-5 shadow-[0_24px_80px_-48px_rgba(0,0,0,0.35)] dark:border-zinc-800 dark:bg-zinc-900 md:p-6">
      <div className="flex flex-col gap-3 border-b border-zinc-200 pb-5 dark:border-zinc-800 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500 dark:text-zinc-400">
            Booking status
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            {title}
          </h2>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
              {description}
            </p>
          ) : null}
        </div>
        <div className="rounded-2xl bg-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
          {bookings.length} booking{bookings.length === 1 ? "" : "s"}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {sections.map((section) => (
          <div
            key={section.value}
            className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
              {section.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              {section.items.length}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        {sections.map((section) => (
          <section key={section.value} className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                  {section.label}
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {section.items.length} booking
                  {section.items.length === 1 ? "" : "s"}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${section.badgeClassName}`}
              >
                {section.label}
              </span>
            </div>

            {section.items.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-zinc-300 bg-zinc-50 p-6 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
                No {section.label.toLowerCase()} bookings yet.
              </div>
            ) : (
              <div className="grid gap-4">
                {section.items.map((booking) => {
                  const bookingPropertyTitle =
                    booking.propertyTitle ?? propertyTitle ?? "Property";
                  const bookingPropertyLocation =
                    booking.propertyLocation ?? propertyLocation ?? "";

                  return (
                    <article
                      key={booking.confirmationId}
                      role="link"
                      tabIndex={0}
                      aria-label={`Open booking details for ${bookingPropertyTitle}`}
                      onClick={() =>
                        router.push(`/bookings/${booking.confirmationId}`)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          router.push(`/bookings/${booking.confirmationId}`);
                        }
                      }}
                      className={`rounded-[28px] border bg-zinc-50 p-4 shadow-sm transition hover:bg-white dark:bg-zinc-950 dark:hover:bg-zinc-900 md:p-5 ${section.borderClassName}`}
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0 space-y-1">
                          {showPropertyLinks && booking.propertyTitle ? (
                            <Link
                              href={`/properties/${booking.propertyId}`}
                              onClick={(event) => event.stopPropagation()}
                              className="block truncate text-lg font-semibold text-zinc-900 transition hover:text-emerald-700 dark:text-zinc-100 dark:hover:text-emerald-300"
                            >
                              {bookingPropertyTitle}
                            </Link>
                          ) : (
                            <p className="truncate text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                              {bookingPropertyTitle}
                            </p>
                          )}
                          {bookingPropertyLocation ? (
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                              {bookingPropertyLocation}
                            </p>
                          ) : null}
                        </div>

                        <span
                          className={`w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${section.badgeClassName}`}
                        >
                          {section.label}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-2 text-sm text-zinc-700 dark:text-zinc-300 sm:grid-cols-2">
                        <p>
                          Stay: {formatDateLabel(booking.moveInDate)} to{" "}
                          {formatDateLabel(booking.moveOutDate)}
                        </p>
                        <p>
                          Requester: {booking.userName ?? booking.userContact}
                        </p>
                        <p>Contact: {booking.userContact}</p>
                        <p>Reference: {booking.confirmationId}</p>
                        <p>
                          Requested on{" "}
                          {formatDateLabel(booking.createdAt.slice(0, 10))}
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        ))}
      </div>
    </section>
  );
}
