import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateTimeSlots, isDateInRange } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dateParam = searchParams.get("date");

    if (!dateParam) {
      return NextResponse.json(
        { message: "Date parameter required" },
        { status: 400 }
      );
    }

    const date = new Date(dateParam);

    if (!isDateInRange(date)) {
      return NextResponse.json(
        { message: "Date hors de la plage autorisée (3 mois maximum)" },
        { status: 400 }
      );
    }

    // Get all time slots
    const allSlots = generateTimeSlots();

    // Get existing bookings for this date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const existingBookings = await prisma.booking.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: ["PENDING", "CONFIRMED"],
        },
      },
      select: {
        timeSlot: true,
      },
    });

    const bookedSlots = new Set(existingBookings.map((b) => b.timeSlot));

    // Check time slot availability from database
    const timeSlots = await prisma.timeSlot.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    const timeSlotMap = new Map(timeSlots.map((ts) => [ts.slot, ts.isAvailable]));

    const slots = allSlots.map((slot) => ({
      slot,
      isAvailable: !bookedSlots.has(slot) && (timeSlotMap.get(slot) ?? true),
    }));

    return NextResponse.json({ slots }, { status: 200 });
  } catch (error) {
    console.error("Error fetching time slots:", error);
    return NextResponse.json(
      { message: "Erreur lors de la récupération des créneaux" },
      { status: 500 }
    );
  }
}
