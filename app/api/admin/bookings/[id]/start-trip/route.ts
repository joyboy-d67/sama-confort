import { isStaff } from "@/lib/authz";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!isStaff(session)) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Get booking details
    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Réservation introuvable" },
        { status: 404 }
      );
    }

    // Update booking to mark trip as started
    await prisma.booking.update({
      where: { id },
      data: {
        tripStarted: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Trajet démarré",
    });
  } catch (error) {
    console.error("Error starting trip:", error);
    return NextResponse.json(
      { error: "Erreur lors du démarrage du trajet" },
      { status: 500 }
    );
  }
}
