"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import useSWR from "swr";
import ProgressGauge from "@/components/profile/ProgressGauge";
import Header from "@/components/Header";
import Button from "@/components/ui/Button";
import { Loader2, LogOut, X } from "lucide-react";
import { redirect } from "next/navigation";

type Ride = {
  id: string;
  date: string;
  samaPrice: number; // price with our app
  boltPrice: number;
  uberPrice: number;
};

function sampleRides(): Ride[] {
  // A small set of sample rides for demo/testing
  return [
    { id: "1", date: "2025-11-01", samaPrice: 12.5, boltPrice: 15.0, uberPrice: 16.0 },
    { id: "2", date: "2025-11-03", samaPrice: 8.2, boltPrice: 10.5, uberPrice: 11.0 },
    { id: "3", date: "2025-11-05", samaPrice: 23.0, boltPrice: 26.5, uberPrice: 27.0 },
    { id: "4", date: "2025-11-07", samaPrice: 9.5, boltPrice: 11.0, uberPrice: 12.0 },
    { id: "5", date: "2025-11-09", samaPrice: 14.0, boltPrice: 16.0, uberPrice: 17.0 },
    { id: "6", date: "2025-11-11", samaPrice: 7.8, boltPrice: 9.5, uberPrice: 10.0 },
    { id: "7", date: "2025-11-13", samaPrice: 18.0, boltPrice: 20.0, uberPrice: 22.0 },
    { id: "8", date: "2025-11-15", samaPrice: 11.0, boltPrice: 12.5, uberPrice: 13.0 },
    { id: "9", date: "2025-11-17", samaPrice: 6.5, boltPrice: 8.0, uberPrice: 9.0 },
    { id: "10", date: "2025-11-19", samaPrice: 25.0, boltPrice: 30.0, uberPrice: 32.0 },
    { id: "11", date: "2025-11-20", samaPrice: 13.5, boltPrice: 15.0, uberPrice: 16.0 },
  ];
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const { data, error, mutate } = useSWR(
    session ? '/api/profile/rides' : null,
    fetcher
  );

  // Fetch user's bookings for "Mes courses à venir" (refresh every 5s)
  const { data: bookingsData } = useSWR(
    session ? '/api/profile/bookings' : null,
    fetcher,
    { refreshInterval: 5000 }
  );

  const rides: Ride[] = data?.rides || [];
  const loading = status === "loading" || (!data && !error && !!session);

  const totalRides = rides.length;
  const ridesTowardsPromo = totalRides % 10;
  const promosEarned = Math.floor(totalRides / 10);

  const totalSavingsBolt = rides.reduce((acc, r) => acc + Math.max(0, r.boltPrice - r.samaPrice), 0);
  const totalSavingsUber = rides.reduce((acc, r) => acc + Math.max(0, r.uberPrice - r.samaPrice), 0);

  const addSample = async () => {
    const payload = { rides: sampleRides() };
    try {
      await fetch('/api/profile/rides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      await mutate();
    } catch (e) {
      console.error('Failed to add sample rides', e);
    }
  };

  const reset = async () => {
    try {
      await fetch('/api/profile/rides', { method: 'DELETE' });
      await mutate();
    } catch (e) {
      console.error('Failed to reset rides', e);
    }
  };

  // Si l'utilisateur connecté est un chauffeur, on le redirige vers l'espace chauffeur
  const role = (session?.user as any)?.role ?? "USER";
  if (status === "authenticated" && role === "DRIVER") {
    redirect("/driver/profile");
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-dark">
        <Header />
        <div className="flex flex-col items-center justify-center h-[80vh] text-white">
          <h1 className="text-2xl font-bold mb-4">Connectez-vous pour voir votre profil</h1>
          <button
            onClick={() => signIn()}
            className="px-6 py-3 bg-primary rounded-lg font-bold hover:bg-blue-600 transition"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark">
      <Header />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto glass-effect rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Mon profil</h1>
            {session?.user?.name && <span className="text-gray-400">Bonjour, {session.user.name}</span>}
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="p-4 rounded-lg bg-dark-lighter border border-dark-gray">
                  <h3 className="text-lg font-semibold mb-2">Score & fidélité</h3>
                  <p className="text-gray-300 mb-3">Nombre de courses : <span className="font-medium">{totalRides}</span></p>
                  <p className="text-gray-300 mb-3">Promotions obtenues : <span className="font-medium">{promosEarned}</span></p>

                  <div className="mb-3">
                    <ProgressGauge value={ridesTowardsPromo === 0 && totalRides > 0 ? 10 : ridesTowardsPromo} />
                  </div>

                  <p className="text-sm text-gray-400 mb-2">
                    {promosEarned > 0
                      ? `Vous avez obtenu ${promosEarned} promotion(s) de 30%.`
                      : `Progression vers la prochaine promotion : ${ridesTowardsPromo} / 10 courses`}
                  </p>

                  {ridesTowardsPromo === 0 && totalRides > 0 ? (
                    <div className="text-sm text-green-400 font-semibold">Promotion de 30% disponible sur votre prochaine course !</div>
                  ) : null}
                </div>

                <div className="p-4 rounded-lg bg-dark-lighter border border-dark-gray">
                  <h3 className="text-lg font-semibold mb-2">Économies</h3>
                  <p className="text-gray-300 mb-2">Économies totales vs Bolt : <span className="font-medium">{totalSavingsBolt.toFixed(2)} €</span></p>
                  <p className="text-gray-300 mb-2">Économies totales vs Uber : <span className="font-medium">{totalSavingsUber.toFixed(2)} €</span></p>
                  <p className="text-sm text-gray-400">Moyenne par course (vs Bolt) : <span className="font-medium">{(totalRides ? (totalSavingsBolt / totalRides).toFixed(2) : "0.00")} €</span></p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Mes courses à venir</h3>

                {bookingsData && bookingsData.bookings && bookingsData.bookings.length > 0 ? (
                  <div className="space-y-2 mb-4">
                    {bookingsData.bookings
                      .filter((b: any) => b.status === 'PENDING' || b.status === 'CONFIRMED')
                      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .map((b: any) => {
                        const bookingDateTime = new Date(b.date);
                        const [startHour] = b.timeSlot.split('-');
                        const [hours, minutes] = startHour.split(':').map(Number);
                        bookingDateTime.setHours(hours, minutes, 0, 0);
                        const now = new Date();
                        const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
                        const canCancel = bookingDateTime > twoHoursFromNow;

                        return (
                          <div key={b.id} className="p-3 bg-dark rounded-md border border-dark-gray flex justify-between items-center">
                            <div className="flex-1">
                              <div className="text-sm text-gray-300">{new Date(b.date).toLocaleDateString('fr-FR')} - {b.timeSlot}</div>
                              <div className="text-sm text-gray-400">{b.departureAddress} → {b.destinationAddress}</div>
                              <div className="text-sm text-gray-500 mt-1">{b.price.toFixed(2)} €</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded text-xs ${b.status === 'PENDING' ? 'bg-yellow-600 text-black' : 'bg-green-700 text-white'}`}>
                                {b.status === 'PENDING' ? 'En attente' : 'Confirmée'}
                              </span>
                              {canCancel && (
                                <button
                                  onClick={async () => {
                                    if (!confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) return;
                                    try {
                                      const res = await fetch(`/api/bookings/${b.id}/cancel`, { method: 'POST' });
                                      const data = await res.json();
                                      if (res.ok) {
                                        alert('Réservation annulée avec succès');
                                        mutate();
                                      } else {
                                        alert(data.message || 'Erreur lors de l\'annulation');
                                      }
                                    } catch (err) {
                                      alert('Erreur lors de l\'annulation');
                                    }
                                  }}
                                  className="p-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 hover:border-gray-500 text-gray-400 rounded transition"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="text-gray-400 mb-4">Aucune course à venir.</div>
                )}

                <h3 className="text-lg font-semibold mb-2">Historique des courses</h3>
                {rides.length === 0 ? (
                  <div className="text-gray-400 mb-4">Aucune course enregistrée. Vous pouvez ajouter des courses factices pour tester la page.</div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-auto">
                    {rides.map((r) => (
                      <div key={r.id} className="p-3 bg-dark rounded-md border border-dark-gray flex justify-between items-center">
                        <div>
                          <div className="text-sm text-gray-300">{r.date}</div>
                          <div className="text-sm text-gray-400">Sama: <span className="font-medium">{r.samaPrice.toFixed(2)} €</span> — Bolt: <span className="font-medium">{r.boltPrice.toFixed(2)} €</span> — Uber: <span className="font-medium">{r.uberPrice.toFixed(2)} €</span></div>
                        </div>
                        <div className="text-sm text-gray-300">Éco vs Bolt: <span className="font-medium">{Math.max(0, r.boltPrice - r.samaPrice).toFixed(2)} €</span></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={addSample}
                  className="px-4 py-2 bg-primary text-black rounded-md font-medium"
                >
                  Ajouter des courses factices
                </button>
                <button
                  onClick={reset}
                  className="px-4 py-2 bg-dark-anthracite text-gray-300 rounded-md border border-dark-gray"
                >
                  Réinitialiser
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
