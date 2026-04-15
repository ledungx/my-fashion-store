import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { listBoards, getValidToken } from '../../../../utils/pinterest';
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

// GET: Fetch boards from Pinterest and sync to DB
export async function GET() {
  try {
    const account = await prisma.pinterestAccount.findFirst();
    if (!account) {
      return NextResponse.json({ error: 'No Pinterest account connected' }, { status: 401 });
    }

    const accessToken = await getValidToken(account, prisma);
    const boards = await listBoards(accessToken);

    // Upsert boards into DB
    for (const board of boards) {
      await prisma.pinterestBoard.upsert({
        where: { boardId: board.id },
        create: {
          boardId: board.id,
          name: board.name,
          description: board.description || null,
          imageUrl: board.media?.image_cover_url || null,
          accountId: account.id,
        },
        update: {
          name: board.name,
          description: board.description || null,
          imageUrl: board.media?.image_cover_url || null,
        },
      });
    }

    // Get all boards with category mappings
    const dbBoards = await prisma.pinterestBoard.findMany({
      include: { category: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ boards: dbBoards });
  } catch (err) {
    console.error('Pinterest boards error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Save board-to-category mappings
export async function POST(request) {
  try {
    const { mappings } = await request.json();
    // mappings: [{ boardId: "cuid", categoryId: "cuid" | null }, ...]

    for (const mapping of mappings) {
      await prisma.pinterestBoard.update({
        where: { id: mapping.boardId },
        data: { categoryId: mapping.categoryId || null },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Pinterest mapping error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
