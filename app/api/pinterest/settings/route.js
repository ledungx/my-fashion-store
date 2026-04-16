import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
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

export async function POST(request) {
  try {
    const { pinsPerBatch, intervalMinutes } = await request.json();

    const account = await prisma.pinterestAccount.findFirst();
    if (!account) {
      return NextResponse.json({ error: 'No account connected' }, { status: 401 });
    }

    const updatedAccount = await prisma.pinterestAccount.update({
      where: { id: account.id },
      data: {
        pinsPerBatch: parseInt(pinsPerBatch, 10),
        intervalMinutes: parseInt(intervalMinutes, 10),
      },
    });

    return NextResponse.json({ success: true, account: updatedAccount });
  } catch (err) {
    console.error('Save settings error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
