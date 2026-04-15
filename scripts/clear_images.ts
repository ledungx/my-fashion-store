import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/affiliate_db?schema=public' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function clear() {
  await prisma.productImage.deleteMany();
  console.log('ProductImage table completely wiped! Safe for re-ingestion without destroying categories.');
}

clear().finally(() => prisma.$disconnect());
