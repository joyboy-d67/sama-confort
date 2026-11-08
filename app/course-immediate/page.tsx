"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { MapPin, ArrowLeft, Zap, Clock, Navigation, Euro, Phone } from "lucide-react";
import Header from "@/components/Header";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import AddressAutocomplete from "@/components/booking/AddressAutocomplete";
import MapComponent from "@/components/booking/MapComponent";
import { LiveRideRequest } from "@/components/booking/LiveRideRequest";
import { Place } from "@/types";
import { calculatePrice } from "@/lib/utils";
import Link from "next/link";

export default function LiveRidePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [departure, setDeparture] = useState<Place | null>(null);
  const [destination, setDestination] = useState<Place | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);
  const [showRequest, setShowRequest] = useState(false);
  const [clientPhone, setClientPhone] = useState(session?.user?.phoneNumber || "");

  useEffect(() => {
    if (session?.user?.phoneNumber) {
      setClientPhone(session.user.phoneNumber);
    }
  }, [session?.user?.phoneNumber]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Chargement...</div>
      </div>
    );
  }

  if (!session) {
    router.push("/login");
    return null;
  }

  const clientPhoneValue = clientPhone.trim();
  const hasValidPhone = clientPhoneValue.length >= 6;
  const canRequest = departure !== null && hasValidPhone;

  const handleRequestRide = () => {
    if (!canRequest) return;
    setShowRequest(true);
  };

  const clientName = session.user?.firstName && session.user?.lastName
    ? `${session.user.firstName} ${session.user.lastName}`
    : session.user?.name || "Client";

  if (showRequest && departure) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <Link
              href="/course-immediate"
              className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-6"
              onClick={(e) => {
                e.preventDefault();
                setShowRequest(false);
              }}
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </Link>

            <LiveRideRequest
              departureAddress={departure.address}
              departureLat={departure.lat}
              departureLng={departure.lng}
              destinationAddress={destination?.address}
              destinationLat={destination?.lat}
              destinationLng={destination?.lng}
              clientName={clientName}
              clientPhone={clientPhoneValue}
            />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l&apos;accueil
          </Link>

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-8 h-8 text-yellow-500" />
              <h1 className="text-4xl font-bold text-white">Course immédiate</h1>
            </div>
            <p className="text-zinc-400">
              Demandez une course maintenant et un chauffeur proche vous prendra en charge rapidement
            </p>
          </div>

          <Card className="p-6 bg-zinc-900/50 border-zinc-800">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  <MapPin className="inline w-4 h-4 mr-1 text-green-500" />
                  Point de départ *
                </label>
                <AddressAutocomplete
                  onSelect={setDeparture}
                  placeholder="Où êtes-vous ?"
                  className="w-full"
                />
                {departure && (
                  <p className="mt-2 text-sm text-zinc-400">
                    📍 {departure.address}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  <MapPin className="inline w-4 h-4 mr-1 text-red-500" />
                  Destination (optionnelle)
                </label>
                <AddressAutocomplete
                  onSelect={setDestination}
                  placeholder="Où allez-vous ?"
                  className="w-full"
                />
                {destination && (
                  <p className="mt-2 text-sm text-zinc-400">
                    📍 {destination.address}
                  </p>
                )}
              </div>

              {/* Map and Summary */}
              <div className="rounded-lg overflow-hidden border border-zinc-800">
                <MapComponent
                  departure={departure}
                  destination={destination}
                  onRouteUpdate={setRouteInfo}
                  height="250px"
                />
              </div>

              {routeInfo && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-zinc-800/50 p-3 rounded-lg text-center">
                    <div className="flex justify-center mb-1">
                      <Navigation className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="text-lg font-bold text-white">{routeInfo.distance} km</div>
                    <div className="text-xs text-zinc-400">Distance</div>
                  </div>
                  <div className="bg-zinc-800/50 p-3 rounded-lg text-center">
                    <div className="flex justify-center mb-1">
                      <Clock className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div className="text-lg font-bold text-white">{routeInfo.duration} min</div>
                    <div className="text-xs text-zinc-400">Durée estimée</div>
                  </div>
                  <div className="bg-zinc-800/50 p-3 rounded-lg text-center">
                    <div className="flex justify-center mb-1">
                      <Euro className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="text-lg font-bold text-white">
                      {calculatePrice(routeInfo.distance, 0, departure?.address, destination?.address).toFixed(2)} €
                    </div>
                    <div className="text-xs text-zinc-400">Prix estimé</div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  <Phone className="inline w-4 h-4 mr-1 text-blue-500" />
                  Numéro de téléphone *
                </label>
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="ex: 0612345678"
                  className={`w-full px-4 py-3 bg-zinc-900/70 border rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition ${
                    hasValidPhone ? "border-zinc-800" : "border-red-500/60"
                  }`}
                />
                <p className={`mt-2 text-sm ${hasValidPhone ? "text-zinc-400" : "text-red-400"}`}>
                  {hasValidPhone
                    ? "Nous transmettrons ce numéro au chauffeur pour vous contacter."
                    : "Veuillez saisir un numéro valide pour poursuivre."}
                </p>
              </div>

              <div className="bg-zinc-800/50 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-2">ℹ️ Comment ça marche ?</h3>
                <ol className="space-y-2 text-sm text-zinc-400">
                  <li>1. Indiquez votre position de départ</li>
                  <li>2. Cliquez sur &quot;Demander une course&quot;</li>
                  <li>3. Un chauffeur proche sera notifié</li>
                  <li>4. Vous recevrez le temps d&apos;arrivée estimé</li>
                  <li>5. Suivez votre chauffeur en temps réel</li>
                </ol>
              </div>

              <Button
                onClick={handleRequestRide}
                disabled={!canRequest}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap className="w-5 h-5 mr-2" />
                Demander une course
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
