import { NextRequest, NextResponse } from "next/server";
import { searchProperties } from "@/lib/services/propertyService";
import { SearchPayload } from "@/lib/types";

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
};

const toBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") {
      return true;
    }

    if (normalized === "false") {
      return false;
    }
  }

  return undefined;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      location?: unknown;
      maxPrice?: unknown;
      rooms?: unknown;
      petsAllowed?: unknown;
      limit?: unknown;
    };

    const payload: SearchPayload = {
      location:
        typeof body.location === "string" && body.location.trim()
          ? body.location.trim()
          : undefined,
      maxPrice: toNumber(body.maxPrice),
      rooms: toNumber(body.rooms),
      petsAllowed: toBoolean(body.petsAllowed),
      limit: toNumber(body.limit),
    };

    const results = await searchProperties(payload);
    return NextResponse.json(results);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to search properties: ${reason}` },
      { status: 500 },
    );
  }
}
