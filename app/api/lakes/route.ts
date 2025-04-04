import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// import tLakeData from '@/app/gpx-route-data/tempLakeData';

export const runtime = 'nodejs';
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

console.log("DATABASE_URL:", process.env.DATABASE_URL); // Log DATABASE_URL

// export async function GET() { return Response.json(tLakeData, { status: 200 });} //*temp GET backup
//*GET
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url, `http://${req.headers.get('host')}`);
    const latitude = parseFloat(searchParams.get('latitude') || '');
    const longitude = parseFloat(searchParams.get('longitude') || '');

    let lakes;
    console.log("DATABASE_URL:", process.env.DATABASE_URL); // Log DATABASE_URL
    if (!isNaN(latitude) && !isNaN(longitude)) {
      lakes = await prisma.lake.findMany({
        // where: {
        //   latitude: { gte: latitude - 0.1, lte: latitude + 0.1 },
        //   longitude: { gte: longitude - 0.1, lte: longitude + 0.1 },
        // },
        include: { media: true },
      });
    } else {
      lakes = await prisma.lake.findMany({
        include: { media: true },
      });
    }

    return NextResponse.json(lakes, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/lakes:', error instanceof Error ? error.message : error);
    console.error('Full error object:', error);
    return NextResponse.json({ error: 'Failed to load lakes' }, { status: 500 });
  }
}
//*POST
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const lake = await prisma.lake.create({
      data,
    });
    return NextResponse.json(lake, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/lakes:', error);
    return NextResponse.json({ error: 'Failed to create lake' }, { status: 500 });
  }
}
