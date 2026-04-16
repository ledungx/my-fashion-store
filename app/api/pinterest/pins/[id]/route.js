import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { updatePin, deletePin, getValidToken } from '../../../../../utils/pinterest';
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

// PATCH: Update an existing pin
export async function PATCH(request, context) {
  // id here represents the PinLog ID
  const { id } = await context.params;
  try {
    const { title, description, destinationUrl, scheduledAt } = await request.json();

    const pinLog = await prisma.pinLog.findUnique({ where: { id } });
    if (!pinLog) {
      return NextResponse.json({ error: 'Pin record not found' }, { status: 404 });
    }

    if (pinLog.pinId) {
      const account = await prisma.pinterestAccount.findFirst();
      if (!account) {
        return NextResponse.json({ error: 'No account connected' }, { status: 401 });
      }

      const accessToken = await getValidToken(account, prisma);
      
      // Update on Pinterest
      await updatePin(accessToken, pinLog.pinId, { 
        title, 
        description, 
        link: destinationUrl 
      });
    }

    const dataToUpdate = { title, description, destinationUrl };
    if (scheduledAt) {
      dataToUpdate.scheduledAt = new Date(scheduledAt);
    }

    // Update in DB
    const dbPinLog = await prisma.pinLog.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, pinLog: dbPinLog });
  } catch (err) {
    console.error('Pinterest pin update error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Delete a pin
export async function DELETE(request, context) {
  // id here represents the PinLog ID
  const { id } = await context.params;
  try {
    const pinLog = await prisma.pinLog.findUnique({ where: { id } });
    if (!pinLog || !pinLog.pinId) {
      // If it doesn't have a pinId, maybe it's PENDING or FAILED. We can still just delete the logs.
      await prisma.pinLog.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    const account = await prisma.pinterestAccount.findFirst();
    if (!account) {
      return NextResponse.json({ error: 'No account connected' }, { status: 401 });
    }

    const accessToken = await getValidToken(account, prisma);
    
    // Delete on Pinterest
    try {
      await deletePin(accessToken, pinLog.pinId);
    } catch (e) {
      console.warn("Deleted pin on Pinterest failed, it might already be deleted:", e);
    }

    // Delete from local DB or just update status to DELETED
    await prisma.pinLog.update({
      where: { id },
      data: { status: 'FAILED', errorMessage: 'Pin Manually Deleted' } // Alternatively, actually .delete() it. We will just delete it to keep it clean.
    });
    
    await prisma.pinLog.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Pinterest pin generic delete error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
