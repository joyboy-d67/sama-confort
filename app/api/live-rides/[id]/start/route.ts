import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id: rideId } = await params;

    const ride = await prisma.liveRide.update({
      where: { id: rideId },
      data: {
        status: "IN_PROGRESS",
      },
    });

    return NextResponse.json({ ride, message: "Course démarrée" });
  } catch (error) {
    console.error("Error starting ride:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
