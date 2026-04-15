const { Worker } = require('bullmq');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ 
  connectionString: process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/affiliate_db?schema=public" 
});
const prisma = new PrismaClient({ adapter });

const connection = { host: 'localhost', port: 6379 };

console.log('📷 CDNOptimization Worker Connected to Redis: Listening for image processing jobs...');

// Concurrency of 100 ensures extremely fast async throughput
const imageWorker = new Worker('image-processor', async (job) => {
  const { productId, imageUrl } = job.data;
  
  // High-performance image normalization logic:
  // Since you are using Cloudinary / Imgix for optimized CDN delivery, 
  // you generally construct a URL prefix logic instead of saving heavy blobs to S3.
  
  // Transform standard vendor origin URL to your optimized CDN routing (MOCK)
  // e.g. "https://example.com/item.jpg" -> "https://cdn.myfashionstore.com/fetch/item.jpg"
  const cdnOptimizedUrl = imageUrl.replace(/^https?:\/\/[^\/]+/, 'https://cdn.myfashionstore.com/fetch');

  // Insert the validated & optimized link back into the `ProductImage` table asynchronously
  await prisma.productImage.create({
    data: {
      productId: productId,
      url: cdnOptimizedUrl,
      isPrimary: true, // Assuming this is the main product CSV image
      altText: "Main product optimized listing image"
    }
  });

  // Log only every 10,000 items to keep massive queues from blocking IO with console outputs
  if (job.id && Number(job.id) % 10000 === 0) {
      console.log(`✅ [WORKER] Finished processing image task ID: ${job.id}`);
  }

}, { 
  connection,
  concurrency: 100 
});

imageWorker.on('failed', (job, err) => {
  console.error(`❌ [WORKER] Job ${job ? job.id : 'unknown'} completely failed:`, err);
});
