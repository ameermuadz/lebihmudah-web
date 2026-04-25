import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import NotificationsList from "@/components/NotificationsList";
import { AUTH_COOKIE_NAME } from "@/lib/auth";
import { getSessionUser } from "@/lib/services/authService";
import { getNotificationsForUser } from "@/lib/services/notificationService";

export default async function NotificationsPage() {
  const sessionToken = cookies().get(AUTH_COOKIE_NAME)?.value;
  const session = await getSessionUser(sessionToken);

  if (!session) {
    redirect("/login");
  }

  const notifications = await getNotificationsForUser(session.user.id);

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 md:p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_24px_80px_-48px_rgba(0,0,0,0.35)] dark:border-zinc-800 dark:bg-zinc-900 md:p-8">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500 dark:text-zinc-400">
            Notifications
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
            {session.user.role === "OWNER"
              ? "Owner notifications"
              : "Renter notifications"}
          </h1>
          <p className="mt-3 max-w-3xl text-sm text-zinc-600 dark:text-zinc-400">
            Click a notification to open the related booking or property page.
          </p>
        </section>

        {notifications.length === 0 ? (
          <section className="rounded-[32px] border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 md:p-8">
            You have no notifications yet.
          </section>
        ) : (
          <NotificationsList notifications={notifications} />
        )}
      </div>
    </main>
  );
}
