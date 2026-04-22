import { prisma } from "@/lib/db";
import {
  BookingConfirmation,
  BookingStatus,
  Property,
  PropertyDetails,
  SearchPayload,
} from "@/lib/types";

export class PropertyAuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PropertyAuthorizationError";
  }
}

export class PropertyValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PropertyValidationError";
  }
}

export interface UpdatePropertyInput {
  title: string;
  location: string;
  price: number;
  rooms: number;
  petsAllowed: boolean;
  description: string;
  availabilityDate: string;
  amenities: string[];
  rules: string[];
}

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
  owner: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: string;
  };
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

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

const isValidIsoDate = (value: string) => {
  if (!isoDatePattern.test(value)) {
    return false;
  }

  const parsedDate = new Date(`${value}T00:00:00`);

  return !Number.isNaN(parsedDate.getTime());
};

const normalizeList = (values: string[]) =>
  values.map((value) => value.trim()).filter(Boolean);

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
      status: booking.status as BookingStatus,
      createdAt: booking.createdAt.toISOString(),
      userId: booking.userId,
      userName: booking.user?.name ?? null,
    })),
  ownerName: property.owner.name,
  ownerEmail: property.owner.email,
  ownerPhone: property.owner.phone,
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
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
        },
      },
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
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
        },
      },
      bookings: {
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

export async function getPropertiesByOwner(
  ownerId: string,
): Promise<Array<Property & { availabilityDate: string }>> {
  const properties = await prisma.property.findMany({
    where: { ownerId },
    include: {
      images: true,
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
        },
      },
      amenities: true,
      rules: true,
    },
    orderBy: [{ createdAt: "desc" }],
  });

  return properties.map((property) => ({
    ...mapSummary(property),
    availabilityDate: property.availabilityDate,
  }));
}

export async function updatePropertyByOwner(input: {
  ownerId: string;
  propertyId: string;
  data: UpdatePropertyInput;
}): Promise<PropertyDetails | null> {
  const existingProperty = await prisma.property.findUnique({
    where: { id: input.propertyId },
    select: {
      id: true,
      ownerId: true,
    },
  });

  if (!existingProperty) {
    return null;
  }

  if (existingProperty.ownerId !== input.ownerId) {
    throw new PropertyAuthorizationError(
      "You can only edit properties you own",
    );
  }

  const title = input.data.title.trim();
  const location = input.data.location.trim();
  const description = input.data.description.trim();
  const availabilityDate = input.data.availabilityDate.trim();
  const amenities = normalizeList(input.data.amenities);
  const rules = normalizeList(input.data.rules);

  if (!title || !location || !description) {
    throw new PropertyValidationError(
      "Title, location, and description are required",
    );
  }

  if (!Number.isFinite(input.data.price) || input.data.price <= 0) {
    throw new PropertyValidationError("Price must be a positive number");
  }

  if (!Number.isInteger(input.data.rooms) || input.data.rooms < 1) {
    throw new PropertyValidationError("Rooms must be at least 1");
  }

  if (!isValidIsoDate(availabilityDate)) {
    throw new PropertyValidationError(
      "availabilityDate must use the YYYY-MM-DD format",
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.property.update({
      where: { id: existingProperty.id },
      data: {
        title,
        location,
        price: Math.floor(input.data.price),
        rooms: input.data.rooms,
        petsAllowed: input.data.petsAllowed,
        description,
        availabilityDate,
      },
    });

    await tx.propertyAmenity.deleteMany({
      where: { propertyId: existingProperty.id },
    });

    if (amenities.length > 0) {
      await tx.propertyAmenity.createMany({
        data: amenities.map((value, index) => ({
          propertyId: existingProperty.id,
          value,
          sortOrder: index,
        })),
      });
    }

    await tx.propertyRule.deleteMany({
      where: { propertyId: existingProperty.id },
    });

    if (rules.length > 0) {
      await tx.propertyRule.createMany({
        data: rules.map((value, index) => ({
          propertyId: existingProperty.id,
          value,
          sortOrder: index,
        })),
      });
    }
  });

  const updatedProperty = await prisma.property.findUnique({
    where: { id: existingProperty.id },
    include: {
      images: true,
      amenities: true,
      rules: true,
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
        },
      },
      bookings: {
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

  return updatedProperty ? mapDetails(updatedProperty) : null;
}
