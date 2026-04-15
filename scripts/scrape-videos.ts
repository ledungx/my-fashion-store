import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/affiliate_db?schema=public" });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL;
const DELAY_MS = 300; // polite delay between requests
const BATCH_SIZE = 50;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function extractVideoUrl(productHandle: string): Promise<string | null> {
    try {
        const url = `${SHOPIFY_STORE_URL}/products/${productHandle}`;
        const res = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VideoScraper/1.0)' }
        });
        if (!res.ok) return null;
        const html = await res.text();

        // Primary: Extract from productVideoBox
        const boxMatch = html.match(/class="productVideoBox"[\s\S]*?<video[^>]+src="([^"]+)"/);
        if (boxMatch && boxMatch[1]) return boxMatch[1];

        // Secondary: Extract from data-src on product-feature-video
        const featureMatch = html.match(/id="product-feature-video"[^>]+(?:data-src|src)="([^"]+)"/);
        if (featureMatch && featureMatch[1]) return featureMatch[1];

        // Tertiary: Any Shopify CDN video URL
        const cdnMatch = html.match(/https?:\/\/cdn\.shopify\.com\/videos\/[^"' ]+\.mp4/);
        if (cdnMatch) return cdnMatch[0];

        return null;
    } catch (e) {
        return null;
    }
}

async function main() {
    console.log("🎬 Video URL Scraper — Scanning all products for embedded videos...\n");

    const products = await prisma.product.findMany({
        select: { id: true, name: true, slug: true, rawData: true }
    });

    console.log(`Found ${products.length} products to scan.\n`);

    let updated = 0;
    let skipped = 0;
    let noVideo = 0;

    for (let i = 0; i < products.length; i += BATCH_SIZE) {
        const batch = products.slice(i, i + BATCH_SIZE);

        for (const product of batch) {
            const raw = product.rawData as any;

            // Skip if already has videoUrl
            if (raw?.videoUrl) {
                skipped++;
                continue;
            }

            // Extract handle from originUrl or slug
            let handle = '';
            if (raw?.originUrl) {
                const handleMatch = raw.originUrl.match(/\/products\/([^?&#]+)/);
                if (handleMatch) handle = handleMatch[1];
            }
            if (!handle && raw?.handle) {
                handle = raw.handle;
            }
            if (!handle) {
                noVideo++;
                continue;
            }

            const videoUrl = await extractVideoUrl(handle);
            await delay(DELAY_MS);

            if (videoUrl) {
                await prisma.product.update({
                    where: { id: product.id },
                    data: {
                        rawData: { ...raw, videoUrl }
                    }
                });
                updated++;
                console.log(`✅ [${i + batch.indexOf(product) + 1}/${products.length}] ${product.name} → ${videoUrl.substring(0, 80)}...`);
            } else {
                noVideo++;
                if ((noVideo % 50) === 0) {
                    console.log(`⏭️  [${i + batch.indexOf(product) + 1}/${products.length}] No video (${noVideo} total so far)`);
                }
            }
        }
    }

    console.log(`\n📊 Results:`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped (already had video): ${skipped}`);
    console.log(`   No video found: ${noVideo}`);
    console.log(`   Total: ${products.length}\n`);

    await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
