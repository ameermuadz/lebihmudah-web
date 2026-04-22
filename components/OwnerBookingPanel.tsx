"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { BookingListItem } from "@/lib/types";

interface OwnerBookingPanelProps {
  initialRequests: BookingListItem[];
}

const formatDateLabel = (value: string) => {
  const parsedDate = new Date(`${value}T00:00:00`);

  return new Intl.DateTimeFormat("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
};

export default function OwnerBookingPanel({
  initialRequests,
}: OwnerBookingPanelProps) {
  const [requests, setRequests] = useState(initialRequests);
  const [status, setStatus] = useState("");
  const [pendingAction, setPendingAction] = useState<{
    id: string;
    action: "confirm" | "cancel";
  } | null>(null);

  const handleDecision = async (
    booking: BookingListItem,
    action: "confirm" | "cancel",
  ) => {
    setPendingAction({ id: booking.confirmationId, action });
    setStatus("");

    try {
      const response = await fetch(
        `/api/owner/bookings/${booking.confirmationId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action }),
        },
      );

      const data = (await response.json()) as
        | BookingListItem
        | { error?: string };

      if (!response.ok) {
        throw new Error(
          data && "error" in data && data.error
            ? data.error
            : "Unable to update booking",
        );
      }

      setRequests((currentRequests) =>
        currentRequests.filter(
          (request) => request.confirmationId !== booking.confirmationId,
        ),
      );
      setStatus(
        action === "confirm"
          ? `Confirmed booking request for ${booking.propertyTitle}.`
          : `Cancelled booking request for ${booking.propertyTitle}.`,
      );
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      setStatus(reason);
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <section className="space-y-4 rounded-[32px] border border-zinc-200 bg-white p-5 shadow-[0_24px_80px_-48px_rgba(0,0,0,0.35)] dark:border-zinc-800 dark:bg-zinc-900 md:p-6">
      <div className="flex flex-col gap-3 border-b border-zinc-200 pb-5 dark:border-zinc-800 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500 dark:text-zinc-400">
            Approval queue
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            Pending booking requests
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
            These requests are on hold. Confirming moves them to confirmed;
            cancelling releases the slot and marks the request as cancelled.
          </p>
        </div>
        <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 dark:bg-amber-950/50 dark:text-amber-100">
          {requests.length} pending request{requests.length === 1 ? "" : "s"}
        </div>
      </div>

      {status ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
          {status}
        </p>
      ) : null}

      {requests.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-zinc-300 bg-zinc-50 p-6 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
          No pending booking requests right now.
        </div>
      ) : (
        <div className="grid gap-4">
          {requests.map((booking) => (
            <article
              key={booking.confirmationId}
              className="rounded-[28px] border border-zinc-200 bg-zinc-50 p-4 shadow-sm transition hover:border-amber-200 hover:bg-white dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-amber-900/50 dark:hover:bg-zinc-900 md:p-5"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start">
                <Link
                  href={`/properties/${booking.propertyId}`}
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
                        href={`/properties/${booking.propertyId}`}
                        className="block truncate text-lg font-semibold text-zinc-900 transition hover:text-amber-700 dark:text-zinc-100 dark:hover:text-amber-300"
                      >
                        {booking.propertyTitle}
                      </Link>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {booking.propertyLocation}
                      </p>
                    </div>
                    <span className="inline-flex w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-900 dark:bg-amber-950/70 dark:text-amber-100">
                      Pending
                    </span>
                  </div>

                  <div className="grid gap-2 text-sm text-zinc-700 dark:text-zinc-300 sm:grid-cols-2">
                    <p>
                      Stay: {formatDateLabel(booking.moveInDate)} to{" "}
                      {formatDateLabel(booking.moveOutDate)}
                    </p>
                    <p>Requester: {booking.userName ?? booking.userContact}</p>
                    <p>Reference: {booking.confirmationId}</p>
                    <p>
                      Requested on{" "}
                      {formatDateLabel(booking.createdAt.slice(0, 10))}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => void handleDecision(booking, "confirm")}
                      disabled={pendingAction?.id === booking.confirmationId}
                      className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-zinc-400 dark:disabled:bg-zinc-700"
                    >
                      {pendingAction?.id === booking.confirmationId &&
                      pendingAction.action === "confirm"
                        ? "Confirming..."
                        : "Confirm"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDecision(booking, "cancel")}
                      disabled={pendingAction?.id === booking.confirmationId}
                      className="inline-flex items-center justify-center rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:bg-zinc-400 dark:disabled:bg-zinc-700"
                    >
                      {pendingAction?.id === booking.confirmationId &&
                      pendingAction.action === "cancel"
                        ? "Cancelling..."
                        : "Cancel request"}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
