import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { exchangeCodeForTokens, getUserInfo } from '../../../../utils/pinterest';
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

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL('/admin/pinterest?error=' + encodeURIComponent(error), request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/admin/pinterest?error=no_code', request.url));
  }

  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);
    
    // Get user info
    const userInfo = await getUserInfo(tokens.accessToken);
    const username = userInfo.username || userInfo.id || 'unknown';

    // Upsert account (replace existing if any)
    const existingAccount = await prisma.pinterestAccount.findFirst();
    
    if (existingAccount) {
      await prisma.pinterestAccount.update({
        where: { id: existingAccount.id },
        data: {
          username,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          tokenExpiry: new Date(Date.now() + tokens.expiresIn * 1000),
          scope: tokens.scope || 'pins:read,pins:write,boards:read,boards:write',
        },
      });
    } else {
      await prisma.pinterestAccount.create({
        data: {
          username,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          tokenExpiry: new Date(Date.now() + tokens.expiresIn * 1000),
          scope: tokens.scope || 'pins:read,pins:write,boards:read,boards:write',
        },
      });
    }

    return NextResponse.redirect(new URL('/admin/pinterest?success=connected', request.url));
  } catch (err) {
    console.error('Pinterest OAuth callback error:', err);
    return NextResponse.redirect(new URL('/admin/pinterest?error=' + encodeURIComponent(err.message), request.url));
  }
}
