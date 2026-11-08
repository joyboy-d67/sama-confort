"use client";

import Link from "next/link";
import { Car, User, LogIn, LogOut, Zap } from "lucide-react";
import Button from "@/components/ui/Button";
import React from "react";
import { useSession, signOut } from "next-auth/react";

interface HeaderProps {
  title?: string;
  children?: React.ReactNode;
}

export default function Header({ title = "Sama Confort", children }: HeaderProps) {
  const { data: session } = useSession();

  return (
    <header className="border-b border-dark-gray">
      <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <Car className="w-8 h-8 text-primary" />
          <span className="text-2xl font-bold">{title}</span>
        </Link>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex gap-6 items-center">
            {session ? (
              <>
                <Link href="/profile" className="flex items-center gap-2 text-primary hover:text-blue-400 transition font-medium">
                  <User className="w-5 h-5" />
                  <span>Profil</span>
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="flex items-center gap-2 hover:text-red-400 transition"
                  title="Se déconnecter"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <Link href="/login" className="flex items-center gap-2 hover:text-primary transition" title="Se connecter">
                <LogIn className="w-5 h-5" />
              </Link>
            )}
          </div>

          {children}
        </div>
      </nav>
    </header>
  );
}
