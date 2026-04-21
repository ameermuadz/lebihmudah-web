import { NextRequest, NextResponse } from "next/server";
import { createBooking } from "@/lib/services/bookingService";
import { BookingPayload } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = (await request
      .json()
      .catch(() => ({}))) as Partial<BookingPayload>;

    if (!body.propertyId || !body.userContact || !body.moveInDate) {
      return NextResponse.json(
        { error: "propertyId, userContact, and moveInDate are required" },
        { status: 400 },
      );
    }

    const booking = await createBooking({
      propertyId: body.propertyId,
      userContact: body.userContact,
      moveInDate: body.moveInDate,
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(booking);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to create booking: ${reason}` },
      { status: 500 },
    );
  }
}
