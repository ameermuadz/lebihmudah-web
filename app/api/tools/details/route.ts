import { NextRequest, NextResponse } from "next/server";
import { getPropertyDetails } from "@/lib/services/propertyService";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      propertyId?: string;
    };

    if (!body.propertyId) {
      return NextResponse.json(
        { error: "propertyId is required" },
        { status: 400 },
      );
    }

    const property = await getPropertyDetails(body.propertyId);

    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(property);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to load property details: ${reason}` },
      { status: 500 },
    );
  }
}
