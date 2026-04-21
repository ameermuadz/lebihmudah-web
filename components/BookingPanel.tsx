"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface BookingPanelProps {
  propertyId: string;
  propertyTitle: string;
}

interface SessionUser {
  id: string;
  name: string;
  email: string;
}

export default function BookingPanel({
  propertyId,
  propertyTitle,
}: BookingPanelProps) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [moveInDate, setMoveInDate] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

    if (!moveInDate) {
      setStatus("Please choose a move-in date.");
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
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Booking failed");
      }

      setStatus(
        `Booking confirmed for ${propertyTitle}. Confirmation ID: ${data.confirmationId}`,
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
          Book this property
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {user
            ? `Signed in as ${user.name} (${user.email})`
            : "Log in to book this property from the web UI."}
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
          <input
            value={moveInDate}
            onChange={(event) => setMoveInDate(event.target.value)}
            type="date"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-emerald-500 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
          />
          <button
            type="button"
            onClick={() => void handleBook()}
            disabled={isLoading}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-zinc-400 dark:disabled:bg-zinc-700"
          >
            {isLoading ? "Booking..." : "Confirm Booking"}
          </button>
        </div>
      )}

      {status ? (
        <p className="text-sm text-zinc-700 dark:text-zinc-300">{status}</p>
      ) : null}
    </section>
  );
}
