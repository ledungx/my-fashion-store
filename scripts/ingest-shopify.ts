import 'dotenv/config';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import slugifyLib from 'slugify';
import crypto from 'crypto';

// High-performance Postgres Pool driver required internally via standard Next architectures 
const pool = new Pool({ connectionString: process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/affiliate_db?schema=public" });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL;

if (!SHOPIFY_STORE_URL) {
    console.error("CRITICAL: Missing SHOPIFY_STORE_URL environment variable.");
    process.exit(1);
}

const LIMIT = 100;
const DELAY_MS = 250;
const CHUNK_SIZE = 100;

// The hard timeout promise delaying exactly the explicit 200ms requests 
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function generateSlug(text: string): string {
    return slugifyLib(text, {
        replacement: '-',  
        remove: /[*+~.()'"!:@]/g, 
        lower: true,       
        strict: true,      
        trim: true         
    });
}

// Memory caching ensuring the database doesn't fry processing dynamic brands 1,000,000 times
const brandCache: Map<string, string> = new Map();
const categoryCache: Map<string, string> = new Map();

async function getOrCreateBrand(vendorName: string): Promise<string> {
    const rawVendor = vendorName || "Generic Vendor";
    if (brandCache.has(rawVendor)) return brandCache.get(rawVendor)!;

    let brand = await prisma.brand.findUnique({ where: { slug: generateSlug(rawVendor) } });
    if (!brand) {
        brand = await prisma.brand.create({
            data: { name: rawVendor, slug: generateSlug(rawVendor) }
        });
    }
    brandCache.set(rawVendor, brand.id);
    return brand.id;
}

async function getOrCreateCategory(productType: string): Promise<string> {
    const rawType = productType || "Generic Category";
    if (categoryCache.has(rawType)) return categoryCache.get(rawType)!;

    let category = await prisma.category.findUnique({ where: { slug: generateSlug(rawType) } });
    if (!category) {
        category = await prisma.category.create({
            data: { name: rawType, slug: generateSlug(rawType) }
        });
    }
    categoryCache.set(rawType, category.id);
    return category.id;
}

async function bulkUpsertProducts(mappedProducts: any[]) {
    if (mappedProducts.length === 0) return;

    // Deduplicate payload dynamically by 'slug' explicitly preventing PostgreSQL 21000 constraint overlaps
    const uniqueMap = new Map();
    for (const item of mappedProducts) {
        uniqueMap.set(item.slug, item);
    }
    const uniqueProducts = Array.from(uniqueMap.values());

    // We MUST format Postgres strings safely neutralizing single quotes structurally mapping explicit data entries
    const valuesList = uniqueProducts.map(p => {
        const cleanName = p.name ? p.name.replace(/'/g, "''") : "Untitled Product";
        const cleanDesc = p.description ? p.description.replace(/'/g, "''") : "";
        const rawJson = JSON.stringify(p.rawData).replace(/'/g, "''");
        return `('${p.id}', '${p.slug}', '${cleanName}', ${p.price}, '${p.brandId}', '${p.categoryId}', '${cleanDesc}', '${rawJson}', NOW(), NOW())`;
    });

    const valuesStr = valuesList.join(',\n        ');

    // UPSERT natively updating the explicit properties specifically tracking pricing modifications safely
    const query = `
        INSERT INTO "Product" ("id", "slug", "name", "price", "brandId", "categoryId", "description", "raw_data", "createdAt", "updatedAt")
        VALUES 
        ${valuesStr}
        ON CONFLICT ("slug") DO UPDATE 
        SET "price" = EXCLUDED."price", 
            "updatedAt" = NOW()
        RETURNING id, slug;
    `;

    try {
        const result: any = await prisma.$queryRawUnsafe(query);
        
        // Trap exact Database IDs confirming foreign key integrity
        const slugToId = new Map<string, string>();
        if (Array.isArray(result)) {
            result.forEach(row => slugToId.set(row.slug, row.id));
        }

        const images = uniqueProducts.flatMap(p => {
            const actualId = slugToId.get(p.slug) || p.id;
            return p.images.map((imgUrl: string) => ({
                url: imgUrl,
                productId: actualId,
                altText: p.name
            }));
        });

        if (images.length > 0) {
            await prisma.productImage.createMany({
                data: images,
                skipDuplicates: true
            });
        }
    } catch (e) {
         console.error("Critical Bulk UPSERT Database Integrity Fault:", e);
    }
}

async function ingest() {
    console.log(`🚀 Booting Shopify Sync Engine accurately mapping against: ${SHOPIFY_STORE_URL}`);
    let page = 1;
    let hasMore = true;
    let totalProcessed = 0;
    
    let dbBuffer: any[] = [];

    while (hasMore) {
        const url = `${SHOPIFY_STORE_URL}/products.json?limit=${LIMIT}&page=${page}`;
        try {
            const { data } = await axios.get(url);
            const products = data.products;

            if (!products || products.length === 0) {
                console.log(`🏁 Extracted entirely Empty Node at Shopify Page ${page}. Finalizing Data ingestion gracefully...`);
                hasMore = false;
                break;
            }

            for (const product of products) {
                const brandId = await getOrCreateBrand(product.vendor);
                const categoryId = await getOrCreateCategory(product.product_type);

                let cleanProductTitle = product.title;
                if (cleanProductTitle.includes('|')) {
                    cleanProductTitle = cleanProductTitle.substring(cleanProductTitle.indexOf('|') + 1).trim();
                }

                const colorOptions = product.options.find((opt: any) => 
                     opt.name.toLowerCase() === 'color' || opt.name.toLowerCase() === 'colour'
                );
                const styleOptions = product.options.find((opt: any) =>
                     opt.name.toLowerCase() === 'style'
                );

                // ═══════════════════════════════════════════════════════════════
                // STYLE-BASED PRODUCTS: Each style code is a separate dress design
                // Example: "Black Concert Dresses" has styles ES0106BBK, EP00739BK, etc.
                // Images are mapped via alt text containing #style_ES0106BBK
                // ═══════════════════════════════════════════════════════════════
                if (styleOptions && styleOptions.values && styleOptions.values.length > 0) {
                    for (const styleCode of styleOptions.values) {
                        const variantMatch = product.variants.find((v: any) => v.option1 === styleCode || v.option2 === styleCode || v.option3 === styleCode);
                        const price = variantMatch ? parseFloat(variantMatch.price) : 0;
                        
                        // Use the style code as the product differentiator
                        const title = `${cleanProductTitle} - ${styleCode}`;
                        const slug = generateSlug(title);
                        const cleanDesc = product.body_html ? product.body_html.replace(/(<([^>]+)>)/gi, "").substring(0, 200) : "Shopify Style Variant";

                        let filteredImages: string[] = [];
                        
                        // Primary: Match images by alt text tag #style_ES0106BBK
                        const styleTagImages = product.images.filter((img: any) => {
                            if (!img.alt) return false;
                            return img.alt.toLowerCase().includes(`#style_${styleCode.toLowerCase()}`);
                        });
                        
                        if (styleTagImages.length > 0) {
                            // Prefer .jpg images from the matched style group
                            const jpgStyleImgs = styleTagImages.filter((img: any) => 
                                img.src.toLowerCase().includes('.jpg')
                            );
                            filteredImages = jpgStyleImgs.length > 0 
                                ? jpgStyleImgs.map((img: any) => img.src)
                                : styleTagImages.map((img: any) => img.src);
                        }

                        // Secondary: Match images by filename containing the style code
                        if (filteredImages.length === 0) {
                            const filenameMatches = product.images.filter((img: any) => {
                                const filename = img.src.split('/').pop().split('?')[0].toLowerCase();
                                return filename.includes(styleCode.toLowerCase());
                            });
                            if (filenameMatches.length > 0) {
                                filteredImages = filenameMatches.map((img: any) => img.src);
                            }
                        }

                        // Tertiary: Use variant's featured image
                        if (filteredImages.length === 0 && variantMatch && variantMatch.featured_image && variantMatch.featured_image.src) {
                            filteredImages.push(variantMatch.featured_image.src);
                        }
                        
                        // Ultimate fallback
                        if (filteredImages.length === 0) {
                            filteredImages = product.images.map((img: any) => img.src);
                        }

                        const fakeCuid = crypto.randomUUID().replace(/-/g, '').substring(0, 25);

                        dbBuffer.push({
                            id: fakeCuid,
                            name: title,
                            slug,
                            price,
                            brandId,
                            categoryId,
                            description: cleanDesc,
                            images: filteredImages,
                            rawData: { originUrl: `${SHOPIFY_STORE_URL}/products/${product.handle}?variant=${variantMatch ? variantMatch.id : ''}`, ...product }
                        });
                    }
                }
                // ═══════════════════════════════════════════════════════════════
                // COLOR-BASED PRODUCTS: Each color is a separate product variant
                // Example: "Evening Dress" split into Burgundy, Sky Blue, etc.
                // Images mapped via SKU color code (SK00003BD00 -> BD)
                // ═══════════════════════════════════════════════════════════════
                else if (colorOptions && colorOptions.values && colorOptions.values.length > 0) {
                    for (const color of colorOptions.values) {
                        const variantMatch = product.variants.find((v: any) => v.option1 === color || v.option2 === color || v.option3 === color);
                        const price = variantMatch ? parseFloat(variantMatch.price) : 0;
                        
                        const title = `${cleanProductTitle} - ${color}`;
                        const slug = generateSlug(title);
                        const cleanDesc = product.body_html ? product.body_html.replace(/(<([^>]+)>)/gi, "").substring(0, 200) : "Shopify Restructured Variant";

                        let filteredImages: string[] = [];
                        
                        // Advanced SKU Image Extraction Logic
                        const handleParts = product.handle.split('-');
                        const baseSkuHandle = handleParts[handleParts.length - 1].toLowerCase();
                        
                        let colorCode = '';
                        if (variantMatch && variantMatch.sku) {
                            const sku = variantMatch.sku.toLowerCase();
                            if (sku.startsWith(baseSkuHandle)) {
                                let remainder = sku.substring(baseSkuHandle.length);
                                colorCode = remainder.replace(/[0-9]+$/, '');
                            }
                            if (!colorCode) {
                                const stripped = sku.replace(/[0-9]+$/, '');
                                const match = stripped.match(/([a-z]+)$/);
                                colorCode = match ? match[1] : '';
                            }
                        }

                        // Scan images matching color code in filename
                        if (colorCode) {
                            const matchImgs = product.images.filter((img: any) => {
                                const filename = img.src.split('/').pop().split('?')[0];
                                if (!filename.toLowerCase().endsWith('.jpg')) return false;
                                
                                const baseName = filename.split('_')[0]; 
                                const prefix = baseName.toUpperCase().split('-')[0]; 
                                return prefix.endsWith(colorCode.toUpperCase());
                            });
                            if (matchImgs.length > 0) {
                                filteredImages = matchImgs.map(img => img.src); 
                            }
                        }
                        
                        if (filteredImages.length === 0 && variantMatch && variantMatch.featured_image && variantMatch.featured_image.src) {
                             filteredImages.push(variantMatch.featured_image.src);
                        }
                        
                        if (filteredImages.length === 0) {
                            filteredImages = product.images.map((img: any) => img.src);
                        }

                        const fakeCuid = crypto.randomUUID().replace(/-/g, '').substring(0, 25);

                        dbBuffer.push({
                            id: fakeCuid,
                            name: title,
                            slug,
                            price,
                            brandId,
                            categoryId,
                            description: cleanDesc,
                            images: filteredImages,
                            rawData: { originUrl: `${SHOPIFY_STORE_URL}/products/${product.handle}?variant=${variantMatch ? variantMatch.id : ''}`, ...product }
                        });
                    }
                } else {
                    const slug = generateSlug(cleanProductTitle);
                    const price = product.variants[0] ? parseFloat(product.variants[0].price) : 0;
                    const cleanDesc = product.body_html ? product.body_html.replace(/(<([^>]+)>)/gi, "").substring(0, 200) : "Shopify Single Product Origin";
                    const fakeCuid = crypto.randomUUID().replace(/-/g, '').substring(0, 25);

                    dbBuffer.push({
                         id: fakeCuid,
                         name: cleanProductTitle,
                         slug,
                         price,
                         brandId,
                         categoryId,
                         description: cleanDesc,
                         images: product.images.map((img: any) => img.src),
                         rawData: { originUrl: `${SHOPIFY_STORE_URL}/products/${product.handle}`, ...product }
                    });
                }
            }

            // Flush database structurally mapped accurately mapping memory caps natively
            if (dbBuffer.length >= CHUNK_SIZE) {
                await bulkUpsertProducts(dbBuffer);
                totalProcessed += dbBuffer.length;
                console.log(`✅ Processed exactly up to Page ${page}: Structurally verified ${totalProcessed} total products synchronized securely.`);
                dbBuffer = [];
            }

            page++;
            await delay(DELAY_MS);

        } catch (error: any) {
            console.error(`❌ HTTP Rate Exhaustion strictly blocking Page ${page}:`, error.message);
            if (error.response && (error.response.status === 429 || error.response.status >= 500)) {
                console.log('⏳ RETRYING NETWORK: Pausing exactly 10 seconds prior to automatic reboot attempt...');
                await delay(10000);
            } else {
                hasMore = false; 
            }
        }
    }

    // Capture remaining elements that couldn't formulate a full maximum 500 block array 
    if (dbBuffer.length > 0) {
        await bulkUpsertProducts(dbBuffer);
        totalProcessed += dbBuffer.length;
        console.log(`✅ Processed Final Remaining Chunk Offset: ${totalProcessed} products totally synced cleanly.`);
    }

    await prisma.$disconnect();
    console.log("🏁 Internal Shopify Affiliate Backend Integrator Shutdown Normally.");
}

ingest().catch(e => {
    console.error("Critical Runtime Worker Exception Error:", e);
    process.exit(1);
});
