import Providers from "@/components/Providers";
import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sama Confort - Réservation de Chauffeur Privé",
  description: "Réservez votre chauffeur VTC en quelques clics. Service professionnel, rapide et fiable.",
  keywords: ["VTC", "chauffeur privé", "réservation", "transport"],
  authors: [{ name: "Sama Confort" }],
  openGraph: {
    title: "Sama Confort - Réservation de Chauffeur Privé",
    description: "Réservez votre chauffeur VTC en quelques clics",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">
        <Providers>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#2a2a2a',
                color: '#fff',
                border: '1px solid #3d3d3d',
              },
              success: {
                iconTheme: {
                  primary: '#0d6efd',
                  secondary: '#fff',
                },
              },
            }}
          />
          {children}
        </Providers>
      </body>
    </html>
  );
}
