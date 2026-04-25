import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth";
import { getSessionUser } from "@/lib/services/authService";
import { getPendingBookings } from "@/lib/services/bookingService";

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    const session = await getSessionUser(sessionToken);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const bookings = await getPendingBookings(session.user.id);
    return NextResponse.json(bookings);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to load pending bookings: ${reason}` },
      { status: 500 },
    );
  }
}
