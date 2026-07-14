const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Seed (Prisma 5) ---');
  await prisma.service.deleteMany();
  await prisma.service.createMany({
    data: [
      { name: 'Wash & Fold', pricePerKg: 5.00 },
      { name: 'Dry Cleaning', pricePerKg: 12.50 },
      { name: 'Ironing Only', pricePerKg: 3.00 },
    ],
  });
  console.log('✅ Success! Database seeded.');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());