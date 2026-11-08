import { isStaff } from "@/lib/authz";
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

    // Only send email if booking is confirmed and customer hasn't been notified yet
    if (booking.status !== "CONFIRMED") {
      return NextResponse.json(
        { error: "La réservation doit être confirmée avant de notifier le client" },
        { status: 400 }
      );
    }

    if (booking.customerNotified) {
      return NextResponse.json(
        { error: "Le client a déjà été notifié" },
        { status: 400 }
      );
    }

    // Update booking status
    await prisma.booking.update({
      where: { id },
      data: {
        driverNotified: true,
        customerNotified: true,
      },
    });

    // Send enriched notification email to customer
    if (booking.email) {
      const bookingDate = new Date(booking.date);
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
        to: booking.email,
        subject: "🚗 Votre chauffeur est en route !",
        html: `
          <!DOCTYPE html>
          <html lang="fr">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background-color: #0a0a0a;">
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              
              <!-- Header avec icône -->
              <div style="text-align: center; margin-bottom: 30px; padding: 30px 20px; background: linear-gradient(135deg, #007AFF 0%, #0051D5 100%); border-radius: 16px;">
                <div style="font-size: 48px; margin-bottom: 10px;">🚗</div>
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Votre chauffeur arrive !</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">Préparez-vous, il sera là dans quelques minutes</p>
              </div>
              
              <!-- Corps principal -->
              <div style="background-color: #1a1a1a; border-radius: 16px; padding: 32px; margin-bottom: 20px; border: 1px solid #2a2a2a;">
                <p style="font-size: 18px; margin-bottom: 24px; color: #ffffff;">Bonjour <strong>${booking.firstName}</strong>,</p>
                
                <div style="background: linear-gradient(135deg, rgba(0, 122, 255, 0.1) 0%, rgba(0, 122, 255, 0.05) 100%); border-left: 4px solid #007AFF; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                  <p style="font-size: 16px; line-height: 1.6; margin: 0; color: #ffffff;">
                    <strong style="color: #007AFF;">🎯 Statut :</strong> Votre chauffeur VTC est actuellement <strong style="color: #00D084;">en route</strong> pour venir vous chercher à l'adresse indiquée.
                  </p>
                </div>
                
                <!-- Détails de la réservation avec style moderne -->
                <div style="background-color: #0f0f0f; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #2a2a2a;">
                  <h3 style="color: #007AFF; margin-top: 0; margin-bottom: 20px; font-size: 18px; display: flex; align-items: center;">
                    📋 Détails de votre réservation
                  </h3>
                  
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 12px 0; border-bottom: 1px solid #2a2a2a;">
                        <span style="color: #888888; font-size: 14px;">📅 Date</span>
                      </td>
                      <td style="padding: 12px 0; border-bottom: 1px solid #2a2a2a; text-align: right;">
                        <strong style="color: #ffffff; font-size: 15px;">${formattedDate}</strong>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; border-bottom: 1px solid #2a2a2a;">
                        <span style="color: #888888; font-size: 14px;">🕐 Heure</span>
                      </td>
                      <td style="padding: 12px 0; border-bottom: 1px solid #2a2a2a; text-align: right;">
                        <strong style="color: #ffffff; font-size: 15px;">${booking.timeSlot}</strong>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; border-bottom: 1px solid #2a2a2a;">
                        <span style="color: #888888; font-size: 14px;">💰 Prix</span>
                      </td>
                      <td style="padding: 12px 0; border-bottom: 1px solid #2a2a2a; text-align: right;">
                        <strong style="color: #00D084; font-size: 18px;">${booking.price.toFixed(2)} €</strong>
                      </td>
                    </tr>
                  </table>
                  
                  <div style="margin-top: 24px; padding-top: 20px; border-top: 2px solid #2a2a2a;">
                    <div style="margin-bottom: 16px;">
                      <span style="color: #888888; font-size: 13px; display: block; margin-bottom: 6px;">📍 DÉPART</span>
                      <p style="margin: 0; color: #ffffff; font-size: 15px; line-height: 1.4;">${booking.departureAddress}</p>
                    </div>
                    
                    <div style="margin: 20px 0; text-align: center;">
                      <div style="display: inline-block; padding: 8px 16px; background-color: #2a2a2a; border-radius: 20px;">
                        <span style="color: #007AFF; font-size: 20px;">↓</span>
                      </div>
                    </div>
                    
                    <div>
                      <span style="color: #888888; font-size: 13px; display: block; margin-bottom: 6px;">🎯 ARRIVÉE</span>
                      <p style="margin: 0; color: #ffffff; font-size: 15px; line-height: 1.4;">${booking.destinationAddress}</p>
                    </div>
                  </div>
                </div>
                
                <!-- Message d'action -->
                <div style="background: linear-gradient(135deg, rgba(255, 204, 0, 0.1) 0%, rgba(255, 204, 0, 0.05) 100%); border-left: 4px solid #FFCC00; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                  <p style="font-size: 14px; color: #ffffff; margin: 0; line-height: 1.6;">
                    ⚠️ <strong>Veuillez vous tenir prêt(e)</strong><br/>
                    Le chauffeur arrivera d'ici peu. Assurez-vous d'être visible et disponible.
                  </p>
                </div>
                
                <!-- Conseils -->
                <div style="background-color: #0f0f0f; border-radius: 8px; padding: 16px; border: 1px solid #2a2a2a;">
                  <p style="font-size: 13px; color: #888888; margin: 0; line-height: 1.6;">
                    💡 <strong style="color: #ffffff;">Conseil :</strong> Gardez votre téléphone à portée de main au cas où le chauffeur aurait besoin de vous contacter.
                  </p>
                </div>
              </div>
              
              <!-- Footer -->
              <div style="text-align: center; padding: 24px 20px; background-color: #1a1a1a; border-radius: 12px; border: 1px solid #2a2a2a;">
                <p style="font-size: 14px; color: #888888; margin: 0 0 12px 0;">
                  Merci d'avoir choisi nos services VTC
                </p>
                <p style="font-size: 12px; color: #666666; margin: 0;">
                  Besoin d'aide ? Contactez-nous : <a href="mailto:support@vtc.com" style="color: #007AFF; text-decoration: none;">support@vtc.com</a>
                </p>
              </div>
              
            </div>
          </body>
          </html>
        `,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Client notifié avec succès",
    });
  } catch (error) {
    console.error("Error notifying customer:", error);
    return NextResponse.json(
      { error: "Erreur lors de la notification" },
      { status: 500 }
    );
  }
}
