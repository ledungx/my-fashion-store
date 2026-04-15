const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Seeding initial Menus...');

    await prisma.menuItem.deleteMany({});

    const headerLinks = [
        { label: 'Home', url: '/', order: 1 },
        { label: 'Shop', url: '/search', order: 2 },
        { label: 'Elements', url: '#', order: 3 },
        { label: 'Pages', url: '#', order: 4 },
        { label: 'Vendors', url: '#', order: 5 }
    ];

    for (const link of headerLinks) {
        await prisma.menuItem.create({
            data: {
                ...link,
                position: 'HEADER'
            }
        });
    }

    const footerLinks = [
        { label: 'About Us', url: '#', order: 1 },
        { label: 'Contact', url: '#', order: 2 },
        { label: 'FAQ', url: '#', order: 3 }
    ];

    for (const link of footerLinks) {
        await prisma.menuItem.create({
            data: {
                ...link,
                position: 'FOOTER'
            }
        });
    }

    console.log('Menus successfully seeded!');
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
