import { NextRequest, NextResponse } from 'next/server';
// import { PrismaClient } from '@prisma/client'; // prev--prisma
import { db } from '@/app/lib/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';

export const runtime = 'nodejs';
// const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }; // prev--prisma

// const prisma = // prev--prisma
//   globalForPrisma.prisma ?? // prev--prisma
//   new PrismaClient({ // prev--prisma
//     log: ['query'], // prev--prisma
//   }); // prev--prisma

// if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma; // prev--prisma

// console.log("DATABASE_URL:", process.env.DATABASE_URL); // prev--prisma

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url, `http://${req.headers.get('host')}`);
    const latitude = parseFloat(searchParams.get('latitude') || '');
    const longitude = parseFloat(searchParams.get('longitude') || '');

    const lakesRef = collection(db, 'lakes');
    let lakesSnapshot;

    if (!isNaN(latitude) && !isNaN(longitude)) {
      // Note: Firestore doesn't support geo queries natively without third-party libs
      lakesSnapshot = await getDocs(lakesRef); // Use all docs for now
    } else {
      lakesSnapshot = await getDocs(lakesRef);
    }

    const lakes = lakesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(lakes, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/lakes:', error instanceof Error ? error.message : error);
    console.error('Full error object:', error);
    return NextResponse.json({ error: 'Failed to load lakes' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    // const lake = await prisma.lake.create({ // prev--prisma
    //   data, // prev--prisma
    // }); // prev--prisma
    // return NextResponse.json(lake, { status: 201 }); // prev--prisma
    const docRef = await addDoc(collection(db, 'lakes'), data);
    const newLake = { id: docRef.id, ...data };
    return NextResponse.json(newLake, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/lakes:', error);
    return NextResponse.json({ error: 'Failed to create lake' }, { status: 500 });
  }
}