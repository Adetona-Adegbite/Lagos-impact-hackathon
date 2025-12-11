import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  // Create sample products
  const products = [
    {
      name: 'Milk',
      barcode: '123456789',
      category: 'Dairy',
      sellingPrice: 1.50,
      purchasePrice: 1.00,
      quantity: 50,
    },
    {
      name: 'Bread',
      barcode: '987654321',
      category: 'Bakery',
      sellingPrice: 2.00,
      purchasePrice: 1.20,
      quantity: 30,
    },
    {
      name: 'Eggs (Dozen)',
      barcode: '456123789',
      category: 'Dairy',
      sellingPrice: 3.50,
      purchasePrice: 2.50,
      quantity: 20,
    },
  ];

  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { barcode: p.barcode },
      update: {},
      create: {
        name: p.name,
        barcode: p.barcode,
        category: p.category,
        sellingPrice: p.sellingPrice,
        purchasePrice: p.purchasePrice,
        inventory: {
          create: {
            quantity: p.quantity,
          },
        },
      },
    });
    console.log(`Created product with id: ${product.id}`);
  }

  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
