const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ 
  connectionString: process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/affiliate_db?schema=public" 
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🚀 Starting seed process...');

  // 1. Create Categories
  console.log('📦 Seeding 100 Categories...');
  const categories = [];
  for (let i = 0; i < 100; i++) {
    categories.push({
      name: `Category ${i}`,
      slug: `category-${i}`,
    });
  }
  await prisma.category.createMany({ data: categories, skipDuplicates: true });
  const categoryRecords = await prisma.category.findMany({ select: { id: true } });

  // 2. Create Brands
  console.log('🏷️ Seeding 1,000 Brands...');
  const brands = [];
  for (let i = 0; i < 1000; i++) {
    brands.push({
      name: `Brand ${i}`,
      slug: `brand-${i}`,
    });
  }
  await prisma.brand.createMany({ data: brands, skipDuplicates: true });
  const brandRecords = await prisma.brand.findMany({ select: { id: true } });

  // 3. Create Products in batches
  const TOTAL_PRODUCTS = 1000000;
  const BATCH_SIZE = 10000; // Optimal batch size for PostgreSQL
  console.log(`🛍️ Seeding ${TOTAL_PRODUCTS.toLocaleString()} products in batches of ${BATCH_SIZE.toLocaleString()}...`);

  for (let i = 0; i < TOTAL_PRODUCTS / BATCH_SIZE; i++) {
    const products = [];
    for (let j = 0; j < BATCH_SIZE; j++) {
      const globalIndex = i * BATCH_SIZE + j;
      
      // Pick random relations
      const randomCategory = categoryRecords[Math.floor(Math.random() * categoryRecords.length)];
      const randomBrand = brandRecords[Math.floor(Math.random() * brandRecords.length)];

      products.push({
        name: `Product ${globalIndex}`,
        slug: `product-${globalIndex}`,
        description: `This is an auto-generated description for product ${globalIndex}.`,
        price: (Math.random() * 1000).toFixed(2),
        brandId: randomBrand.id,
        categoryId: randomCategory.id,
        // Adding variability in the JSONB field for search engine testing
        rawData: {
          color: ['Red', 'Blue', 'Green', 'Black', 'White'][Math.floor(Math.random() * 5)],
          size: ['S', 'M', 'L', 'XL', 'XXL'][Math.floor(Math.random() * 5)],
          material: ['Cotton', 'Polyester', 'Wool', 'Silk'][Math.floor(Math.random() * 4)],
        }
      });
    }

    // Insert 10,000 product records into the DB in one query
    await prisma.product.createMany({
      data: products,
      skipDuplicates: true,
    });

    console.log(`✅ Inserted batch ${i + 1}/${Math.ceil(TOTAL_PRODUCTS / BATCH_SIZE)} | Total: ${((i + 1) * BATCH_SIZE).toLocaleString()}`);
  }

  console.log('🏁 Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
