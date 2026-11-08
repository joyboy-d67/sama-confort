import { isStaff } from "@/lib/authz";
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!isStaff(session)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Récupérer les réservations complétées pour calculer les revenus
    const [dailyBookings, weeklyBookings, monthlyBookings] = await Promise.all([
      prisma.booking.findMany({
        where: {
          date: { gte: startOfDay },
          status: 'COMPLETED',
        },
        select: { price: true },
      }),
      prisma.booking.findMany({
        where: {
          date: { gte: startOfWeek },
          status: 'COMPLETED',
        },
        select: { price: true },
      }),
      prisma.booking.findMany({
        where: {
          date: { gte: startOfMonth },
          status: 'COMPLETED',
        },
        select: { price: true },
      }),
    ]);

    const dailyRevenue = dailyBookings.reduce((sum, b) => sum + b.price, 0);
    const weeklyRevenue = weeklyBookings.reduce((sum, b) => sum + b.price, 0);
    const monthlyRevenue = monthlyBookings.reduce((sum, b) => sum + b.price, 0);

    return NextResponse.json({
      daily: dailyRevenue,
      weekly: weeklyRevenue,
      monthly: monthlyRevenue,
    });
  } catch (error) {
    console.error('Error fetching driver stats:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
