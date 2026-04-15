import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/affiliate_db?schema=public' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function generateSlug(title: string) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

async function clean() {
  const products = await prisma.product.findMany({
     where: { name: { contains: '|' } }
  });
  console.log(`Found ${products.length} products with '|' symbol.`);
  for (const product of products) {
      const parts = product.name.split('|');
      const cleanName = parts[1].trim();
      const cleanSlug = generateSlug(cleanName);
      
      // To prevent unique constraint failures, first verify if cleanSlug already exists
      const exists = await prisma.product.findUnique({ where: { slug: cleanSlug } });
      
      if (!exists) {
           await prisma.product.update({
               where: { id: product.id },
               data: { name: cleanName, slug: cleanSlug }
           });
      }
  }
  console.log('Finished dynamically renaming legacy piped products.');
}
clean().finally(() => prisma.$disconnect());
