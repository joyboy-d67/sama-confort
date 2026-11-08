"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Loader2, MapPin, Clock, Euro, Navigation, CreditCard, Wallet, Smartphone } from "lucide-react";
import dynamic from "next/dynamic";
import { calculatePrice } from "@/lib/utils";

const LiveTrackingMap = dynamic(() => import("@/components/booking/LiveTrackingMap"), { ssr: false });

type PaymentMethod = "APP" | "CASH" | "CARD";

interface LiveRideRequestProps {
  departureAddress: string;
  departureLat: number;
  departureLng: number;
  destinationAddress?: string;
  destinationLat?: number;
  destinationLng?: number;
  clientName: string;
  clientPhone: string;
}

interface LiveRideData {
  id: string;
  status: string;
  driverId: string | null;
  driverLat: number | null;
  driverLng: number | null;
  estimatedArrival: number | null;
  acceptedAt: Date | null;
  distance: number | null;
  price: number | null;
}

export function LiveRideRequest({
  departureAddress,
  departureLat,
  departureLng,
  destinationAddress,
  destinationLat,
  destinationLng,
  clientName,
  clientPhone,
}: LiveRideRequestProps) {
  const { data: session } = useSession();
  const [isRequesting, setIsRequesting] = useState(false);
  const [liveRide, setLiveRide] = useState<LiveRideData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("APP");
  const [routedDistance, setRoutedDistance] = useState<number | null>(null);

  // Connect to SSE stream when ride is created
  useEffect(() => {
    if (!liveRide?.id) return;

    const eventSource = new EventSource(
      `/api/live-rides/stream/client?rideId=${liveRide.id}`
    );

    eventSource.addEventListener("message", (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "rideUpdate") {
          setLiveRide(message.data);
        }
      } catch (err) {
        console.error("Error parsing SSE message:", err);
      }
    });

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [liveRide?.id]);

  const requestLiveRide = async () => {
    if (!session?.user?.id) {
      setError("Vous devez être connecté pour demander une course");
      return;
    }

    if (!clientPhone || clientPhone.trim().length < 6) {
      setError("Veuillez renseigner un numéro de téléphone valide avant de continuer.");
      return;
    }

    setIsRequesting(true);
    setError(null);

    try {
      const res = await fetch("/api/live-rides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName,
          departureAddress,
          departureLat,
          departureLng,
          destinationAddress,
          destinationLat,
          destinationLng,
          paymentMethod,
          clientPhone: clientPhone.trim(),
        }),
      });

      if (!res.ok) {
        throw new Error("Erreur lors de la demande de course");
      }

      const data = await res.json();
      setLiveRide(data.liveRide);
      setIsRequesting(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
      setIsRequesting(false);
    }
  };

  const cancelRequest = () => {
    setLiveRide(null);
    setIsRequesting(false);
    setError(null);
  };

  // Render states
  if (error) {
    return (
      <Card className="p-6 bg-red-950/50 border-red-900">
        <p className="text-red-400 mb-4">{error}</p>
        <Button onClick={() => setError(null)} variant="outline">
          Réessayer
        </Button>
      </Card>
    );
  }

  // Calculate estimated values
  // Priorité : distance routière (itinéraire voiture), sinon API, sinon vol d'oiseau
  const estimatedDistance = routedDistance ?? liveRide?.distance ?? (destinationLat && destinationLng ? 
    Math.sqrt(Math.pow((destinationLat - departureLat) * 111, 2) + Math.pow((destinationLng - departureLng) * 85, 2)) : 0);

  const estimatedPrice = liveRide?.price || calculatePrice(estimatedDistance, 0, departureAddress, destinationAddress);
  
  // Waiting for driver acceptance
  if (liveRide && liveRide.status === "REQUESTED") {
    return (
      <div className="space-y-6">
        <Card className="p-6 bg-zinc-900/50 border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                Recherche en cours...
              </h3>
              <p className="text-zinc-400 mt-1">Nous recherchons le chauffeur le plus proche</p>
            </div>
          </div>

          {/* Map */}
          <div className="h-[400px] rounded-lg overflow-hidden mb-4">
            <LiveTrackingMap
              departureLat={departureLat}
              departureLng={departureLng}
              destinationLat={destinationLat}
              destinationLng={destinationLng}
              showDriver={false}
              onRouteUpdate={(route: { distance: number; duration: number }) => {
                if (route?.distance) setRoutedDistance(route.distance);
              }}
            />
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-zinc-800/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-500 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-medium">Délai moyen</span>
              </div>
              <p className="text-xl font-bold text-white">5-10 min</p>
            </div>

            <div className="bg-zinc-800/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-500 mb-1">
                <Navigation className="w-4 h-4" />
                <span className="text-xs font-medium">Distance</span>
              </div>
              <p className="text-xl font-bold text-white">{estimatedDistance.toFixed(1)} km</p>
            </div>

            <div className="bg-zinc-800/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-purple-500 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-medium">Durée trajet</span>
              </div>
              <p className="text-xl font-bold text-white">{Math.ceil(estimatedDistance * 2)} min</p>
            </div>

            <div className="bg-zinc-800/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-yellow-500 mb-1">
                <Euro className="w-4 h-4" />
                <span className="text-xs font-medium">Prix estimé</span>
              </div>
              <p className="text-xl font-bold text-white">{estimatedPrice.toFixed(2)}€</p>
            </div>
          </div>

          {/* Addresses */}
          <div className="space-y-3 mb-4">
            <div className="flex items-start gap-3 bg-zinc-800/30 rounded-lg p-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-green-500" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-zinc-400 mb-1">Départ</p>
                <p className="text-sm text-white font-medium">{departureAddress}</p>
              </div>
            </div>

            {destinationAddress && (
              <div className="flex items-start gap-3 bg-zinc-800/30 rounded-lg p-3">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-zinc-400 mb-1">Destination</p>
                  <p className="text-sm text-white font-medium">{destinationAddress}</p>
                </div>
              </div>
            )}
          </div>

          <Button onClick={cancelRequest} variant="outline" className="w-full">
            Annuler la demande
          </Button>
        </Card>
      </div>
    );
  }

  // Driver accepted - show tracking
  if (liveRide && (liveRide.status === "ACCEPTED" || liveRide.status === "DRIVER_EN_ROUTE")) {
    // Calculate ETA based on driver distance if available, otherwise fallback
    const eta = liveRide.estimatedArrival || 10;

    return (
      <div className="space-y-6">
        <Card className="p-6 bg-zinc-900/50 border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                🚗 Chauffeur en route
              </h3>
              <p className="text-zinc-400 mt-1">Suivez l'arrivée de votre chauffeur en temps réel</p>
            </div>
            <div className="bg-green-500/20 px-4 py-3 rounded-xl border border-green-500/30">
              <div className="flex items-center gap-2">
                <Clock className="w-6 h-6 text-green-500" />
                <div>
                  <p className="text-xs text-green-400">Arrivée dans</p>
                  <p className="text-2xl font-bold text-green-500">{eta} min</p>
                </div>
              </div>
            </div>
          </div>

          {/* Live Map with Driver */}
          <div className="h-[450px] rounded-lg overflow-hidden mb-4 relative">
            <LiveTrackingMap
              departureLat={departureLat}
              departureLng={departureLng}
              destinationLat={destinationLat}
              destinationLng={destinationLng}
              driverLat={liveRide.driverLat ?? undefined}
              driverLng={liveRide.driverLng ?? undefined}
              showDriver={true}
            />
            {liveRide.driverLat && liveRide.driverLng && (
              <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-green-500/30">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-white font-medium">Position en direct</span>
                </div>
              </div>
            )}
          </div>

          {/* Trip Info */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
              <Navigation className="w-5 h-5 text-blue-500 mx-auto mb-1" />
              <p className="text-xs text-zinc-400">Distance</p>
              <p className="text-lg font-bold text-white">{estimatedDistance.toFixed(1)} km</p>
            </div>

            <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
              <Clock className="w-5 h-5 text-purple-500 mx-auto mb-1" />
              <p className="text-xs text-zinc-400">Durée trajet</p>
              <p className="text-lg font-bold text-white">{Math.ceil(estimatedDistance * 2)} min</p>
            </div>

            <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
              <Euro className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
              <p className="text-xs text-zinc-400">Prix</p>
              <p className="text-lg font-bold text-white">{estimatedPrice.toFixed(2)}€</p>
            </div>
          </div>

          {/* Addresses Timeline */}
          <div className="bg-zinc-800/30 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-green-500" />
                </div>
                {destinationAddress && (
                  <div className="absolute top-10 left-5 w-0.5 h-6 bg-gradient-to-b from-green-500/50 to-red-500/50" />
                )}
              </div>
              <div className="flex-1 pt-2">
                <p className="text-xs text-zinc-400 mb-1">Point de prise en charge</p>
                <p className="text-sm text-white font-medium">{departureAddress}</p>
              </div>
            </div>
            
            {destinationAddress && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex-1 pt-2">
                  <p className="text-xs text-zinc-400 mb-1">Destination finale</p>
                  <p className="text-sm text-white font-medium">{destinationAddress}</p>
                </div>
              </div>
            )}
          </div>

          {/* Status Bar */}
          <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <p className="text-sm text-blue-400 text-center">
              ℹ️ Le chauffeur vous contactera à son arrivée
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Initial button to request ride
  return (
    <div className="space-y-4">
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
        <h3 className="text-white font-medium mb-3 flex items-center gap-2">
          <Wallet className="w-4 h-4 text-blue-500" />
          Moyen de paiement
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setPaymentMethod("APP")}
            className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
              paymentMethod === "APP"
                ? "bg-blue-600/20 border-blue-500 text-blue-400"
                : "bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:bg-zinc-800"
            }`}
          >
            <Smartphone className="w-6 h-6 mb-2" />
            <span className="text-xs font-medium">Application</span>
          </button>
          <button
            onClick={() => setPaymentMethod("CARD")}
            className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
              paymentMethod === "CARD"
                ? "bg-blue-600/20 border-blue-500 text-blue-400"
                : "bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:bg-zinc-800"
            }`}
          >
            <CreditCard className="w-6 h-6 mb-2" />
            <span className="text-xs font-medium">Carte Bancaire</span>
          </button>
          <button
            onClick={() => setPaymentMethod("CASH")}
            className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
              paymentMethod === "CASH"
                ? "bg-blue-600/20 border-blue-500 text-blue-400"
                : "bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:bg-zinc-800"
            }`}
          >
            <Euro className="w-6 h-6 mb-2" />
            <span className="text-xs font-medium">Espèces</span>
          </button>
        </div>
      </div>

      <Button
        onClick={requestLiveRide}
        disabled={isRequesting}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6 text-lg"
      >
        {isRequesting ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Demande en cours...
          </>
        ) : (
          "Course immédiate"
        )}
      </Button>
    </div>
  );
}
