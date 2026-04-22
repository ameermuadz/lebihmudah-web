import { prisma } from "@/lib/db";
import {
  BookingConfirmation,
  Property,
  PropertyDetails,
  SearchPayload,
} from "@/lib/types";

type PropertyWithRelations = {
  id: string;
  title: string;
  location: string;
  price: number;
  rooms: number;
  petsAllowed: boolean;
  ownerId: string;
  description: string;
  availabilityDate: string;
  images: Array<{ url: string; sortOrder: number }>;
  amenities: Array<{ value: string; sortOrder: number }>;
  rules: Array<{ value: string; sortOrder: number }>;
  bookings?: Array<{
    id: string;
    userId: string | null;
    userContact: string;
    moveInDate: string;
    moveOutDate: string;
    status: string;
    createdAt: Date;
    user: { id: string; name: string } | null;
  }>;
};

const bySortOrder = <T extends { sortOrder: number }>(a: T, b: T) =>
  a.sortOrder - b.sortOrder;

const mapSummary = (property: PropertyWithRelations): Property => ({
  id: property.id,
  title: property.title,
  location: property.location,
  price: property.price,
  rooms: property.rooms,
  petsAllowed: property.petsAllowed,
  ownerId: property.ownerId,
  images: [...property.images].sort(bySortOrder).map((image) => image.url),
});

const mapDetails = (property: PropertyWithRelations): PropertyDetails => ({
  ...mapSummary(property),
  description: property.description,
  availabilityDate: property.availabilityDate,
  amenities: [...property.amenities]
    .sort(bySortOrder)
    .map((amenity) => amenity.value),
  rules: [...property.rules].sort(bySortOrder).map((rule) => rule.value),
  bookings: [...(property.bookings ?? [])]
    .sort((left, right) => left.moveInDate.localeCompare(right.moveInDate))
    .map<BookingConfirmation>((booking) => ({
      confirmationId: booking.id,
      propertyId: property.id,
      userContact: booking.userContact,
      moveInDate: booking.moveInDate,
      moveOutDate: booking.moveOutDate,
      status: booking.status,
      createdAt: booking.createdAt.toISOString(),
      userId: booking.userId,
      userName: booking.user?.name ?? null,
    })),
});

export async function searchProperties(
  filters: SearchPayload,
): Promise<Property[]> {
  const take =
    typeof filters.limit === "number" && Number.isFinite(filters.limit)
      ? Math.max(1, Math.min(100, Math.floor(filters.limit)))
      : undefined;

  const where = {
    ...(filters.location?.trim()
      ? { location: { contains: filters.location.trim() } }
      : {}),
    ...(typeof filters.maxPrice === "number"
      ? { price: { lte: filters.maxPrice } }
      : {}),
    ...(typeof filters.rooms === "number"
      ? { rooms: { gte: filters.rooms } }
      : {}),
    ...(typeof filters.petsAllowed === "boolean"
      ? { petsAllowed: filters.petsAllowed }
      : {}),
  };

  const properties = await prisma.property.findMany({
    where,
    ...(take ? { take } : {}),
    include: {
      images: true,
      amenities: true,
      rules: true,
    },
    orderBy: [{ price: "asc" }, { createdAt: "desc" }],
  });

  return properties.map(mapSummary);
}

export async function getPropertyDetails(
  propertyId: string,
): Promise<PropertyDetails | null> {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: {
      images: true,
      amenities: true,
      rules: true,
      bookings: {
        where: {
          status: {
            not: "CANCELLED",
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!property) {
    return null;
  }

  return mapDetails(property);
}
