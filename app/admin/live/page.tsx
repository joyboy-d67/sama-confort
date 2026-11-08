"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import HeaderDriver from "@/components/HeaderDriver";
import { Loader2, MapPin, Clock, Navigation, CheckCircle, Phone, User, X, Check } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import dynamic from "next/dynamic";

const LiveTrackingMap = dynamic(() => import("@/components/booking/LiveTrackingMap"), { ssr: false });

interface LiveRide {
  id: string;
  clientName: string;
  clientPhone: string;
  departureAddress: string;
  departureLat: number;
  departureLng: number;
  destinationAddress: string | null;
  destinationLat: number | null;
  destinationLng: number | null;
  status: string;
  driverId: string | null;
  driverLat: number | null;
  driverLng: number | null;
  estimatedArrival: number | null;
  price: number | null;
  distance: number | null;
  paymentMethod: "APP" | "CASH" | "CARD";
  requestedAt: string;
  acceptedAt: string | null;
  // Absents du modèle LiveRide (courses immédiates) : formatRemainingTime renvoie alors null
  date?: string;
  timeSlot?: string;
}

export default function LiveRidesPage() {
  const { data: session, status } = useSession();
  const [liveRides, setLiveRides] = useState<LiveRide[]>([]);
  const [selectedRide, setSelectedRide] = useState<LiveRide | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [now, setNow] = useState<Date>(new Date());
  const [showNewRideModal, setShowNewRideModal] = useState(false);
  const [newRide, setNewRide] = useState<LiveRide | null>(null);
  const [previousRidesCount, setPreviousRidesCount] = useState(0);

  // Fetch live rides
  useEffect(() => {
    fetchLiveRides();
    const ridesInterval = setInterval(fetchLiveRides, 5000);

    // Timer pour mettre à jour le temps restant
    const nowInterval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      clearInterval(ridesInterval);
      clearInterval(nowInterval);
    };
  }, []);

  const playNotification = () => {
    try {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
      audio.play().catch(e => console.log("Audio play failed", e));
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 200]);
      }
    } catch (e) {
      console.error("Notification failed", e);
    }
  };

  const fetchLiveRides = async () => {
    try {
      const res = await fetch("/api/live-rides/driver");
      if (res.ok) {
        const data = await res.json();
        const rides = data.rides || [];
        
        // Check for new requested rides
        const requestedRides = rides.filter((r: LiveRide) => r.status === "REQUESTED");
        if (requestedRides.length > previousRidesCount) {
          // Find the new ride (simplification: take the last one)
          const latestRide = requestedRides[requestedRides.length - 1];
          if (latestRide) {
            setNewRide(latestRide);
            setShowNewRideModal(true);
            playNotification();
          }
        }
        
        setPreviousRidesCount(requestedRides.length);
        setLiveRides(rides);
      }
    } catch (err) {
      console.error("Error fetching live rides:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const rejectRide = async (rideId: string) => {
    try {
      await fetch(`/api/live-rides/${rideId}/reject`, {
        method: "POST",
      });
      setShowNewRideModal(false);
      setNewRide(null);
      fetchLiveRides();
    } catch (err) {
      console.error("Error rejecting ride:", err);
    }
  };

  const acceptRide = async (rideId: string) => {
    try {
      const res = await fetch(`/api/live-rides/${rideId}/accept`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedRide(data.ride);
        setShowNewRideModal(false);
        setNewRide(null);
        fetchLiveRides();
        
        // Automatically open Waze to client location
        if (data.ride.departureLat && data.ride.departureLng) {
          openWaze(data.ride.departureLat, data.ride.departureLng);
        }
      }
    } catch (err) {
      console.error("Error accepting ride:", err);
    }
  };

  const notifyClient = async (rideId: string) => {
    try {
      await fetch(`/api/live-rides/${rideId}/notify`, {
        method: "POST",
      });
      alert("Client notifié de votre arrivée !");
    } catch (err) {
      console.error("Error notifying client:", err);
    }
  };

  const startTrip = async (rideId: string) => {
    try {
      const res = await fetch(`/api/live-rides/${rideId}/start`, {
        method: "POST",
      });
      if (res.ok) {
        fetchLiveRides();
      }
    } catch (err) {
      console.error("Error starting trip:", err);
    }
  };

  const completeRide = async (rideId: string) => {
    try {
      const res = await fetch(`/api/live-rides/${rideId}/complete`, {
        method: "POST",
      });
      if (res.ok) {
        setSelectedRide(null);
        fetchLiveRides();
        alert("Course terminée avec succès !");
      }
    } catch (err) {
      console.error("Error completing ride:", err);
    }
  };

  const openWaze = (lat: number, lng: number) => {
    const wazeUrl = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
    window.open(wazeUrl, "_blank");
  };

  const formatRemainingTime = (ride: LiveRide) => {
    if (!ride.date || !ride.timeSlot) return null;

    try {
      const [startHour] = ride.timeSlot.split("-");
      const [hour, minute] = startHour.split(":").map(Number);
      const rideDate = new Date(ride.date);
      rideDate.setHours(hour, minute, 0, 0);

      const diffMs = rideDate.getTime() - now.getTime();
      const diffMinutes = Math.round(diffMs / 60000);

      if (diffMinutes < 0) return "Course en retard";
      if (diffMinutes === 0) return "Course maintenant";

      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;

      if (hours > 0) {
        return `${hours}h ${minutes.toString().padStart(2, "0")} min`;
      }

      return `${minutes} min`;
    } catch {
      return null;
    }
  };

  if (status === "loading" || isLoading) {
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

  const pendingRides = liveRides.filter((r) => r.status === "REQUESTED");
  const activeRides = liveRides.filter((r) => 
    r.status === "ACCEPTED" || r.status === "DRIVER_EN_ROUTE" || r.status === "ARRIVED" || r.status === "IN_PROGRESS"
  );

  return (
    <div className="min-h-screen bg-dark text-white">
      <HeaderDriver />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Courses en temps réel</h1>

        {/* Active ride */}
        {selectedRide && (
          <Card className="p-6 mb-8 bg-gradient-to-br from-blue-900/40 to-blue-800/20 border-blue-700/30">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Navigation className="w-6 h-6 text-blue-400" />
              Course en cours
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-semibold">{selectedRide.clientName}</p>
                    <a href={`tel:${selectedRide.clientPhone}`} className="text-blue-400 hover:underline text-sm flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {selectedRide.clientPhone}
                    </a>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-green-400 mt-0.5" />
                    <div>
                      <p className="text-gray-400">Départ</p>
                      <p className="text-white">{selectedRide.departureAddress}</p>
                    </div>
                  </div>
                  {selectedRide.destinationAddress && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-red-400 mt-0.5" />
                      <div>
                        <p className="text-gray-400">Destination</p>
                        <p className="text-white">{selectedRide.destinationAddress}</p>
                      </div>
                    </div>
                  )}
                </div>

                {selectedRide.price && (
                  <div className="mt-4 p-3 bg-dark rounded-lg">
                    <p className="text-gray-400 text-sm">Prix estimé</p>
                    <p className="text-2xl font-bold text-green-400">{selectedRide.price.toFixed(2)} €</p>
                  </div>
                )}

                <div className="mt-4 flex items-center gap-2 text-sm text-gray-300">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <span>
                    Temps restant avant la course : {formatRemainingTime(selectedRide) ?? "-"}
                  </span>
                </div>
              </div>

              <div className="h-64 rounded-lg overflow-hidden">
                <LiveTrackingMap
                  departureLat={selectedRide.departureLat}
                  departureLng={selectedRide.departureLng}
                  destinationLat={selectedRide.destinationLat ?? undefined}
                  destinationLng={selectedRide.destinationLng ?? undefined}
                  driverLat={selectedRide.driverLat ?? undefined}
                  driverLng={selectedRide.driverLng ?? undefined}
                  status={selectedRide.status}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {selectedRide.status === "ACCEPTED" && (
                <>
                  <Button
                    onClick={() => {
                      openWaze(selectedRide.departureLat, selectedRide.departureLng);
                      notifyClient(selectedRide.id);
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    Se rendre chez le client
                  </Button>
                  <Button
                    onClick={() => startTrip(selectedRide.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Démarrer la course
                  </Button>
                </>
              )}

              {(selectedRide.status === "DRIVER_EN_ROUTE" || selectedRide.status === "ARRIVED") && selectedRide.destinationLat && selectedRide.destinationLng && (
                <Button
                  onClick={() => openWaze(selectedRide.destinationLat!, selectedRide.destinationLng!)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Se rendre à la destination
                </Button>
              )}

              {selectedRide.status === "IN_PROGRESS" && (
                <Button
                  onClick={() => completeRide(selectedRide.id)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Course terminée
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Pending requests */}
        {pendingRides.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Nouvelles demandes ({pendingRides.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingRides.map((ride) => (
                <Card key={ride.id} className="p-4 bg-zinc-900/50 border-zinc-800 hover:border-primary transition">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-lg">{ride.clientName}</p>
                      <p className="text-sm text-gray-400">{ride.clientPhone}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      {new Date(ride.requestedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-300">{ride.departureAddress}</p>
                    </div>
                    {ride.destinationAddress && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                        <p className="text-gray-300">{ride.destinationAddress}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-zinc-800">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        ride.paymentMethod === 'CASH' ? 'bg-green-500/20 text-green-400' :
                        ride.paymentMethod === 'CARD' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-purple-500/20 text-purple-400'
                      }`}>
                        {ride.paymentMethod === 'CASH' ? 'Espèces' :
                         ride.paymentMethod === 'CARD' ? 'Carte Bancaire' : 'Application'}
                      </span>
                      {ride.price && (
                        <span className="text-yellow-500 font-bold text-sm">{ride.price} €</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => rejectRide(ride.id)}
                      variant="outline"
                      className="flex-1 border-red-500 text-red-500 hover:bg-red-500/10"
                    >
                      Refuser
                    </Button>
                    <Button
                      onClick={() => acceptRide(ride.id)}
                      className="flex-1 bg-primary hover:bg-blue-600"
                      disabled={!!selectedRide}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Accepter
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* New Ride Modal */}
        {showNewRideModal && newRide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-700/50 rounded-3xl w-full max-w-lg shadow-2xl shadow-blue-900/20 animate-in zoom-in slide-in-from-bottom-4 duration-300">
              {/* Close Button */}
              <button
                onClick={() => {
                  setShowNewRideModal(false);
                  setNewRide(null);
                }}
                className="absolute top-4 right-4 p-2 rounded-full bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-400 hover:text-white transition-all duration-200"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="text-center pt-8 pb-6 px-6 border-b border-zinc-800">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/30 animate-pulse">
                  <Navigation className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Nouvelle course !</h2>
                <p className="text-zinc-400 text-sm">Un client demande une course à proximité</p>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Addresses */}
                <div className="bg-zinc-800/30 rounded-2xl p-5 border border-zinc-800/50">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Départ</p>
                      <p className="font-medium text-white leading-snug">{newRide.departureAddress}</p>
                    </div>
                  </div>
                  {newRide.destinationAddress && (
                    <div className="flex items-start gap-4 pt-4 border-t border-zinc-700/50">
                      <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-red-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Destination</p>
                        <p className="font-medium text-white leading-snug">{newRide.destinationAddress}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Price & Payment */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20 rounded-2xl p-4 text-center">
                    <p className="text-xs text-yellow-200/70 uppercase tracking-wide mb-2">Prix estimé</p>
                    <p className="text-2xl font-bold text-yellow-400">{newRide.price} €</p>
                  </div>
                  <div className={`rounded-2xl p-4 text-center border ${
                    newRide.paymentMethod === 'CASH' 
                      ? 'bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20' 
                      : newRide.paymentMethod === 'CARD'
                      ? 'bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20'
                      : 'bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20'
                  }`}>
                    <p className="text-xs text-zinc-400 uppercase tracking-wide mb-2">Paiement</p>
                    <p className={`text-lg font-bold ${
                      newRide.paymentMethod === 'CASH' ? 'text-green-400' :
                      newRide.paymentMethod === 'CARD' ? 'text-blue-400' :
                      'text-purple-400'
                    }`}>
                      {newRide.paymentMethod === 'CASH' ? 'Espèces' :
                       newRide.paymentMethod === 'CARD' ? 'CB' : 'App'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 p-6 pt-0">
                <button
                  onClick={() => rejectRide(newRide.id)}
                  className="flex-1 py-4 rounded-2xl bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700 hover:border-zinc-600 text-zinc-300 hover:text-white font-semibold transition-all duration-200 flex items-center justify-center gap-2 group"
                >
                  <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>Refuser</span>
                </button>
                <button
                  onClick={() => acceptRide(newRide.id)}
                  className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold shadow-lg shadow-blue-600/30 hover:shadow-blue-500/40 transition-all duration-200 flex items-center justify-center gap-2 group"
                >
                  <Check className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>Accepter</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!selectedRide && pendingRides.length === 0 && activeRides.length === 0 && (
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
                <Clock className="w-8 h-8 text-gray-500" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Aucune course en attente</h3>
                <p className="text-gray-400">Les nouvelles demandes apparaîtront ici automatiquement</p>
              </div>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
