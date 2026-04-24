import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth";
import {
  BookingConflictError,
  BookingRangeError,
  createBooking,
} from "@/lib/services/bookingService";
import { getSessionUser } from "@/lib/services/authService";
import { BookingPayload } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = (await request
      .json()
      .catch(() => ({}))) as Partial<BookingPayload>;

    const sessionToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    const session = await getSessionUser(sessionToken);

    if (!body.propertyId || !body.moveInDate || !body.moveOutDate) {
      return NextResponse.json(
        { error: "propertyId, moveInDate, and moveOutDate are required" },
        { status: 400 },
      );
    }

    const moveIn = new Date(body.moveInDate);
    const moveOut = new Date(body.moveOutDate);

    if (isNaN(moveIn.getTime()) || isNaN(moveOut.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 },
      );
    }

    if (moveOut <= moveIn) {
      return NextResponse.json(
        { error: "Move-out date must be strictly later than move-in date" },
        { status: 400 },
      );
    }

    const userContact = session?.user.email ?? body.userContact;

    if (!userContact) {
      return NextResponse.json(
        { error: "userContact is required when not logged in" },
        { status: 401 },
      );
    }

    const booking = await createBooking({
      propertyId: body.propertyId,
      userId: session?.user.id ?? null,
      userContact,
      moveInDate: body.moveInDate,
      moveOutDate: body.moveOutDate,
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(booking);
  } catch (error) {
    if (error instanceof BookingConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    if (error instanceof BookingRangeError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const reason = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to create booking: ${reason}` },
      { status: 500 },
    );
  }
}
