"use client";

import { useSession } from "next-auth/react";
import useSWR from "swr";
import Link from "next/link";
import HeaderDriver from "@/components/HeaderDriver";
import Button from "@/components/ui/Button";
import { Loader2, TrendingUp, Calendar, Wallet, Navigation } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DriverProfilePage() {
  const { data: session, status } = useSession();

  const { data: statsData, error: statsError } = useSWR(
    session ? "/api/driver/stats" : null,
    fetcher,
    { refreshInterval: 10000 }
  );

  const stats = {
    daily: statsData?.daily ?? 0,
    weekly: statsData?.weekly ?? 0,
    monthly: statsData?.monthly ?? 0,
  };

  const statsLoadFailed = Boolean(statsError) || (statsData && typeof statsData.daily !== "number");

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-dark text-white flex items-center justify-center">
        <p>Accès réservé aux chauffeurs connectés.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark text-white">
      <HeaderDriver />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto glass-effect rounded-2xl p-6">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
            <h1 className="text-2xl font-bold">Tableau de bord chauffeur</h1>
            <div className="flex items-center gap-4">
              <Link href="/admin/live" className="inline-block">
                <Button className="bg-green-600 hover:bg-green-700">
                  <Navigation className="w-4 h-4 mr-2" />
                  Courses en direct
                </Button>
              </Link>
              {session?.user?.name && (
                <span className="text-gray-400">Bonjour, {session.user.name}</span>
              )}
            </div>
          </div>

          {statsLoadFailed ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-red-300">
              <p className="font-semibold">Impossible de charger les statistiques chauffeur.</p>
              <p className="text-sm text-gray-400">Veuillez réessayer dans quelques instants.</p>
            </div>
          ) : !statsData ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Wallet className="w-6 h-6 text-primary" />
                Statistiques Chauffeur
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="p-4 rounded-lg bg-gradient-to-br from-green-900/40 to-green-800/20 border border-green-700/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-green-400" />
                    <h3 className="text-sm font-medium text-gray-300">Aujourd'hui</h3>
                  </div>
                  <p className="text-3xl font-bold text-white">{stats.daily.toFixed(2)} €</p>
                  <p className="text-xs text-gray-400 mt-1">Revenus du jour</p>
                </div>

                <div className="p-4 rounded-lg bg-gradient-to-br from-blue-900/40 to-blue-800/20 border border-blue-700/30">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                    <h3 className="text-sm font-medium text-gray-300">Cette semaine</h3>
                  </div>
                  <p className="text-3xl font-bold text-white">{stats.weekly.toFixed(2)} €</p>
                  <p className="text-xs text-gray-400 mt-1">Revenus hebdomadaires</p>
                </div>

                <div className="p-4 rounded-lg bg-gradient-to-br from-purple-900/40 to-purple-800/20 border border-purple-700/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="w-5 h-5 text-purple-400" />
                    <h3 className="text-sm font-medium text-gray-300">Ce mois</h3>
                  </div>
                  <p className="text-3xl font-bold text-white">{stats.monthly.toFixed(2)} €</p>
                  <p className="text-xs text-gray-400 mt-1">Revenus mensuels</p>
                </div>
              </div>

              {/* Ici on pourra ajouter plus tard : liste des courses du jour, statut en temps réel, etc. */}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
