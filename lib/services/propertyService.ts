import { prisma } from "@/lib/db";
import { Property, PropertyDetails, SearchPayload } from "@/lib/types";

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
});

export async function searchProperties(
  filters: SearchPayload,
): Promise<Property[]> {
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
    },
  });

  if (!property) {
    return null;
  }

  return mapDetails(property);
}
