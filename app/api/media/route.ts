import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// This endpoint stores media metadata, including GPX files.
// To upload a GPX file:
// 1. Upload the file to S3 (or another storage solution)
// 2. Send a POST request to this endpoint with:
//    {
//      url: 'https://your-bucket.s3.amazonaws.com/track.gpx',
//      type: 'application/gpx+xml',
//      name: 'Main Paddle Route',
//      lakeId: 1 // or whichever lake this track belongs to
//    }

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const lakeId = searchParams.get("lakeId");
    // Replace spaces with '+' in case the '+' gets converted to a space
    const type = (searchParams.get("type") || "").replace(/ /g, "+");

    const mediaRecords = await prisma.media.findMany({
      where: {
        lakeId: lakeId ? Number(lakeId) : undefined,
        type: type || undefined,
      }
    });
    console.log("Media records found:", mediaRecords);
    if (mediaRecords.length > 0) {
      console.log('Actual DB type is:', mediaRecords[0].type);
    }

    return NextResponse.json(mediaRecords, { status: 200 });
  } catch (error) {
    console.error("Error fetching media:", error);
    return NextResponse.json({ error: 'Error fetching media records' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("📦 Incoming body:", body);
    const { url, type, lakeId, name } = body;

    if (!url || !type || !name) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const media = await prisma.media.create({
      data: {
        url,
        type,
        name,
        lakeId: lakeId || null,
      },
    });

    return NextResponse.json(media, { status: 201 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
