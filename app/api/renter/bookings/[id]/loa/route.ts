import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth";
import { getSessionUser } from "@/lib/services/authService";
import {
  BookingLoaUnavailableError,
  getBookingLoaForRenter,
} from "@/lib/services/loaService";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const sessionToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    const session = await getSessionUser(sessionToken);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "USER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const attachment = await getBookingLoaForRenter({
      bookingId: params.id,
      userId: session.user.id,
    });

    if (!attachment) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json(attachment);
  } catch (error) {
    if (error instanceof BookingLoaUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    const reason = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to load renter LOA: ${reason}` },
      { status: 500 },
    );
  }
}
