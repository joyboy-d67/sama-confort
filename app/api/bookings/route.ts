import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BookingFormData } from "@/types";
import { calculatePrice } from "@/lib/utils";
import { sendBookingConfirmationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const data: BookingFormData = await request.json();

    // Validation
    if (!data.firstName || !data.lastName || !data.phoneNumber) {
      return NextResponse.json(
        { message: "Informations personnelles manquantes" },
        { status: 400 }
      );
    }

    if (
      !data.departureAddress ||
      !data.destinationAddress ||
      !data.departureLat ||
      !data.departureLng ||
      !data.destinationLat ||
      !data.destinationLng
    ) {
      return NextResponse.json(
        { message: "Adresses de départ et d'arrivée requises" },
        { status: 400 }
      );
    }

    if (!data.date || !data.timeSlot) {
      return NextResponse.json(
        { message: "Date et heure requises" },
        { status: 400 }
      );
    }

    // Calculate distance and price. Prefer values provided by client (routed distance),
    // otherwise fallback to a Haversine calculation.
    let distance = typeof data.distance === "number" ? data.distance : null;
    if (distance === null) {
      // Haversine formula
      const toRad = (deg: number) => (deg * Math.PI) / 180;
      const R = 6371; // km
      const dLat = toRad(data.destinationLat - data.departureLat);
      const dLng = toRad(data.destinationLng - data.departureLng);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(data.departureLat)) *
          Math.cos(toRad(data.destinationLat)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      distance = Math.round(R * c * 100) / 100;
    }

    const price = typeof data.price === "number" ? data.price : calculatePrice(distance, 0, data.departureAddress, data.destinationAddress);

    // Check if time slot is available
    const existingBooking = await prisma.booking.findFirst({
      where: {
        date: new Date(data.date),
        timeSlot: data.timeSlot,
        status: {
          in: ["PENDING", "CONFIRMED"],
        },
      },
    });

    if (existingBooking) {
      return NextResponse.json(
        { message: "Ce créneau horaire n'est plus disponible" },
        { status: 409 }
      );
    }

    // Create booking (default to PENDING until a driver confirms)
    // Note: userId is optional - bookings can be made without authentication
    const booking = await prisma.booking.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        email: data.email,
        departureAddress: data.departureAddress,
        destinationAddress: data.destinationAddress,
        departureLat: data.departureLat,
        departureLng: data.departureLng,
        destinationLat: data.destinationLat,
        destinationLng: data.destinationLng,
        distance: distance,
        date: new Date(data.date),
        timeSlot: data.timeSlot,
        price: price,
        isRecurring: data.isRecurring,
        recurrenceType: data.recurrenceType,
        recurrenceEndDate: data.recurrenceEndDate
          ? new Date(data.recurrenceEndDate)
          : null,
        notes: data.notes,
        status: "PENDING",
        // userId is intentionally omitted - will be null, which is allowed
      },
    });

    // Mark time slot as unavailable
    await prisma.timeSlot.upsert({
      where: {
        date_slot: {
          date: new Date(data.date),
          slot: data.timeSlot,
        },
      },
      update: {
        isAvailable: false,
      },
      create: {
        date: new Date(data.date),
        slot: data.timeSlot,
        isAvailable: false,
      },
    });

    // Send confirmation email to admin
    try {
      await sendBookingConfirmationEmail(booking);
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      // Don't fail the booking if email fails
    }

    return NextResponse.json(
      {
        message: "Réservation créée avec succès",
        id: booking.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { message: "Erreur lors de la création de la réservation" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const date = searchParams.get("date");

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      where.date = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        additionalServices: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ bookings }, { status: 200 });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { message: "Erreur lors de la récupération des réservations" },
      { status: 500 }
    );
  }
}
