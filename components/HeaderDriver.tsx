"use client";

import Link from "next/link";
import { Car, LogOut } from "lucide-react";
import React from "react";
import { useSession, signOut } from "next-auth/react";

interface HeaderDriverProps {
  title?: string;
  children?: React.ReactNode;
}

export default function HeaderDriver({ title = "Espace Chauffeur", children }: HeaderDriverProps) {
  const { data: session } = useSession();

  return (
    <header className="border-b border-dark-gray bg-black/80 backdrop-blur">
      <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/admin" className="flex items-center gap-2">
          <Car className="w-8 h-8 text-primary" />
          <span className="text-2xl font-bold">{title}</span>
        </Link>

        <div className="flex items-center gap-4">
          {session && (
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex items-center gap-2 text-gray-300 hover:text-red-400 transition"
              title="Se déconnecter"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          )}

          {children}
        </div>
      </nav>
    </header>
  );
}
