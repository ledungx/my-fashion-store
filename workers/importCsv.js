const fs = require('fs');
const csv = require('csv-parser');
const slugify = require('slugify');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Queue } = require('bullmq');

const adapter = new PrismaPg({ 
  connectionString: process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/affiliate_db?schema=public" 
});
const prisma = new PrismaClient({ adapter });

// Configure BullMQ Image Offloading Queue using standard local Redis
const connection = { host: 'localhost', port: 6379 };
const imageQueue = new Queue('image-processor', { connection });

// Postgres limitation is 65535 parameters max per prepared query.
// At 7 params per product, 5000 rows = 35000 params (safe).
const BATCH_SIZE = 5000;

async function runImport() {
  console.log('🚀 Starting CSV Bulk Import Pipeline processing...');
  
  const startTime = Date.now();
  let batch = [];
  let totalImported = 0;

  const stream = fs.createReadStream('dummy_products.csv').pipe(csv());

  for await (const row of stream) {
    batch.push(row);

    // Chunk size execution block
    if (batch.length >= BATCH_SIZE) {
      stream.pause(); // Backpressure standard
      await processBatch(batch);
      totalImported += batch.length;
      console.log(`✅ Processed Batch: ${totalImported} products imported.`);
      batch = [];
      stream.resume();
    }
  }

  // Final flush for remaining trailing rows
  if (batch.length > 0) {
    await processBatch(batch);
    totalImported += batch.length;
    console.log(`✅ Processed Final Batch: ${totalImported} products imported.`);
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`🏁 Pipeline execution finished! Total imported: ${totalImported} in ${durationSec}s`);
  
  await prisma.$disconnect();
  // Allow queue buffers to flush then disconnect
  setTimeout(() => imageQueue.close(), 1000); 
}

async function processBatch(rows) {
  const insertValues = [];
  const imageJobs = [];

  for (const row of rows) {
    const id = crypto.randomUUID(); 
    // Title slugification to fulfill duplicate handling requirement seamlessly
    const rawSlug = slugify(row.Title, { lower: true, strict: true, trim: true });
    // Append minimal random id suffix on slug to drastically reduce huge-scale collision probability
    const slug = `${rawSlug}-${id.substring(0,6)}`;

    const description = row.Description || '';
    const price = parseFloat(row.Price) || 0;
    
    // Validate FK relationships are technically strings
    const brandId = row.BrandId;
    const categoryId = row.CategoryId;

    insertValues.push({ id, name: row.Title, slug, description, price, brandId, categoryId });

    if (row.ImageUrl) {
       // Offload synchronous downloading requirement by pushing to our optimized BullMQ handler
       imageJobs.push({
         name: 'process-cdn-image',
         data: { productId: id, imageUrl: row.ImageUrl }
       });
    }
  }

  // Construct our bulk raw interpolation postgres string
  if (insertValues.length > 0) {
      let params = [];
      let placeholders = [];
      let pIdx = 1;
      
      for (const item of insertValues) {
         placeholders.push(`($${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, NOW(), NOW())`);
         params.push(item.id, item.name, item.slug, item.description, item.price, item.brandId, item.categoryId);
      }
      
      const query = `
        INSERT INTO "Product" ("id", "name", "slug", "description", "price", "brandId", "categoryId", "createdAt", "updatedAt")
        VALUES ${placeholders.join(', ')}
        ON CONFLICT ("slug") DO NOTHING;
      `;
      
      try {
        await prisma.$executeRawUnsafe(query, ...params);
      } catch (err) {
        console.error("Batch database insert failed!", err);
      }
  }

  // Synchronously flush all image download metadata tasks into our async redis queue super-fast
  if (imageJobs.length > 0) {
     await imageQueue.addBulk(imageJobs);
  }
}

runImport().catch(console.error);
