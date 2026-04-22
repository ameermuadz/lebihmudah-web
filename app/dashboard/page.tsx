import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import BookingStatusSections from "@/components/BookingStatusSections";
import OwnerBookingPanel from "@/components/OwnerBookingPanel";
import { AUTH_COOKIE_NAME } from "@/lib/auth";
import { getSessionUser } from "@/lib/services/authService";
import {
  getOwnerBookings,
  getPendingBookings,
} from "@/lib/services/bookingService";
import { getPropertiesByOwner } from "@/lib/services/propertyService";

export default async function DashboardPage() {
  const sessionToken = cookies().get(AUTH_COOKIE_NAME)?.value;
  const session = await getSessionUser(sessionToken);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "OWNER") {
    redirect("/");
  }

  const [pendingBookings, ownerBookings, properties] = await Promise.all([
    getPendingBookings(session.user.id),
    getOwnerBookings(session.user.id),
    getPropertiesByOwner(session.user.id),
  ]);

  const bookingCountsByProperty = ownerBookings.reduce<
    Record<string, { pending: number; confirmed: number; cancelled: number }>
  >((counts, booking) => {
    if (!counts[booking.propertyId]) {
      counts[booking.propertyId] = {
        pending: 0,
        confirmed: 0,
        cancelled: 0,
      };
    }

    if (booking.status === "PENDING") {
      counts[booking.propertyId].pending += 1;
    } else if (booking.status === "CONFIRMED") {
      counts[booking.propertyId].confirmed += 1;
    } else {
      counts[booking.propertyId].cancelled += 1;
    }

    return counts;
  }, {});

  const confirmedBookings = ownerBookings.filter(
    (booking) => booking.status === "CONFIRMED",
  );

  const cancelledBookings = ownerBookings.filter(
    (booking) => booking.status === "CANCELLED",
  );

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_24px_80px_-48px_rgba(0,0,0,0.35)] dark:border-zinc-800 dark:bg-zinc-900 md:p-8">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500 dark:text-zinc-400">
            Owner dashboard
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
            Manage your own properties and approvals
          </h1>
          <p className="mt-3 max-w-3xl text-sm text-zinc-600 dark:text-zinc-400">
            This dashboard is only available to owner accounts. It shows the
            properties you own, the current approval queue, and your account
            contact details.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                Signed in as
              </p>
              <p className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {session.user.name}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {session.user.email}
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                Contact number
              </p>
              <p className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {session.user.phone ?? "Not provided"}
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                Pending approvals
              </p>
              <p className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {pendingBookings.length}
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                Confirmed bookings
              </p>
              <p className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {confirmedBookings.length}
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                Cancelled bookings
              </p>
              <p className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {cancelledBookings.length}
              </p>
            </div>
          </div>
        </header>

        <section className="space-y-4 rounded-[32px] border border-zinc-200 bg-white p-5 shadow-[0_24px_80px_-48px_rgba(0,0,0,0.35)] dark:border-zinc-800 dark:bg-zinc-900 md:p-6">
          <div className="flex flex-col gap-3 border-b border-zinc-200 pb-5 dark:border-zinc-800 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-zinc-500 dark:text-zinc-400">
                My properties
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                Properties owned by your account
              </h2>
            </div>
            <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
              {properties.length} propert{properties.length === 1 ? "y" : "ies"}
            </div>
          </div>

          {properties.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-zinc-300 bg-zinc-50 p-6 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
              No properties are assigned to this owner account yet.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {properties.map((property) => (
                <article
                  key={property.id}
                  className="overflow-hidden rounded-[28px] border border-zinc-200 bg-zinc-50 shadow-sm transition hover:border-emerald-200 hover:bg-white dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-emerald-900/50 dark:hover:bg-zinc-900"
                >
                  <Link href={`/properties/${property.id}`} className="block">
                    <Image
                      src={property.images[0] ?? "/mock1.svg"}
                      alt={property.title}
                      width={640}
                      height={240}
                      className="h-40 w-full object-cover"
                    />
                  </Link>
                  <div className="space-y-3 p-4">
                    <div>
                      <Link
                        href={`/properties/${property.id}`}
                        className="text-lg font-semibold text-zinc-900 transition hover:text-emerald-700 dark:text-zinc-100 dark:hover:text-emerald-300"
                      >
                        {property.title}
                      </Link>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {property.location}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-emerald-600/20 px-2 py-1 text-emerald-700 dark:text-emerald-300">
                        RM {property.price}/month
                      </span>
                      <span className="rounded-full bg-zinc-200 px-2 py-1 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                        {property.rooms} room{property.rooms > 1 ? "s" : ""}
                      </span>
                      <span className="rounded-full bg-zinc-200 px-2 py-1 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                        {property.petsAllowed ? "Pets allowed" : "No pets"}
                      </span>
                    </div>
                    <div className="grid gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                      <p>
                        <span className="text-zinc-500 dark:text-zinc-500">
                          Availability:
                        </span>{" "}
                        {property.availabilityDate}
                      </p>
                      <p>
                        <span className="text-zinc-500 dark:text-zinc-500">
                          Pending requests:
                        </span>{" "}
                        {bookingCountsByProperty[property.id]?.pending ?? 0}
                      </p>
                      <p>
                        <span className="text-zinc-500 dark:text-zinc-500">
                          Confirmed:
                        </span>{" "}
                        {bookingCountsByProperty[property.id]?.confirmed ?? 0}
                      </p>
                      <p>
                        <span className="text-zinc-500 dark:text-zinc-500">
                          Cancelled:
                        </span>{" "}
                        {bookingCountsByProperty[property.id]?.cancelled ?? 0}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <BookingStatusSections
          title="Confirmed and cancelled bookings"
          description="A full history of confirmed stays and cancelled requests across your properties."
          bookings={ownerBookings}
          visibleStatuses={["CONFIRMED", "CANCELLED"]}
        />

        <OwnerBookingPanel initialRequests={pendingBookings} />
      </div>
    </main>
  );
}
