import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isStaff } from "@/lib/authz";

export async function GET(request: NextRequest, context: any) {
  const params = await (context as { params: Promise<{ id: string }> }).params;
  try {
    const booking = await prisma.booking.findUnique({
      where: {
        id: params.id,
      },
      include: {
        additionalServices: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { message: "Réservation non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json({ booking }, { status: 200 });
  } catch (error) {
    console.error("Error fetching booking:", error);
    return NextResponse.json(
      { message: "Erreur lors de la récupération de la réservation" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: any) {
  if (!isStaff(await getServerSession(authOptions))) {
    return NextResponse.json({ message: "Non autorisé" }, { status: 403 });
  }
  const params = await (context as { params: Promise<{ id: string }> }).params;
  try {
    const data = await request.json();

    const booking = await prisma.booking.update({
      where: {
        id: params.id,
      },
      data: {
        status: data.status,
      },
    });

    return NextResponse.json(
      {
        message: "Réservation mise à jour",
        booking,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json(
      { message: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: any) {
  if (!isStaff(await getServerSession(authOptions))) {
    return NextResponse.json({ message: "Non autorisé" }, { status: 403 });
  }
  const params = await (context as { params: Promise<{ id: string }> }).params;
  try {
    await prisma.booking.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json(
      { message: "Réservation supprimée" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting booking:", error);
    return NextResponse.json(
      { message: "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}
