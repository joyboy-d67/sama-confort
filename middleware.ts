import { withAuth } from "next-auth/middleware";
import { isStaffRole } from "@/lib/authz";

// Première barrière : seuls les comptes chauffeur/admin atteignent ces pages et API.
// Chaque route API revérifie aussi le rôle côté serveur (défense en profondeur).
export default withAuth({
  callbacks: {
    authorized: ({ token }) => isStaffRole(token?.role),
  },
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/driver/:path*",
    "/api/admin/:path*",
    "/api/driver/:path*",
    "/api/live-rides/driver",
    "/api/live-rides/stream/driver",
    "/api/live-rides/:id/:action(accept|reject|complete|start|notify|location)",
  ],
};
