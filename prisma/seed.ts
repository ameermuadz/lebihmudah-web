import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "../generated/prisma";
import { hashPassword } from "../lib/auth";

const prisma = new PrismaClient();

const SOURCE_YEAR = 2024;
const demoYear = new Date().getFullYear();
const yearOffset = Math.max(0, demoYear - SOURCE_YEAR);

type CsvRecord = Record<string, string>;

type SeedProperty = {
  id: string;
  title: string;
  location: string;
  price: number;
  rooms: number;
  petsAllowed: boolean;
  ownerId: string;
  description: string;
  availabilityDate: string;
  imageUrl: string;
  amenities: string[];
  rules: string[];
};

type SeedUser = {
  id?: string;
  name: string;
  email: string;
  phone?: string | null;
  role?: "USER" | "OWNER";
  password: string;
};

type SeedBooking = {
  propertyId: string;
  userEmail: string;
  moveInDate: string;
  moveOutDate: string;
  status: string;
};

const normalizeHeader = (value: string) => value.replace(/^\uFEFF/, "").trim();

const parseCsv = (content: string): CsvRecord[] => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let isInsideQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];
    const nextCharacter = content[index + 1];

    if (isInsideQuotes) {
      if (character === '"') {
        if (nextCharacter === '"') {
          currentField += '"';
          index += 1;
        } else {
          isInsideQuotes = false;
        }
      } else {
        currentField += character;
      }

      continue;
    }

    if (character === '"') {
      isInsideQuotes = true;
      continue;
    }

    if (character === ",") {
      currentRow.push(currentField);
      currentField = "";
      continue;
    }

    if (character === "\r") {
      continue;
    }

    if (character === "\n") {
      currentRow.push(currentField);
      if (currentRow.some((cell) => cell.trim().length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = "";
      continue;
    }

    currentField += character;
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.some((cell) => cell.trim().length > 0)) {
      rows.push(currentRow);
    }
  }

  const [headerRow, ...dataRows] = rows;

  if (!headerRow) {
    throw new Error("CSV file is empty");
  }

  return dataRows.map((cells) => {
    const record: CsvRecord = {};

    headerRow.forEach((columnName, index) => {
      record[normalizeHeader(columnName)] = (cells[index] ?? "").trim();
    });

    return record;
  });
};

const resolveCsvPath = (fileName: string) => {
  const candidates = [
    path.resolve(process.cwd(), fileName),
    path.resolve(process.cwd(), "..", fileName),
    path.resolve(process.cwd(), "..", "..", fileName),
  ];

  const resolvedPath = candidates.find((candidate) => existsSync(candidate));

  if (!resolvedPath) {
    throw new Error(`Unable to locate ${fileName}`);
  }

  return resolvedPath;
};

const readCsvFile = async (fileName: string) => {
  const filePath = resolveCsvPath(fileName);
  const content = await readFile(filePath, "utf8");

  return parseCsv(content);
};

const parseBoolean = (value: string) => value.trim().toLowerCase() === "true";

const parseNumber = (value: string) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid numeric value: ${value}`);
  }

  return parsed;
};

const splitList = (value: string) =>
  value
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);

const toIsoDate = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const shiftDateByYears = (value: string, offset: number) => {
  const parsedDate = new Date(`${value}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error(`Invalid date value: ${value}`);
  }

  parsedDate.setFullYear(parsedDate.getFullYear() + offset);
  return toIsoDate(parsedDate);
};

const normalizeImageUrl = (value: string) => {
  const trimmed = value.trim();

  if (!trimmed) {
    return "/mock1.svg";
  }

  const match = trimmed.match(/mock(\d+)\.(?:jpg|jpeg|png|svg|webp)$/i);

  if (!match) {
    return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  }

  const imageNumber = Number(match[1]);
  const normalizedImageNumber = ((imageNumber - 1) % 5) + 1;

  return `/mock${normalizedImageNumber}.svg`;
};

const normalizeStatus = (value: string) => value.trim().toUpperCase();

const buildOwnerProfile = (ownerId: string): SeedUser => {
  const numericId = ownerId.replace(/\D/g, "");

  return {
    id: ownerId,
    name: `Owner ${numericId}`,
    email: `owner${numericId}@lebihmudah.my`,
    phone: `+60 12-${numericId} ${numericId}`,
    role: "OWNER",
    password: `owner${numericId}123`,
  };
};

async function main() {
  const [propertyRows, userRows, bookingRows] = await Promise.all([
    readCsvFile("properties.csv"),
    readCsvFile("users.csv"),
    readCsvFile("bookings.csv"),
  ]);

  const ownerProfiles = Array.from(
    new Set(propertyRows.map((row) => row.ownerId)),
  )
    .sort()
    .map(buildOwnerProfile);

  await prisma.session.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.ownerMessage.deleteMany();
  await prisma.propertyRule.deleteMany();
  await prisma.propertyAmenity.deleteMany();
  await prisma.propertyImage.deleteMany();
  await prisma.property.deleteMany();
  await prisma.user.deleteMany();

  const createdUsers: Array<{
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: "USER" | "OWNER";
  }> = [];

  for (const owner of ownerProfiles) {
    const createdOwner = await prisma.user.create({
      data: {
        id: owner.id,
        name: owner.name,
        email: owner.email.trim().toLowerCase(),
        phone: owner.phone ?? null,
        role: "OWNER",
        passwordHash: hashPassword(owner.password),
      },
    });

    createdUsers.push(createdOwner);
  }

  for (const userRow of userRows) {
    const user: SeedUser = {
      name: userRow.name,
      email: userRow.email,
      password: userRow.password,
    };

    const createdUser = await prisma.user.create({
      data: {
        name: user.name,
        email: user.email.trim().toLowerCase(),
        phone: user.phone ?? null,
        role: user.role ?? "USER",
        passwordHash: hashPassword(user.password),
      },
    });

    createdUsers.push(createdUser);
  }

  for (const propertyRow of propertyRows) {
    const property: SeedProperty = {
      id: propertyRow.id,
      title: propertyRow.title,
      location: propertyRow.location,
      price: parseNumber(propertyRow.price),
      rooms: parseNumber(propertyRow.rooms),
      petsAllowed: parseBoolean(propertyRow.petsAllowed),
      ownerId: propertyRow.ownerId,
      description: propertyRow.description,
      availabilityDate: shiftDateByYears(
        propertyRow.availabilityDate,
        yearOffset,
      ),
      imageUrl: normalizeImageUrl(propertyRow.imageUrl),
      amenities: splitList(propertyRow.amenities),
      rules: splitList(propertyRow.rules),
    };

    await prisma.property.create({
      data: {
        id: property.id,
        title: property.title,
        location: property.location,
        price: property.price,
        rooms: property.rooms,
        petsAllowed: property.petsAllowed,
        ownerId: property.ownerId,
        description: property.description,
        availabilityDate: property.availabilityDate,
        images: {
          create: [
            {
              url: property.imageUrl,
              sortOrder: 0,
            },
          ],
        },
        amenities: {
          create: property.amenities.map((value, index) => ({
            value,
            sortOrder: index,
          })),
        },
        rules: {
          create: property.rules.map((value, index) => ({
            value,
            sortOrder: index,
          })),
        },
      },
    });
  }

  const userByEmail = new Map(
    createdUsers.map((user) => [user.email.toLowerCase(), user]),
  );

  const seedBookings: SeedBooking[] = bookingRows.map((bookingRow) => ({
    propertyId: bookingRow.propertyId,
    userEmail: bookingRow.userEmail,
    moveInDate: shiftDateByYears(bookingRow.moveInDate, yearOffset),
    moveOutDate: shiftDateByYears(bookingRow.moveOutDate, yearOffset),
    status: normalizeStatus(bookingRow.status),
  }));

  await prisma.booking.createMany({
    data: seedBookings.map((booking) => {
      const user = userByEmail.get(booking.userEmail.trim().toLowerCase());

      if (!user) {
        throw new Error(
          `Booking references unknown user email: ${booking.userEmail}`,
        );
      }

      return {
        propertyId: booking.propertyId,
        userId: user.id,
        userContact: user.email,
        moveInDate: booking.moveInDate,
        moveOutDate: booking.moveOutDate,
        status: booking.status,
      };
    }),
  });

  console.log(
    `Seeded ${ownerProfiles.length} owners, ${userRows.length} users, ${propertyRows.length} properties, and ${seedBookings.length} bookings from CSV files`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
