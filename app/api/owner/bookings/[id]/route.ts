import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth";
import { getSessionUser } from "@/lib/services/authService";
import {
  BookingConflictError,
  BookingAuthorizationError,
  BookingTransitionError,
  updateBookingStatus,
} from "@/lib/services/bookingService";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const sessionToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    const session = await getSessionUser(sessionToken);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      action?: "confirm" | "cancel";
    };

    if (body.action !== "confirm" && body.action !== "cancel") {
      return NextResponse.json(
        { error: "action must be confirm or cancel" },
        { status: 400 },
      );
    }

    const booking = await updateBookingStatus({
      bookingId: params.id,
      ownerId: session.user.id,
      status: body.action === "confirm" ? "CONFIRMED" : "CANCELLED",
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json(booking);
  } catch (error) {
    if (error instanceof BookingConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    if (error instanceof BookingAuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    if (error instanceof BookingTransitionError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const reason = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to update booking: ${reason}` },
      { status: 500 },
    );
  }
}
