import { isStaff } from "@/lib/authz";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!isStaff(session)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Mark as CANCELLED (or REJECTED if we want to keep it in history but not active)
    // For this simple app, we'll just Cancel it so it stops showing up.
    const ride = await prisma.liveRide.update({
      where: { id },
      data: {
        status: "CANCELLED",
      },
    });

    return NextResponse.json({ message: "Ride rejected", ride });
  } catch (error) {
    console.error("Error rejecting ride:", error);
    return NextResponse.json(
      { message: "Error rejecting ride" },
      { status: 500 }
    );
  }
}
