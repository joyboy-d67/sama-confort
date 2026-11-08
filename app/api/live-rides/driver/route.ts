import { isStaff } from "@/lib/authz";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!isStaff(session)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Get all active live rides (REQUESTED, ACCEPTED, DRIVER_EN_ROUTE, ARRIVED, IN_PROGRESS)
    const rides = await prisma.liveRide.findMany({
      where: {
        status: {
          in: ["REQUESTED", "ACCEPTED", "DRIVER_EN_ROUTE", "ARRIVED", "IN_PROGRESS"],
        },
      },
      orderBy: {
        requestedAt: "desc",
      },
    });

    return NextResponse.json({ rides });
  } catch (error) {
    console.error("Error fetching driver live rides:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
