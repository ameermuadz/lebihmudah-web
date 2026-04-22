import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth";
import { getSessionUser } from "@/lib/services/authService";
import {
  PropertyAuthorizationError,
  PropertyValidationError,
  updatePropertyByOwner,
} from "@/lib/services/propertyService";

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
      title?: string;
      location?: string;
      price?: number;
      rooms?: number;
      petsAllowed?: boolean;
      description?: string;
      availabilityDate?: string;
      amenities?: string[];
      rules?: string[];
    };

    if (
      typeof body.title !== "string" ||
      typeof body.location !== "string" ||
      typeof body.price !== "number" ||
      typeof body.rooms !== "number" ||
      typeof body.petsAllowed !== "boolean" ||
      typeof body.description !== "string" ||
      typeof body.availabilityDate !== "string" ||
      !Array.isArray(body.amenities) ||
      !Array.isArray(body.rules)
    ) {
      return NextResponse.json(
        { error: "Invalid property payload" },
        { status: 400 },
      );
    }

    const property = await updatePropertyByOwner({
      ownerId: session.user.id,
      propertyId: params.id,
      data: {
        title: body.title,
        location: body.location,
        price: body.price,
        rooms: body.rooms,
        petsAllowed: body.petsAllowed,
        description: body.description,
        availabilityDate: body.availabilityDate,
        amenities: body.amenities,
        rules: body.rules,
      },
    });

    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(property);
  } catch (error) {
    if (error instanceof PropertyAuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    if (error instanceof PropertyValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const reason = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to update property: ${reason}` },
      { status: 500 },
    );
  }
}
