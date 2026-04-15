const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ 
  connectionString: process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/affiliate_db?schema=public" 
});
const prisma = new PrismaClient({ adapter });

async function generate() {
  const category = await prisma.category.findFirst();
  const brand = await prisma.brand.findFirst();

  if (!category || !brand) {
    console.error("Please run the seed script first to populate some categories and brands.");
    return;
  }

  const stream = fs.createWriteStream('dummy_products.csv');
  stream.write('Title,Price,CategoryId,BrandId,ImageUrl,Description\n');

  console.log("Generating 100,000 rows in CSV for testing...");
  const TOTAL = 100000;
  for (let i = 0; i < TOTAL; i++) {
    const title = `CSV Bulk Product ${Date.now()}-${i}`;
    const price = (Math.random() * 500).toFixed(2);
    const imageUrl = `https://example.com/images/product-${i}.jpg`;
    const line = `"${title}",${price},${category.id},${brand.id},"${imageUrl}","Generic Description generated from CSV"\n`;

    // Handle backpressure
    if (!stream.write(line)) {
      await new Promise(resolve => stream.once('drain', resolve));
    }
  }

  stream.end();
  console.log("✅ Finished generating dummy_products.csv");
  await prisma.$disconnect();
}

generate().catch(console.error);
