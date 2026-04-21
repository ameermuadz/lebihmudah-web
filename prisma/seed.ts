import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type SeedProperty = {
  id: string;
  title: string;
  location: string;
  price: number;
  rooms: number;
  petsAllowed: boolean;
  images: string[];
  ownerId: string;
  description: string;
  amenities: string[];
  rules: string[];
  availabilityDate: string;
};

const baseSeedProperties: SeedProperty[] = [
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
];

const locations = [
  "Universiti Malaya",
  "Bangsar",
  "PJ Section 13",
  "Cheras",
  "Subang Jaya",
  "Setapak",
  "Mont Kiara",
  "Shah Alam",
  "Kepong",
  "Puchong",
  "Damansara",
  "KL Sentral",
];

const titlePrefixes = [
  "Modern Studio",
  "Cozy Suite",
  "City Apartment",
  "Family Condo",
  "Budget Unit",
  "Garden Residence",
  "Loft",
  "Urban Home",
];

const amenityPool = [
  "Aircon",
  "Fridge",
  "WiFi",
  "Water Heater",
  "Parking",
  "Washing Machine",
  "Gym",
  "Pool",
  "Study Desk",
  "Microwave",
  "Balcony",
  "Wardrobe",
];

const rulePool = [
  "No smoking indoors",
  "No loud music after 10PM",
  "Keep shared areas clean",
  "Maximum 3 occupants",
  "No short-term subletting",
  "Pets must be registered",
  "Quiet hours after 11PM",
  "No parties",
];

const mockImages = [
  "/mock1.svg",
  "/mock2.svg",
  "/mock3.svg",
  "/mock4.svg",
  "/mock5.svg",
];

const buildAvailabilityDate = (offset: number) => {
  const month = ((offset % 12) + 1).toString().padStart(2, "0");
  const day = ((offset % 28) + 1).toString().padStart(2, "0");
  return `2026-${month}-${day}`;
};

const generatedSeedProperties: SeedProperty[] = Array.from(
  { length: 240 },
  (_, index) => {
    const propertyNumber = 106 + index;
    const location = locations[index % locations.length];
    const rooms = (index % 4) + 1;
    const petsAllowed = index % 3 !== 0;
    const price = 750 + ((index * 67) % 2600);
    const ownerId = `o_${900 + propertyNumber}`;

    const amenities = [
      amenityPool[index % amenityPool.length],
      amenityPool[(index + 3) % amenityPool.length],
      amenityPool[(index + 7) % amenityPool.length],
    ];

    const rules = [
      rulePool[index % rulePool.length],
      rulePool[(index + 4) % rulePool.length],
    ];

    return {
      id: `p_${propertyNumber}`,
      title: `${titlePrefixes[index % titlePrefixes.length]} ${rooms}-Room in ${location}`,
      location,
      price,
      rooms,
      petsAllowed,
      images: [mockImages[index % mockImages.length]],
      ownerId,
      description: `Comfortable ${rooms}-room unit in ${location} suitable for renters looking for quick access to transit and daily essentials.`,
      amenities,
      rules,
      availabilityDate: buildAvailabilityDate(index + 1),
    };
  },
);

const seedProperties: SeedProperty[] = [
  ...baseSeedProperties,
  ...generatedSeedProperties,
];

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
