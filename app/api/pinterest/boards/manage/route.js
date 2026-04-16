import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { createBoard, getValidToken } from '../../../../../utils/pinterest';
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

// POST: Create a new board
export async function POST(request) {
  try {
    const { name, description } = await request.json();

    const account = await prisma.pinterestAccount.findFirst();
    if (!account) {
      return NextResponse.json({ error: 'No Pinterest account connected' }, { status: 401 });
    }

    const accessToken = await getValidToken(account, prisma);
    
    // Create on Pinterest
    const pinBoard = await createBoard(accessToken, { name, description });

    // Save to DB
    const dbBoard = await prisma.pinterestBoard.create({
      data: {
        boardId: pinBoard.id,
        name: pinBoard.name,
        description: pinBoard.description || null,
        accountId: account.id,
      },
    });

    return NextResponse.json({ success: true, board: dbBoard });
  } catch (err) {
    console.error('Pinterest board creation error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
