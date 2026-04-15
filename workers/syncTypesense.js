const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const Typesense = require('typesense');

// Postgres Connection
const adapter = new PrismaPg({ 
  connectionString: process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/affiliate_db?schema=public" 
});
const prisma = new PrismaClient({ adapter });

// Typesense Connection
const typesense = new Typesense.Client({
  nodes: [{
    host: 'localhost',
    port: 8108,
    protocol: 'http',
  }],
  apiKey: process.env.TYPESENSE_API_KEY || 'development_api_key_123',
  connectionTimeoutSeconds: 120, // High timeout for massive batch imports just in case
});

const schema = {
  name: 'products',
  fields: [
    { name: 'id', type: 'string' },
    { name: 'name', type: 'string' },
    { name: 'slug', type: 'string' },
    { name: 'description', type: 'string', optional: true },
    { name: 'price', type: 'float', facet: true }, // Facet for price sliding
    { name: 'brandId', type: 'string', facet: true },
    { name: 'categoryId', type: 'string', facet: true },
    { name: 'color', type: 'string', facet: true, optional: true },
    { name: 'size', type: 'string', facet: true, optional: true },
    { name: 'material', type: 'string', facet: true, optional: true },
    { name: 'image_url', type: 'string', optional: true },
    { name: 'video_url', type: 'string', optional: true }
  ],
  default_sorting_field: 'price'
};

async function sync() {
  console.log('🔄 Initializing Typesense synchronization...');

  // Ensure collection schema existence
  try {
    const collections = await typesense.collections().retrieve();
    const exists = collections.find(c => c.name === 'products');
    if (!exists) {
      console.log('📦 Creating "products" collection in Typesense...');
      await typesense.collections().create(schema);
    } else {
      console.log('✅ "products" collection already exists. Hard resetting schemas for visual update...');
      await typesense.collections('products').delete();
      await typesense.collections().create(schema);
    }
  } catch (error) {
    if (error.httpStatus === 404) {
      await typesense.collections().create(schema);
    } else {
        throw error;
    }
  }

  const BATCH_SIZE = 5000;
  let cursor = null;
  let totalSynced = 0;
  let hasMore = true;

  while (hasMore) {
    // Memory-safe cursor pagination against 1M rows
    const products = await prisma.product.findMany({
      take: BATCH_SIZE,
      skip: cursor ? 1 : 0, 
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { id: 'asc' },
      include: {
         images: { take: 15 } // Expand limit to 15 to scan larger variant blocks for natively formatted JPG images
      }
    });

    if (products.length === 0) {
      hasMore = false;
      break;
    }

    // Format for Typesense
    const documents = products.map(p => {
      let color = '', size = '', material = '';
      if (p.rawData && typeof p.rawData === 'object') {
         color = p.rawData.color || '';
         size = p.rawData.size || '';
         material = p.rawData.material || '';
      }

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description || '',
        price: parseFloat(p.price) || 0,
        brandId: p.brandId,
        categoryId: p.categoryId,
        color,
        size,
        material,
        image_url: (p.images?.find(img => img.url.toLowerCase().endsWith('.jpg') || img.url.toLowerCase().includes('.jpg?'))?.url) || (p.rawData?.images?.find(img => img.src && img.src.toLowerCase().includes('.jpg'))?.src) || (p.images?.[0]?.url || ''),
        video_url: p.rawData?.videoUrl || ''
      };
    });

    // Execute bulk upsert import logic asynchronously 
    try {
        const results = await typesense.collections('products').documents().import(documents, { action: 'upsert' });
        
        // Typesense returns an array matching the order of input strings showing success/failures per row
        const failedItems = results.filter(item => item.success === false);
        if (failedItems.length > 0) {
            console.warn(`⚠️ Warning: ${failedItems.length} items failed to import in this batch`, failedItems[0]);
        }
        
    } catch (err) {
        console.error("Bulk Import Request Failed:", err);
    }

    totalSynced += products.length;
    cursor = products[products.length - 1].id;

    console.log(`✅ Indexed batch of ${products.length} products. Total: ${totalSynced.toLocaleString()}`);
  }

  console.log('🏁 Typesense Sync Pipeline Finished!');
  await prisma.$disconnect();
}

sync().catch(console.error);
