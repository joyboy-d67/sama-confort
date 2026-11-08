import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST: Create a new live ride request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { message: "Non authentifié" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      clientName,
      clientPhone,
      departureAddress,
      departureLat,
      departureLng,
      destinationAddress,
      destinationLat,
      destinationLng,
      paymentMethod,
    } = body;

    // Validation
    if (!clientName || !clientPhone || !departureAddress || !departureLat || !departureLng) {
      return NextResponse.json(
        { message: "Informations manquantes" },
        { status: 400 }
      );
    }

    // Calculate distance and price if destination provided
    let distance = null;
    let price = null;
    
    if (destinationLat && destinationLng) {
      // Haversine formula for approximate distance
      const toRad = (deg: number) => (deg * Math.PI) / 180;
      const R = 6371; // km
      const dLat = toRad(destinationLat - departureLat);
      const dLng = toRad(destinationLng - departureLng);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(departureLat)) *
          Math.cos(toRad(destinationLat)) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      distance = Math.round(R * c * 100) / 100;

      // Calculate price
      const basePrice = distance < 10 ? 13 : distance * 1.35;
      
      // Airport surcharge
      const isDepartureAirport = departureAddress.toLowerCase().includes('aéroport') && 
        departureAddress.toLowerCase().includes('strasbourg') &&
        (departureAddress.toLowerCase().includes('entzheim') || departureAddress.toLowerCase().includes('67960'));
      const isDestinationAirport = destinationAddress && destinationAddress.toLowerCase().includes('aéroport') && 
        destinationAddress.toLowerCase().includes('strasbourg') &&
        (destinationAddress.toLowerCase().includes('entzheim') || destinationAddress.toLowerCase().includes('67960'));
      const airportSurcharge = (isDepartureAirport || isDestinationAirport) ? 5 : 0;
      
      price = Math.round((basePrice + airportSurcharge) * 100) / 100;
    }

    // Create live ride
    const liveRide = await prisma.liveRide.create({
      data: {
        userId: session.user.id!,
        clientName,
        clientPhone,
        departureAddress,
        departureLat,
        departureLng,
        destinationAddress,
        destinationLat,
        destinationLng,
        distance,
        price,
        paymentMethod: paymentMethod || "APP",
        status: "REQUESTED",
      },
    });

    return NextResponse.json({
      message: "Demande de course créée",
      liveRide,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating live ride:", error);
    return NextResponse.json(
      { message: "Erreur lors de la création de la demande" },
      { status: 500 }
    );
  }
}

// GET: Get all live rides (for driver dashboard)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { message: "Non authentifié" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const liveRides = await prisma.liveRide.findMany({
      where,
      orderBy: { requestedAt: "desc" },
    });

    return NextResponse.json({ liveRides }, { status: 200 });
  } catch (error) {
    console.error("Error fetching live rides:", error);
    return NextResponse.json(
      { message: "Erreur lors de la récupération" },
      { status: 500 }
    );
  }
}
