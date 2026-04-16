import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import Link from 'next/link';
import PinterestManager from '../../../components/PinterestManager';
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

export const revalidate = 0;

export default async function AdminPinterestPage() {
  const [account, boards, categories, pinStats] = await Promise.all([
    prisma.pinterestAccount.findFirst(),
    prisma.pinterestBoard.findMany({
      include: { category: true },
      orderBy: { name: 'asc' },
    }),
    prisma.category.findMany({
      where: { parentId: null },
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true, blogPosts: true } } },
    }),
    Promise.all([
      prisma.pinLog.count(),
      prisma.pinLog.count({ where: { status: 'PENDING' } }),
      prisma.pinLog.count({ where: { status: 'PINNED' } }),
      prisma.pinLog.count({ where: { status: 'FAILED' } }),
    ]),
  ]);

  const recentPins = await prisma.pinLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: { board: true },
  });

  const stats = {
    total: pinStats[0],
    pending: pinStats[1],
    pinned: pinStats[2],
    failed: pinStats[3],
    totalPages: Math.ceil(pinStats[0] / 20) || 1,
  };

  return (
    <div>
      <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#111', margin: 0, marginBottom: '30px' }}>
        Pinterest Manager
      </h1>

      <PinterestManager
        account={account ? JSON.parse(JSON.stringify(account)) : null}
        boards={JSON.parse(JSON.stringify(boards))}
        categories={JSON.parse(JSON.stringify(categories))}
        stats={stats}
        recentPins={JSON.parse(JSON.stringify(recentPins))}
      />
    </div>
  );
}
