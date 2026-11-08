import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
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

    // Récupérer la réservation
    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return NextResponse.json(
        { message: "Réservation introuvable" },
        { status: 404 }
      );
    }

    // Vérifier que c'est bien la réservation de l'utilisateur
    if (booking.userId !== session.user.id && booking.email !== session.user.email) {
      return NextResponse.json(
        { message: "Non autorisé" },
        { status: 403 }
      );
    }

    // Vérifier que la réservation n'est pas déjà annulée ou terminée
    if (booking.status === "CANCELLED" || booking.status === "COMPLETED") {
      return NextResponse.json(
        { message: "Cette réservation ne peut pas être annulée" },
        { status: 400 }
      );
    }

    // Vérifier que la réservation est dans plus de 2 heures
    const bookingDateTime = new Date(booking.date);
    const [startHour] = booking.timeSlot.split('-');
    const [hours, minutes] = startHour.split(':').map(Number);
    bookingDateTime.setHours(hours, minutes, 0, 0);

    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    if (bookingDateTime <= twoHoursFromNow) {
      return NextResponse.json(
        { message: "Impossible d'annuler une réservation moins de 2 heures avant le départ" },
        { status: 400 }
      );
    }

    // Annuler la réservation
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    return NextResponse.json({
      message: "Réservation annulée avec succès",
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Error canceling booking:", error);
    return NextResponse.json(
      { message: "Erreur lors de l'annulation" },
      { status: 500 }
    );
  }
}
