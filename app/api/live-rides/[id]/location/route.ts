import { isStaff } from "@/lib/authz";
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
    if (!isStaff(session)) {
      return NextResponse.json(
        { message: "Non authentifié" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();
    const { lat, lng, estimatedArrival, status } = body;

    // Verify driver owns this ride
    const liveRide = await prisma.liveRide.findUnique({
      where: { id },
    });

    if (!liveRide) {
      return NextResponse.json(
        { message: "Course introuvable" },
        { status: 404 }
      );
    }

    if (liveRide.driverId !== session.user.id) {
      return NextResponse.json(
        { message: "Non autorisé" },
        { status: 403 }
      );
    }

    // Update driver location and ETA
    const updateData: any = {};
    if (lat !== undefined) updateData.driverLat = lat;
    if (lng !== undefined) updateData.driverLng = lng;
    if (estimatedArrival !== undefined) updateData.estimatedArrival = estimatedArrival;
    if (status) updateData.status = status;

    const updatedRide = await prisma.liveRide.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      message: "Position mise à jour",
      liveRide: updatedRide,
    });
  } catch (error) {
    console.error("Error updating driver location:", error);
    return NextResponse.json(
      { message: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}
