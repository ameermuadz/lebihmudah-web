"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import DateRangePicker from "@/components/DateRangePicker";
import type { BookingConfirmation } from "@/lib/types";

interface BookingPanelProps {
  propertyId: string;
  propertyTitle: string;
  availabilityDate: string;
  bookings: BookingConfirmation[];
}

interface SessionUser {
  id: string;
  name: string;
  email: string;
}

export default function BookingPanel({
  propertyId,
  propertyTitle,
  availabilityDate,
  bookings: initialBookings,
}: BookingPanelProps) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [bookings, setBookings] =
    useState<BookingConfirmation[]>(initialBookings);
  const [moveInDate, setMoveInDate] = useState("");
  const [moveOutDate, setMoveOutDate] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const formatDateLabel = (value: string) => {
    const parsedDate = new Date(`${value}T00:00:00`);

    return new Intl.DateTimeFormat("en-MY", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(parsedDate);
  };

  useEffect(() => {
    const loadUser = async () => {
      const response = await fetch("/api/auth/me", {
        cache: "no-store",
      });

      if (!response.ok) {
        setUser(null);
        return;
      }

      const data = (await response.json()) as { user?: SessionUser };
      setUser(data.user ?? null);
    };

    void loadUser();
  }, []);

  const handleBook = async () => {
    if (!user) {
      setStatus("Please log in before booking.");
      return;
    }

    if (!moveInDate || !moveOutDate) {
      setStatus("Please choose both move-in and move-out dates.");
      return;
    }

    setStatus("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/tools/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          propertyId,
          moveInDate,
          moveOutDate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Booking failed");
      }

      setBookings((currentBookings) => [...currentBookings, data]);
      setMoveInDate("");
      setMoveOutDate("");
      setStatus(
        data.status === "PENDING"
          ? `Request submitted for ${propertyTitle} from ${formatDateLabel(moveInDate)} to ${formatDateLabel(moveOutDate)}. It is now pending owner approval. Request ID: ${data.confirmationId}`
          : `Booking confirmed for ${propertyTitle} from ${formatDateLabel(moveInDate)} to ${formatDateLabel(moveOutDate)}. Confirmation ID: ${data.confirmationId}`,
      );
    } catch (bookingError) {
      const reason =
        bookingError instanceof Error ? bookingError.message : "Unknown error";
      setStatus(reason);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="space-y-4 rounded-2xl border border-zinc-300 bg-white p-6 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Request this property
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {user
            ? `Signed in as ${user.name} (${user.email})`
            : "Log in to request this property from the web UI."}
        </p>
        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
          Available from {formatDateLabel(availabilityDate)}
        </p>
      </div>

      {!user ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
          <p className="mb-2">Booking requires an account.</p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/login"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-white"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-zinc-200 px-4 py-2 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
            >
              Sign Up
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <DateRangePicker
            startDate={moveInDate}
            endDate={moveOutDate}
            minDate={availabilityDate}
            bookings={bookings}
            currentUserId={user?.id ?? null}
            onChange={({ startDate, endDate }) => {
              setMoveInDate(startDate);
              setMoveOutDate(endDate);
            }}
          />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Choose your stay in one calendar. Requests begin as pending until
            the owner confirms or cancels them.
          </p>
          {moveInDate && moveOutDate ? (
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              Selected stay: {formatDateLabel(moveInDate)} to{" "}
              {formatDateLabel(moveOutDate)}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => void handleBook()}
            disabled={isLoading || !moveInDate || !moveOutDate}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-zinc-400 dark:disabled:bg-zinc-700"
          >
            {isLoading ? "Submitting request..." : "Request booking"}
          </button>
        </div>
      )}

      {status ? (
        <p className="text-sm text-zinc-700 dark:text-zinc-300">{status}</p>
      ) : null}
    </section>
  );
}
