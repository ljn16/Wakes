// app/api/upload-url/route.ts
import { NextRequest } from 'next/server';
import { S3 } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const s3 = new S3({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fileType = searchParams.get('fileType');
  const extension = searchParams.get('ext');
  const fileName = `${uuidv4()}.${extension}`;

  const s3Params = {
    Bucket: process.env.S3_BUCKET_NAME!,
    Key: fileName,
    Expires: 60,
    ContentType: fileType!,
  };

  const uploadUrl = await s3.getSignedUrlPromise('putObject', s3Params);

  return new Response(JSON.stringify({ uploadUrl, fileName }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, type, url, lakeId } = body;

    const media = await prisma.media.create({
      data: {
        name,
        type,
        url,
        lakeId,
      },
    });

    return new Response(JSON.stringify(media), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error saving media:', error);
    return new Response(JSON.stringify({ error: 'Failed to save media' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}