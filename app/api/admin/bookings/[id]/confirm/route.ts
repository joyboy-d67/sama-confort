import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status: "CONFIRMED",
      },
    });

    // Send confirmation email to customer
    if (updated.email) {
      try {
        const bookingDate = new Date(updated.date);
        const formattedDate = bookingDate.toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        });

        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || "smtp.gmail.com",
          port: parseInt(process.env.SMTP_PORT || "587"),
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          },
        });

        await transporter.sendMail({
          from: process.env.SMTP_USER,
          to: updated.email,
          subject: "✅ Votre réservation a été confirmée",
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #000000; color: #ffffff;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #00C851; margin: 0;">Réservation confirmée</h1>
              </div>
              <div style="background-color: #1a1a1a; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
                <p style="font-size: 16px; line-height: 1.6; margin-bottom: 10px;">Bonjour ${updated.firstName},</p>
                <p style="font-size: 16px; line-height: 1.6; margin-bottom: 10px;">Votre réservation pour le <strong>${formattedDate}</strong> à <strong>${updated.timeSlot}</strong> a été confirmée par notre chauffeur.</p>
                <div style="background-color: #2a2a2a; border-radius: 8px; padding: 16px; margin-top: 12px;">
                  <p style="margin: 8px 0;"><strong>📍 Départ:</strong><br/>${updated.departureAddress}</p>
                  <p style="margin: 8px 0;"><strong>🎯 Destination:</strong><br/>${updated.destinationAddress}</p>
                </div>
              </div>
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #2a2a2a;">
                <p style="font-size: 14px; color: #888888; margin: 0;">Merci d'avoir choisi nos services.</p>
              </div>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("Error sending confirmation email:", emailError);
      }
    }

    return NextResponse.json({ success: true, booking: updated }, { status: 200 });
  } catch (error) {
    console.error("Error confirming booking:", error);
    return NextResponse.json({ error: "Erreur lors de la confirmation" }, { status: 500 });
  }
}
