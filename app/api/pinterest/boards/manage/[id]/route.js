import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { updateBoard, deleteBoard, getValidToken } from '../../../../../../utils/pinterest';
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

// PATCH: Update an existing board
export async function PATCH(request, context) {
    const { id } = await context.params;
  try {
    const { name, description } = await request.json();

    const account = await prisma.pinterestAccount.findFirst();
    if (!account) {
      return NextResponse.json({ error: 'No account connected' }, { status: 401 });
    }

    const accessToken = await getValidToken(account, prisma);
    
    // Update on Pinterest
    await updateBoard(accessToken, id, { name, description });

    // Update in DB
    const dbBoard = await prisma.pinterestBoard.update({
      where: { boardId: id },
      data: { name, description },
    });

    return NextResponse.json({ success: true, board: dbBoard });
  } catch (err) {
    console.error('Pinterest board update error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Delete a board
export async function DELETE(request, context) {
    const { id } = await context.params;
  try {
    const account = await prisma.pinterestAccount.findFirst();
    if (!account) {
      return NextResponse.json({ error: 'No account connected' }, { status: 401 });
    }

    const accessToken = await getValidToken(account, prisma);
    
    // Delete on Pinterest
    await deleteBoard(accessToken, id);

    // Delete from DB (this will cascade / clean up relations if set, or just delete)
    await prisma.pinterestBoard.delete({
      where: { boardId: id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Pinterest board generic delete error:', err);
    // If it's a "Not Found", Pinterest might have deleted it, let's just delete from local DB
    if (err.message.includes('404')) {
         await prisma.pinterestBoard.delete({ where: { boardId: id } });
         return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
