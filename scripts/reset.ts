import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Setup database connection via advanced pg driver pooling natively
const pool = new Pool({ connectionString: process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/affiliate_db?schema=public" });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function clearDatabase() {
    console.log("⚠️ WARNING: Initiating High-Performance PostgreSQL Database Wipdown...");

    try {
        console.log("🗑️ Executing Recursive TRUNCATE CASCADE...");

        // 1. Raw SQL Execute for ultra-fast table wiping (Exponentially faster than DeleteMany loops for 1M+ rows)
        // Note: PostgreSQL requires quotes around PascalCase table names mapped by Prisma's standard compiler.
        // RESTART IDENTITY resets any SERIAL auto-increment columns (not strictly needed for CUID, but standard DBA practice).
        // CASCADE automatically deletes related foreign-key rows structurally mapping dependencies safely.
        await prisma.$executeRawUnsafe(`
            TRUNCATE TABLE "ProductImage", "Product", "MenuItem", "Category", "Brand" RESTART IDENTITY CASCADE;
        `);

        console.log("✅ Database dependencies successfully flushed!");

        // 2. Verification Count 
        console.log("🔍 Running Integrity Verification Checks...");
        const productCount = await prisma.product.count();
        const categoryCount = await prisma.category.count();
        const brandCount = await prisma.brand.count();
        const menuItemCount = await prisma.menuItem.count();
        const imageCount = await prisma.productImage.count();

        // 3. Final Report Output
        console.log(`\n📊 System Integrity Report:`);
        console.log(` - Brands:        [ ${brandCount} ] rows remaining`);
        console.log(` - Categories:    [ ${categoryCount} ] rows remaining`);
        console.log(` - Products:      [ ${productCount} ] rows remaining`);
        console.log(` - MenuItem:      [ ${menuItemCount} ] rows remaining`);
        console.log(` - ProductImages: [ ${imageCount} ] rows remaining\n`);

        if (productCount === 0 && categoryCount === 0 && brandCount === 0 && menuItemCount === 0 && imageCount === 0) {
            console.log("🏁 Integrity Guaranteed: The catalog has been securely wiped and initialized at Zero.");
        } else {
            console.error("❌ Integrity Error: Truncate failed. Orphaned rows detected natively.");
        }

    } catch (error) {
        console.error("❌ Critical TRUNCATE Execution Failure:", error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

clearDatabase();
