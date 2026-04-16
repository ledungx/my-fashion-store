import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { createPin, getValidToken } from '../../../../utils/pinterest';
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

// POST: Generate or reset pin queue for all mapped boards (drip-feed)
export async function POST(request) {
  try {
    const account = await prisma.pinterestAccount.findFirst();
    if (!account) {
      return NextResponse.json({ error: 'No Pinterest account connected' }, { status: 401 });
    }

    const SITE_DOMAIN = process.env.SITE_DOMAIN || 'https://myfashionstore.com';
    const PIN_INTERVAL_MINUTES = account.intervalMinutes || 180;

    // Get all boards with category mappings
    const boards = await prisma.pinterestBoard.findMany({
      where: { categoryId: { not: null } },
      include: { category: true },
    });

    if (boards.length === 0) {
      return NextResponse.json({ error: 'No boards mapped to categories. Map boards first.' }, { status: 400 });
    }

    let totalQueued = 0;
    let totalSkipped = 0;
    let scheduleTime = new Date(); // Start scheduling from now

    for (const board of boards) {
      // Fetch products in this category with their images
      const products = await prisma.product.findMany({
        where: { categoryId: board.categoryId },
        include: { images: true },
      });

      for (const product of products) {
        const destinationUrl = product.rawData?.originUrl 
          ? (product.rawData.originUrl.includes('?') 
              ? `${product.rawData.originUrl}&ref=gumac` 
              : `${product.rawData.originUrl}?ref=gumac`)
          : `${SITE_DOMAIN}/product/${product.slug}`;

        for (const image of product.images) {
          // Check if already pinned or pending
          const existing = await prisma.pinLog.findUnique({
            where: { imageUrl_boardId: { imageUrl: image.url, boardId: board.id } },
          });

          if (existing) {
            if (existing.status === 'PINNED') {
              totalSkipped++;
              continue;
            } else {
              // Reset schedule for unpinned pins
              await prisma.pinLog.update({
                where: { id: existing.id },
                data: {
                  status: 'PENDING',
                  scheduledAt: new Date(scheduleTime),
                }
              });
              totalQueued++;
              scheduleTime = new Date(scheduleTime.getTime() + PIN_INTERVAL_MINUTES * 60 * 1000);
              continue;
            }
          }

          // Schedule this new pin
          await prisma.pinLog.create({
            data: {
              status: 'PENDING',
              productId: product.id,
              imageUrl: image.url,
              title: product.name,
              description: product.description?.substring(0, 500) || product.name,
              destinationUrl,
              boardId: board.id,
              accountId: account.id,
              scheduledAt: new Date(scheduleTime),
            },
          });

          totalQueued++;
          scheduleTime = new Date(scheduleTime.getTime() + PIN_INTERVAL_MINUTES * 60 * 1000);
        }
      }

      // Also pin blog posts with cover images in this category
      const blogPosts = await prisma.blogPost.findMany({
        where: { 
          categoryId: board.categoryId,
          status: 'PUBLISHED',
          coverImage: { not: null },
        },
      });

      for (const post of blogPosts) {
        const existing = await prisma.pinLog.findUnique({
          where: { imageUrl_boardId: { imageUrl: post.coverImage, boardId: board.id } },
        });

        if (existing) {
          if (existing.status === 'PINNED') {
            totalSkipped++;
            continue;
          } else {
            // Reset schedule
            await prisma.pinLog.update({
              where: { id: existing.id },
              data: {
                status: 'PENDING',
                scheduledAt: new Date(scheduleTime),
              }
            });
            totalQueued++;
            scheduleTime = new Date(scheduleTime.getTime() + PIN_INTERVAL_MINUTES * 60 * 1000);
            continue;
          }
        }

        await prisma.pinLog.create({
          data: {
            status: 'PENDING',
            blogPostId: post.id,
            imageUrl: post.coverImage,
            title: post.title,
            description: post.excerpt?.substring(0, 500) || post.title,
            destinationUrl: `${SITE_DOMAIN}/blog/${post.slug}`,
            boardId: board.id,
            accountId: account.id,
            scheduledAt: new Date(scheduleTime),
          },
        });

        totalQueued++;
        scheduleTime = new Date(scheduleTime.getTime() + PIN_INTERVAL_MINUTES * 60 * 1000);
      }
    }

    return NextResponse.json({ 
      success: true, 
      queued: totalQueued, 
      skipped: totalSkipped,
      message: `${totalQueued} pins scheduled (drip-feed: 1 every ${PIN_INTERVAL_MINUTES} min). ${totalSkipped} already exists.`
    });
  } catch (err) {
    console.error('Pinterest sync error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT: Process the next batch of pending pins (called by a cron or manual trigger)
export async function PUT() {
  try {
    const account = await prisma.pinterestAccount.findFirst();
    if (!account) {
      return NextResponse.json({ error: 'No Pinterest account connected' }, { status: 401 });
    }

    const accessToken = await getValidToken(account, prisma);

    // Get pending pins that are due (scheduledAt <= now)
    const pendingPins = await prisma.pinLog.findMany({
      where: {
        status: 'PENDING',
        scheduledAt: { lte: new Date() },
      },
      include: { board: true },
      orderBy: { scheduledAt: 'asc' },
      take: account.pinsPerBatch || 1,
    });

    let pinned = 0;
    let failed = 0;

    for (const pin of pendingPins) {
      try {
        const result = await createPin(accessToken, {
          boardId: pin.board.boardId,
          title: pin.title,
          description: pin.description,
          link: pin.destinationUrl,
          imageUrl: pin.imageUrl,
          altText: pin.title,
        });

        await prisma.pinLog.update({
          where: { id: pin.id },
          data: { 
            status: 'PINNED', 
            pinId: result.id,
          },
        });
        pinned++;

        // Rate limit: wait 3 seconds between pins
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (err) {
        await prisma.pinLog.update({
          where: { id: pin.id },
          data: { 
            status: 'FAILED', 
            errorMessage: err.message,
          },
        });
        failed++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed: pendingPins.length,
      pinned,
      failed,
    });
  } catch (err) {
    console.error('Pinterest process error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET: Get pin queue status
export async function GET() {
  try {
    const [total, pending, pinned, failed] = await Promise.all([
      prisma.pinLog.count(),
      prisma.pinLog.count({ where: { status: 'PENDING' } }),
      prisma.pinLog.count({ where: { status: 'PINNED' } }),
      prisma.pinLog.count({ where: { status: 'FAILED' } }),
    ]);

    const recentPins = await prisma.pinLog.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 50,
      include: { board: true },
    });

    return NextResponse.json({ total, pending, pinned, failed, recentPins });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
