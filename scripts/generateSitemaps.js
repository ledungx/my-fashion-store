const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/affiliate_db?schema=public" });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const PUBLIC_DIR = path.join(__dirname, '../public');
const SITEMAP_DIR = path.join(PUBLIC_DIR, 'sitemaps');
const INDEX_XML_PATH = path.join(PUBLIC_DIR, 'sitemap.xml');
const BASE_URL = 'https://myfashionstore.com';
const CHUNK_SIZE = 50000;

async function generate() {
  console.log('🚀 Starting Massive Sitemap Generation Pipeline...');

  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  }

  // Ensure directory exists securely
  if (!fs.existsSync(SITEMAP_DIR)) {
    fs.mkdirSync(SITEMAP_DIR, { recursive: true });
  }

  let cursor = null;
  let hasMore = true;
  let sitemapIndex = 1;
  let generatedFiles = [];

  while (hasMore) {
    // 1. Fetch exact chunk using high-performance Cursors natively avoiding OOM exceptions
    const products = await prisma.product.findMany({
      take: CHUNK_SIZE,
      skip: cursor ? 1 : 0, 
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { id: 'asc' },
      select: { id: true, slug: true, updatedAt: true } // Minimum necessary fields for extreme buffer speed optimization
    });

    if (products.length === 0) {
      hasMore = false;
      break;
    }

    // 2. Build explicit XML String memory footprint efficiently natively
    let xmlContent = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    
    for (const product of products) {
      const loc = `${BASE_URL}/product/${product.slug}`;
      const lastMod = product.updatedAt.toISOString().substring(0, 10); // Extracted standard 'YYYY-MM-DD'
      xmlContent += `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastMod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    }
    xmlContent += `</urlset>`;

    // 3. Dump the chunk to File System IO
    const filename = `sitemap-${sitemapIndex}.xml`;
    fs.writeFileSync(path.join(SITEMAP_DIR, filename), xmlContent);
    generatedFiles.push(filename);

    console.log(`✅ Constructed [${filename}] consisting of ${products.length} distinct item links.`);

    // 4. Update cursor securely pushing forward
    cursor = products[products.length - 1].id;
    sitemapIndex++;
  }

  // 5. Construct the Search Master Header organically mapping the child array configurations exactly
  let indexXmlContent = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  const today = new Date().toISOString().substring(0, 10);
  
  for (const filename of generatedFiles) {
    indexXmlContent += `  <sitemap>\n    <loc>${BASE_URL}/sitemaps/${filename}</loc>\n    <lastmod>${today}</lastmod>\n  </sitemap>\n`;
  }
  indexXmlContent += `</sitemapindex>`;

  fs.writeFileSync(INDEX_XML_PATH, indexXmlContent);
  console.log(`🏁 Successfully generated master Sitemap Index aggregating ${generatedFiles.length} chunk maps perfectly.`);

  await prisma.$disconnect();
}

generate().catch((e) => {
    console.error("Critical Mapping Failure:", e);
    process.exit(1);
});
