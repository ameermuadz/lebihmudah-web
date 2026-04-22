import Link from "next/link";
import { cookies } from "next/headers";
import BookingsClient from "@/components/BookingsClient";
import { AUTH_COOKIE_NAME } from "@/lib/auth";
import { getSessionUser } from "@/lib/services/authService";
import { getUserBookings } from "@/lib/services/bookingService";

export default async function BookingsPage() {
  const sessionToken = cookies().get(AUTH_COOKIE_NAME)?.value;
  const session = await getSessionUser(sessionToken);

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 md:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {!session ? (
          <section className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_24px_80px_-48px_rgba(0,0,0,0.35)] dark:border-zinc-800 dark:bg-zinc-900 md:p-8">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500 dark:text-zinc-400">
              Booking dashboard
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
              Sign in to see your bookings
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
              Your pending requests, confirmed stays, past reservations, and
              cancellation controls are available after login.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                Sign Up
              </Link>
            </div>
          </section>
        ) : (
          <BookingsClient
            user={session.user}
            initialBookings={await getUserBookings(session.user.id)}
          />
        )}
      </div>
    </main>
  );
}
