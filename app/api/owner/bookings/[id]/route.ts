import { NextRequest, NextResponse } from "next/server";
import {
  BookingConflictError,
  BookingTransitionError,
  updateBookingStatus,
} from "@/lib/services/bookingService";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
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
