/**
 * Envoi d'emails via l'API HTTPS de Resend (https://resend.com).
 * Railway bloque le SMTP sortant sur le plan Hobby : on passe donc par HTTPS
 * plutôt que par nodemailer/SMTP.
 *
 * Variables d'environnement :
 *  - RESEND_API_KEY : clé API Resend (re_...)
 *  - EMAIL_FROM     : expéditeur, ex. "Sama Confort <contact@ton-domaine.fr>".
 *                     Sans domaine vérifié chez Resend, seul "onboarding@resend.dev"
 *                     est accepté, et il ne peut écrire qu'à l'adresse du compte Resend.
 */
type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

const DEFAULT_FROM = "Sama Confort <onboarding@resend.dev>";

export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY non configurée : email non envoyé.");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || DEFAULT_FROM,
      to: [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    // Resend renvoie un JSON { name, message } explicite en cas d'erreur
    const detail = await res.text().catch(() => "");
    throw new Error(`Échec de l'envoi Resend (${res.status}) : ${detail}`);
  }
}
