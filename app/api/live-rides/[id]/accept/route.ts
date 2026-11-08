import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Non authentifié" },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    // Check if live ride exists and is in REQUESTED status
    const liveRide = await prisma.liveRide.findUnique({
      where: { id },
    });

    if (!liveRide) {
      return NextResponse.json(
        { message: "Course introuvable" },
        { status: 404 }
      );
    }

    if (liveRide.status !== "REQUESTED") {
      return NextResponse.json(
        { message: "Cette course n'est plus disponible" },
        { status: 400 }
      );
    }

    // Accept the ride
    const updatedRide = await prisma.liveRide.update({
      where: { id },
      data: {
        driverId: session.user.id,
        status: "ACCEPTED",
        acceptedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "Course acceptée",
      liveRide: updatedRide,
    });
  } catch (error) {
    console.error("Error accepting live ride:", error);
    return NextResponse.json(
      { message: "Erreur lors de l'acceptation" },
      { status: 500 }
    );
  }
}
