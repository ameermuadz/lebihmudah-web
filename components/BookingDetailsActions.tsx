"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { BookingStatus, UserRole } from "@/lib/types";

interface BookingDetailsActionsProps {
  bookingId: string;
  role: UserRole;
  status: BookingStatus;
  moveOutDate: string;
}

const toIsoDate = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export default function BookingDetailsActions({
  bookingId,
  role,
  status,
  moveOutDate,
}: BookingDetailsActionsProps) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<
    "confirm" | "cancel" | "renter-cancel" | null
  >(null);
  const [message, setMessage] = useState("");

  const todayIso = toIsoDate(new Date());
  const canOwnerRespond = role === "OWNER" && status === "PENDING";
  const canRenterCancel =
    role === "USER" &&
    status !== "CANCELLED" &&
    (status === "PENDING" || moveOutDate > todayIso);

  const runAction = async (action: "confirm" | "cancel" | "renter-cancel") => {
    setPendingAction(action);
    setMessage("");

    try {
      const endpoint =
        action === "renter-cancel"
          ? `/api/renter/bookings/${bookingId}`
          : `/api/owner/bookings/${bookingId}`;

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers:
          action === "renter-cancel"
            ? undefined
            : { "Content-Type": "application/json" },
        body:
          action === "renter-cancel"
            ? undefined
            : JSON.stringify({
                action: action === "confirm" ? "confirm" : "cancel",
              }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to update booking");
      }

      setMessage("Booking updated successfully.");
      router.refresh();
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      setMessage(reason);
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <section className="rounded-[28px] border border-zinc-200 bg-zinc-50 p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-xs uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
        Booking actions
      </p>

      <div className="mt-3 space-y-3">
        {message ? (
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
            {message}
          </p>
        ) : null}

        {canOwnerRespond ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => void runAction("confirm")}
              disabled={pendingAction !== null}
              className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-zinc-400 dark:disabled:bg-zinc-700"
            >
              {pendingAction === "confirm" ? "Accepting..." : "Accept booking"}
            </button>
            <button
              type="button"
              onClick={() => void runAction("cancel")}
              disabled={pendingAction !== null}
              className="inline-flex items-center justify-center rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:bg-zinc-400 dark:disabled:bg-zinc-700"
            >
              {pendingAction === "cancel" ? "Cancelling..." : "Cancel request"}
            </button>
          </div>
        ) : canRenterCancel ? (
          <button
            type="button"
            onClick={() => void runAction("renter-cancel")}
            disabled={pendingAction !== null}
            className="inline-flex items-center justify-center rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:bg-zinc-400 dark:disabled:bg-zinc-700"
          >
            {pendingAction === "renter-cancel"
              ? "Cancelling..."
              : status === "PENDING"
                ? "Cancel request"
                : "Cancel booking"}
          </button>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            No booking actions are available for this status.
          </div>
        )}
      </div>
    </section>
  );
}
