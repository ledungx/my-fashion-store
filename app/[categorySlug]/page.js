import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { notFound } from 'next/navigation';
import CategoryPageClient from './CategoryPageClient';

const { Pool } = require('pg');

let prisma;
if (process.env.NODE_ENV === 'production') {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });
} else {
  if (!global.prisma) {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    global.prisma = new PrismaClient({ adapter });
  }
  prisma = global.prisma;
}

export async function generateMetadata({ params }) {
    const { categorySlug } = await params;
    const humanName = categorySlug.replace(/-/g, ' ');

    const category = await prisma.category.findUnique({ where: { slug: categorySlug } })
        || await prisma.category.findFirst({ where: { name: { contains: humanName, mode: 'insensitive' } } });

    const title = category ? category.name : humanName.replace(/\b\w/g, c => c.toUpperCase());
    
    return {
        title: `${title} - My Fashion Store`,
        description: `Shop our curated ${title} collection. Premium styles delivered through our advanced affiliate network.`,
    };
}

export default async function CategoryPage({ params }) {
    const { categorySlug } = await params;
    const humanName = categorySlug.replace(/-/g, ' ');

    // 1. Exact slug match
    let category = await prisma.category.findUnique({ where: { slug: categorySlug } });

    // 2. Fuzzy name match
    if (!category) {
        category = await prisma.category.findFirst({
            where: { name: { contains: humanName, mode: 'insensitive' } }
        });
    }

    // 3. If we found a category, render inline with the clean URL preserved
    if (category) {
        return <CategoryPageClient categoryId={category.id} categoryName={category.name} />;
    }

    // 4. No category found — show 404
    notFound();
}
