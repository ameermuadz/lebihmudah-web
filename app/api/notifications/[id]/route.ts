import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth";
import { getSessionUser } from "@/lib/services/authService";
import { markNotificationAsRead } from "@/lib/services/notificationService";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const sessionToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = await getSessionUser(sessionToken);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const notification = await markNotificationAsRead({
    notificationId: params.id,
    userId: session.user.id,
  });

  if (!notification) {
    return NextResponse.json(
      { error: "Notification not found" },
      { status: 404 },
    );
  }

  return NextResponse.json(notification);
}
