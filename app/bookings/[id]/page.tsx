import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { AUTH_COOKIE_NAME } from "@/lib/auth";
import { getSessionUser } from "@/lib/services/authService";
import {
  getOwnerBookings,
  getUserBookings,
} from "@/lib/services/bookingService";

const statusStyles: Record<"PENDING" | "CONFIRMED" | "CANCELLED", string> = {
  PENDING:
    "bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-100",
  CONFIRMED:
    "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-100",
  CANCELLED: "bg-rose-100 text-rose-900 dark:bg-rose-950/70 dark:text-rose-100",
};

const formatDateLabel = (value: string) => {
  const parsedDate = new Date(`${value}T00:00:00`);

  return new Intl.DateTimeFormat("en-MY", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsedDate);
};

const formatDateTimeLabel = (value: string) =>
  new Intl.DateTimeFormat("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const formatMoney = (value?: number) =>
  typeof value === "number"
    ? new Intl.NumberFormat("en-MY", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value)
    : "-";

type TimelineTone = "done" | "current" | "pending" | "cancelled";

const timelineToneStyles: Record<TimelineTone, { card: string; dot: string }> =
  {
    done: {
      card: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-100",
      dot: "bg-emerald-500",
    },
    current: {
      card: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100",
      dot: "bg-amber-500",
    },
    pending: {
      card: "border-zinc-200 bg-white text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300",
      dot: "bg-zinc-400",
    },
    cancelled: {
      card: "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-100",
      dot: "bg-rose-500",
    },
  };

export default async function BookingDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const sessionToken = cookies().get(AUTH_COOKIE_NAME)?.value;
  const session = await getSessionUser(sessionToken);

  if (!session) {
    redirect("/login");
  }

  const bookings =
    session.user.role === "OWNER"
      ? await getOwnerBookings(session.user.id)
      : await getUserBookings(session.user.id);

  const booking = bookings.find((entry) => entry.confirmationId === params.id);

  if (!booking) {
    notFound();
  }

  const backHref = session.user.role === "OWNER" ? "/dashboard" : "/bookings";
  const backLabel =
    session.user.role === "OWNER" ? "Back to dashboard" : "Back to bookings";
  const viewingLabel =
    session.user.role === "OWNER" ? "Owner view" : "Renter view";

  const bookingTimeline = [
    {
      title: "Requested",
      description: `Submitted on ${formatDateTimeLabel(booking.createdAt)}`,
      tone: "done" as TimelineTone,
    },
    {
      title:
        booking.status === "PENDING"
          ? "Awaiting approval"
          : booking.status === "CONFIRMED"
            ? "Confirmed by owner"
            : "Cancelled",
      description:
        booking.status === "PENDING"
          ? "The owner has not approved this booking yet."
          : booking.status === "CONFIRMED"
            ? "The booking is approved and the LOA is ready below."
            : "This booking was cancelled before completion.",
      tone:
        booking.status === "PENDING"
          ? "current"
          : booking.status === "CONFIRMED"
            ? "done"
            : "cancelled",
    },
    {
      title: "LOA ready",
      description:
        booking.status === "CONFIRMED"
          ? "Open the agreement panel to view the PDF."
          : "The LOA will appear after confirmation.",
      tone: booking.status === "CONFIRMED" ? "done" : "pending",
    },
  ] satisfies Array<{
    title: string;
    description: string;
    tone: TimelineTone;
  }>;

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 md:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_24px_80px_-48px_rgba(0,0,0,0.35)] dark:border-zinc-800 dark:bg-zinc-900 md:p-8">
          <div className="flex flex-col gap-4 border-b border-zinc-200 pb-5 dark:border-zinc-800 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-zinc-500 dark:text-zinc-400">
                Booking details
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
                {booking.propertyTitle}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
                {booking.propertyLocation}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                <span>{viewingLabel}</span>
                <span>•</span>
                <span>Reference {booking.confirmationId}</span>
              </div>
            </div>
            <Link
              href={backHref}
              className="inline-flex items-center justify-center rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              {backLabel}
            </Link>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
            <article className="overflow-hidden rounded-[28px] border border-zinc-200 bg-zinc-50 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <div className="relative h-72 w-full">
                <Image
                  src={booking.propertyImage}
                  alt={booking.propertyTitle}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="space-y-5 p-5 md:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
                      Stay period
                    </p>
                    <p className="mt-2 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatDateLabel(booking.moveInDate)} to{" "}
                      {formatDateLabel(booking.moveOutDate)}
                    </p>
                  </div>
                  <span
                    className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${statusStyles[booking.status]}`}
                  >
                    {booking.status}
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                      Booking created
                    </p>
                    <p className="mt-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatDateTimeLabel(booking.createdAt)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                      Booking contact
                    </p>
                    <p className="mt-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {booking.userContact}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                      Booking ID
                    </p>
                    <p className="mt-2 break-all text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {booking.confirmationId}
                    </p>
                  </div>
                </div>
              </div>
            </article>

            <aside className="space-y-4">
              <section className="rounded-[28px] border border-zinc-200 bg-zinc-50 p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
                  Status timeline
                </p>
                <div className="mt-4 space-y-3">
                  {bookingTimeline.map((step) => (
                    <div
                      key={step.title}
                      className={`rounded-2xl border px-4 py-3 ${timelineToneStyles[step.tone].card}`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`mt-1 h-2.5 w-2.5 rounded-full ${timelineToneStyles[step.tone].dot}`}
                        />
                        <div>
                          <p className="text-sm font-semibold">{step.title}</p>
                          <p className="mt-1 text-sm opacity-80">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[28px] border border-zinc-200 bg-zinc-50 p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
                  Property summary
                </p>
                <div className="mt-4 grid gap-3 text-sm text-zinc-700 dark:text-zinc-300">
                  <p>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      Rent:
                    </span>{" "}
                    RM {formatMoney(booking.propertyPrice)}/month
                  </p>
                  <p>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      Rooms:
                    </span>{" "}
                    {booking.propertyRooms ?? "-"}
                  </p>
                  <p>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      Pets:
                    </span>{" "}
                    {booking.propertyPetsAllowed ? "Allowed" : "Not allowed"}
                  </p>
                  <p>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      Availability:
                    </span>{" "}
                    {booking.propertyAvailabilityDate
                      ? formatDateLabel(booking.propertyAvailabilityDate)
                      : "-"}
                  </p>
                </div>
                <Link
                  href={`/properties/${booking.propertyId}`}
                  className="mt-5 inline-flex items-center justify-center rounded-2xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                >
                  Open property page
                </Link>
              </section>

              <section className="rounded-[28px] border border-zinc-200 bg-zinc-50 p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
                  {session.user.role === "OWNER"
                    ? "Renter details"
                    : "Your booking"}
                </p>
                <div className="mt-4 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    {booking.userName ?? booking.userContact}
                  </p>
                  <p>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      Contact:
                    </span>{" "}
                    {booking.userContact}
                  </p>
                </div>
              </section>

              {booking.status === "CONFIRMED" && booking.loaPdfUrl ? (
                <section className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-5 shadow-sm dark:border-emerald-900/60 dark:bg-emerald-950/40">
                  <p className="text-xs uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-200">
                    Open LOA
                  </p>
                  <p className="mt-3 text-sm text-emerald-900 dark:text-emerald-100">
                    This confirmed booking has a letter of agreement attached.
                  </p>
                  {booking.loaGeneratedAt ? (
                    <p className="mt-2 text-xs text-emerald-800/80 dark:text-emerald-100/80">
                      Generated on {formatDateTimeLabel(booking.loaGeneratedAt)}
                    </p>
                  ) : null}
                  <Link
                    href={booking.loaPdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
                  >
                    Open LOA PDF
                  </Link>
                </section>
              ) : null}
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
