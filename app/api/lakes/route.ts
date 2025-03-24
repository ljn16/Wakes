import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url, `http://${req.headers.get('host')}`);
    const latitude = parseFloat(searchParams.get('latitude') || '');
    const longitude = parseFloat(searchParams.get('longitude') || '');

    let lakes;
    if (!isNaN(latitude) && !isNaN(longitude)) {
      lakes = await prisma.lake.findMany({
        where: {
          latitude: { gte: latitude - 0.1, lte: latitude + 0.1 },
          longitude: { gte: longitude - 0.1, lte: longitude + 0.1 },
        },
        include: { media: true },
      });
    } else {
      lakes = await prisma.lake.findMany({
        include: { media: true },
      });
    }

    return NextResponse.json(lakes, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/lakes:', error);
    return NextResponse.json({ error: 'Failed to load lakes' }, { status: 500 });
  }
}

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

// export async function GET() {
//   return Response.json([
//         {
//           id: 1,
//           name: "Lake of the Isles",
//           distance: "",
//           latitude: 44.955,
//           longitude: -93.3096,
//         },
//         {
//           id: 2,
//           name: "Medicine Lake",
//           distance: "",
//           latitude: 45.01,
//           longitude: -93.4192,
//         },
//         {
//           id: 3,
//           name: "Eagle Lake",
//           distance: "",
//           latitude: 45.0742,
//           longitude: -93.4148,
//         },
//         {
//           id: 4,
//           name: "White Bear Lake",
//           distance: "",
//           latitude: 45.075,
//           longitude: -92.987,
//         },
//         {
//           id: 5,
//           name: "Lake Phalen",
//           distance: "",
//           latitude: 44.9884,
//           longitude: -93.0545,
//         },
//         {
//           id: 6,
//           name: "Cedar Lake",
//           distance: "",
//           latitude: 44.9601,
//           longitude: -93.3205,
//         },
//         {
//           id: 7,
//           name: "Brownie Lake",
//           distance: "",
//           latitude: 44.9676,
//           longitude: -93.3243,
//         },
//         {
//           id: 8,
//           name: "Bde Maka Ska",
//           distance: "",
//           latitude: 44.942,
//           longitude: -93.3117,
//         },
//         {
//           id: 9,
//           name: "Lake Harriet",
//           distance: "",
//           latitude: 44.9223,
//           longitude: -93.3053,
//         },
//         {
//           id: 10,
//           name: "Minnehaha Creek",
//           distance: "",
//           latitude: 44.9532,
//           longitude: -93.4855,
//         },
//   ]);
// }
