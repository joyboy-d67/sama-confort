import { sendEmail } from "./mailer";
import { escapeHtml } from "./authz";
import { Booking } from "@/types";
import { formatPrice } from "./utils";

export async function sendBookingConfirmationEmail(booking: any) {
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!adminEmail) {
    console.error("ADMIN_EMAIL not configured");
    return;
  }

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: #0d6efd;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .content {
          background: #f8f9fa;
          padding: 30px;
          border-radius: 0 0 8px 8px;
        }
        .booking-details {
          background: white;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #dee2e6;
        }
        .detail-label {
          font-weight: 600;
          color: #666;
        }
        .detail-value {
          color: #212529;
        }
        .price {
          font-size: 24px;
          font-weight: bold;
          color: #0d6efd;
          text-align: center;
          padding: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🚗 Nouvelle Réservation VTC</h1>
      </div>
      <div class="content">
        <p>Une nouvelle réservation a été effectuée.</p>
        
        <div class="booking-details">
          <h2>Informations Client</h2>
          <div class="detail-row">
            <span class="detail-label">Nom complet:</span>
            <span class="detail-value">${escapeHtml(booking.firstName)} ${escapeHtml(booking.lastName)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Téléphone:</span>
            <span class="detail-value">${escapeHtml(booking.phoneNumber)}</span>
          </div>
          ${
            booking.email
              ? `<div class="detail-row">
            <span class="detail-label">Email:</span>
            <span class="detail-value">${escapeHtml(booking.email)}</span>
          </div>`
              : ""
          }
        </div>

        <div class="booking-details">
          <h2>Détails du Trajet</h2>
          <div class="detail-row">
            <span class="detail-label">📍 Départ:</span>
            <span class="detail-value">${escapeHtml(booking.departureAddress)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">🎯 Destination:</span>
            <span class="detail-value">${escapeHtml(booking.destinationAddress)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">📏 Distance:</span>
            <span class="detail-value">${booking.distance.toFixed(2)} km</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">📅 Date:</span>
            <span class="detail-value">${new Date(booking.date).toLocaleDateString("fr-FR", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">⏰ Heure:</span>
            <span class="detail-value">${escapeHtml(booking.timeSlot)}</span>
          </div>
          ${
            booking.isRecurring
              ? `<div class="detail-row">
            <span class="detail-label">🔄 Récurrence:</span>
            <span class="detail-value">${escapeHtml(booking.recurrenceType)}</span>
          </div>`
              : ""
          }
        </div>

        ${
          booking.notes
            ? `<div class="booking-details">
          <h2>Notes</h2>
          <p>${escapeHtml(booking.notes)}</p>
        </div>`
            : ""
        }

        <div class="price">
          Prix Total: ${formatPrice(booking.price)}
        </div>

        <p style="text-align: center; color: #666; font-size: 14px;">
          Réservation #${booking.id}<br>
          Créée le ${new Date(booking.createdAt).toLocaleString("fr-FR")}
        </p>
      </div>
    </body>
    </html>
  `;

  try {
    await sendEmail({
      to: adminEmail,
      subject: `Nouvelle réservation - ${escapeHtml(booking.firstName)} ${escapeHtml(booking.lastName)}`,
      html: emailHtml,
    });

    console.log("Booking confirmation email sent successfully");
  } catch (error) {
    console.error("Error sending booking confirmation email:", error);
    throw error;
  }
}
