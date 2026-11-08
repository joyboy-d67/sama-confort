import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    // Fetch all bookings sorted by date
    const bookings = await prisma.booking.findMany({
      orderBy: [
        { date: "asc" },
        { timeSlot: "asc" },
      ],
    });

    // Format the response
    const formattedBookings = bookings.map(booking => ({
      id: booking.id,
      firstName: booking.firstName,
      lastName: booking.lastName,
      phoneNumber: booking.phoneNumber,
      email: booking.email,
      departureAddress: booking.departureAddress,
      destinationAddress: booking.destinationAddress,
  date: booking.date,
      timeSlot: booking.timeSlot,
      status: booking.status,
      distance: booking.distance,
      price: booking.price,
      notes: booking.notes,
      driverNotified: booking.driverNotified,
      customerNotified: booking.customerNotified,
      tripStarted: booking.tripStarted,
      createdAt: booking.createdAt,
    }));

    return NextResponse.json({
      bookings: formattedBookings,
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des réservations" },
      { status: 500 }
    );
  }
}
