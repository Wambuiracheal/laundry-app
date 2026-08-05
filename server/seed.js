const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const services = [
  {
    name: 'Wash & Fold',
    description: 'Everyday wear, sheets, and towels. Price per KG.',
    price_type: 'per_kg',
    base_price: 2.50,
  },
  {
    name: 'Dry Clean',
    description: 'Suits, dresses, and delicate fabrics. Price per item.',
    price_type: 'per_item',
    base_price: 5.00,
  },
  {
    name: 'Household',
    description: 'Comforters, blankets, and large curtains.',
    price_type: 'per_item',
    base_price: 12.00,
  },
  {
    name: 'Shoes',
    description: 'Deep cleaning for sneakers and leather boots.',
    price_type: 'per_pair',
    base_price: 8.50,
  },
  {
    name: 'Iron Only',
    description: 'Steam pressing for shirts and professional attire.',
    price_type: 'per_item',
    base_price: 1.50,
  },
  {
    name: 'White & Bright',
    description: 'Special whitening treatment for whites. No bleach used.',
    price_type: 'per_kg',
    base_price: 1.00,
  },
];

async function main() {
  console.log('--- Starting Seed (Prisma 5) ---');

  await prisma.service.deleteMany();
  await prisma.service.createMany({ data: services });

  console.log('✅ Success! Database seeded.');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
