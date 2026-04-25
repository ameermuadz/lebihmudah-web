import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth";
import { getSessionUser } from "@/lib/services/authService";
import { getNotificationsForUser } from "@/lib/services/notificationService";

export async function GET(request: NextRequest) {
  const sessionToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = await getSessionUser(sessionToken);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const notifications = await getNotificationsForUser(session.user.id);
  const unreadOnly = request.nextUrl.searchParams.get("unreadOnly") === "true";
  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : undefined;

  const filteredNotifications = notifications.filter((notification) =>
    unreadOnly ? !notification.isRead : true,
  );

  return NextResponse.json(
    Number.isFinite(limit) && typeof limit === "number"
      ? filteredNotifications.slice(0, Math.max(0, Math.floor(limit)))
      : filteredNotifications,
  );
}
