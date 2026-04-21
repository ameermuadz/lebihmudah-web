import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const seedProperties = [
  {
    id: "p_101",
    title: "Cozy 2-Room near UM",
    location: "Universiti Malaya",
    price: 1200,
    rooms: 2,
    petsAllowed: true,
    images: ["/mock1.svg"],
    ownerId: "o_555",
    description: "Perfect for students. 5 mins walk to campus.",
    amenities: ["Aircon", "Fridge"],
    rules: ["No loud music after 10PM"],
    availabilityDate: "2026-05-01",
  },
  {
    id: "p_102",
    title: "Studio Loft in Bangsar",
    location: "Bangsar",
    price: 2100,
    rooms: 1,
    petsAllowed: false,
    images: ["/mock2.svg"],
    ownerId: "o_321",
    description: "Modern loft with great cafes downstairs.",
    amenities: ["WiFi", "Washer", "Aircon"],
    rules: ["No smoking indoors", "Max 2 occupants"],
    availabilityDate: "2026-06-15",
  },
  {
    id: "p_103",
    title: "Family Apartment near LRT",
    location: "PJ Section 13",
    price: 1800,
    rooms: 3,
    petsAllowed: true,
    images: ["/mock3.svg"],
    ownerId: "o_222",
    description: "Large unit suitable for small families.",
    amenities: ["Water Heater", "Fridge", "Parking"],
    rules: ["No parties", "Keep common area clean"],
    availabilityDate: "2026-05-20",
  },
  {
    id: "p_104",
    title: "Budget Room in Cheras",
    location: "Cheras",
    price: 850,
    rooms: 1,
    petsAllowed: false,
    images: ["/mock4.svg"],
    ownerId: "o_198",
    description: "Affordable room with quick MRT access.",
    amenities: ["Fan", "Shared Kitchen"],
    rules: ["No pets", "Quiet hours after 11PM"],
    availabilityDate: "2026-04-30",
  },
  {
    id: "p_105",
    title: "Pet-Friendly Condo in Subang",
    location: "Subang Jaya",
    price: 2600,
    rooms: 2,
    petsAllowed: true,
    images: ["/mock5.svg"],
    ownerId: "o_777",
    description: "Condo with balcony and nearby park.",
    amenities: ["Gym", "Pool", "Washer", "Dryer"],
    rules: ["Register pets with management", "No renovations"],
    availabilityDate: "2026-07-01",
  },
] as const;

async function main() {
  await prisma.ownerMessage.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.propertyRule.deleteMany();
  await prisma.propertyAmenity.deleteMany();
  await prisma.propertyImage.deleteMany();
  await prisma.property.deleteMany();

  for (const property of seedProperties) {
    const { images, amenities, rules, ...baseProperty } = property;

    await prisma.property.create({
      data: {
        ...baseProperty,
        images: {
          create: images.map((url, index) => ({
            url,
            sortOrder: index,
          })),
        },
        amenities: {
          create: amenities.map((value, index) => ({
            value,
            sortOrder: index,
          })),
        },
        rules: {
          create: rules.map((value, index) => ({
            value,
            sortOrder: index,
          })),
        },
      },
    });
  }

  console.log(`Seeded ${seedProperties.length} properties`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
