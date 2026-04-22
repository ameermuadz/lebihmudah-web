import OwnerBookingPanel from "@/components/OwnerBookingPanel";
import OwnerReplyPanel from "@/components/OwnerReplyPanel";
import { getPendingBookings } from "@/lib/services/bookingService";

export default async function OwnerDashboardPage() {
  const pendingBookings = await getPendingBookings();

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 md:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_24px_80px_-48px_rgba(0,0,0,0.35)] dark:border-zinc-800 dark:bg-zinc-900 md:p-8">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500 dark:text-zinc-400">
            Owner dashboard
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
            Booking approvals and owner replies
          </h1>
          <p className="mt-3 max-w-3xl text-sm text-zinc-600 dark:text-zinc-400">
            Pending booking requests live here until an owner confirms or
            cancels them. Approved requests become confirmed bookings; cancelled
            ones move into the archived state for the user dashboard.
          </p>
        </header>

        <OwnerBookingPanel initialRequests={pendingBookings} />

        <header>
          <h2 className="text-xl font-semibold">Owner Messages</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Hidden mock panel to respond to agent-queued owner questions.
          </p>
        </header>
        <OwnerReplyPanel />
      </div>
    </main>
  );
}
