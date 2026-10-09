const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Prices in KES
const services = [
  {
    name: 'Wash & Fold',
    description: 'Everyday wear, sheets, and towels. Price per KG. (Requires 3KG minimum)',
    price_type: 'per_kg',
    base_price: 200, // Average standard market rate per kg
  },
  {
    name: 'Dry Clean',
    description: 'Suits, dresses, and delicate fabrics. Starting price per 2-piece suit.',
    price_type: 'per_item',
    base_price: 900, // Standard 2-piece suit rate
  },
  {
    name: 'Household',
    description: 'Comforters, blankets, and duvets. Price per item.',
    price_type: 'per_item',
    base_price: 1000, // Standard duvet rate
  },
  {
    name: 'Shoes',
    description: 'Deep cleaning for sneakers and leather boots.',
    price_type: 'per_item',
    base_price: 500, // Average sneaker cleaning rate
  },
  {
    name: 'Iron Only',
    description: 'Steam pressing for shirts and professional attire.',
    price_type: 'per_item',
    base_price: 150, // Standard premium shirt press
  },
  {
    name: 'White & Bright',
    description: 'Special whitening treatment for whites. Price per KG.',
    price_type: 'per_kg',
    base_price: 300, // Premium rate for special chemical handling
  },
];

async function main() {
  console.log('--- Starting Seed ---');

  // Update in place by name rather than delete + recreate, so existing
  // order items keep pointing at valid service ids and re-runs are safe.
  for (const service of services) {
    const existing = await prisma.service.findFirst({ where: { name: service.name } });

    if (existing) {
      await prisma.service.update({ where: { id: existing.id }, data: service });
      console.log(`Updated: ${service.name} to KES ${service.base_price}`);
    } else {
      await prisma.service.create({ data: service });
      console.log(`Created: ${service.name} at KES ${service.base_price}`);
    }
  }

  console.log('Success! Database seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => await prisma.$disconnect());
