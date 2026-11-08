import type { Session } from "next-auth";

/**
 * Rôles autorisés à gérer l'activité (réservations, courses, tableau de bord).
 * Un compte créé via /signup a le rôle "USER" et n'y a donc jamais accès.
 */
export const STAFF_ROLES = ["DRIVER", "ADMIN"] as const;

export function isStaffRole(role: string | null | undefined): boolean {
  return !!role && (STAFF_ROLES as readonly string[]).includes(role);
}

/** Garde de type : session connectée ET rôle chauffeur/admin. */
export function isStaff(
  session: Session | null
): session is Session & { user: Session["user"] & { id: string; role: string } } {
  return !!session?.user?.id && isStaffRole(session.user.role);
}

/** Échappe les valeurs saisies par les clients avant de les insérer dans un email HTML. */
export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
