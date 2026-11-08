import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const rides = await prisma.ride.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });

    const mappedRides = rides.map(r => ({
      id: r.id,
      date: r.date.toISOString().split('T')[0],
      samaPrice: r.price,
      boltPrice: r.boltPrice || 0,
      uberPrice: r.uberPrice || 0,
    }));

    return NextResponse.json({ rides: mappedRides });
  } catch (error) {
    console.error('Error fetching rides:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const incoming = Array.isArray(body.rides) ? body.rides : body.rides ? [body.rides] : [];
  if (incoming.length === 0) {
    return NextResponse.json({ error: 'No rides provided' }, { status: 400 });
  }

  try {
    const createdRides = await prisma.$transaction(
      incoming.map((r: any) => 
        prisma.ride.create({
          data: {
            date: new Date(r.date),
            price: r.samaPrice,
            boltPrice: r.boltPrice,
            uberPrice: r.uberPrice,
            userId,
            startAddress: 'Sample Start', 
            endAddress: 'Sample End',
            distance: 5.0,
          }
        })
      )
    );

    const allRides = await prisma.ride.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });

    const mappedRides = allRides.map(r => ({
      id: r.id,
      date: r.date.toISOString().split('T')[0],
      samaPrice: r.price,
      boltPrice: r.boltPrice || 0,
      uberPrice: r.uberPrice || 0,
    }));

    return NextResponse.json({ rides: mappedRides });
  } catch (error) {
    console.error('Error creating rides:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    await prisma.ride.deleteMany({
      where: { userId }
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting rides:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
