"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Bell, MapPin, Phone, User, X, Check } from "lucide-react";

interface LiveRideNotification {
  id: string;
  clientName: string;
  clientPhone: string;
  departureAddress: string;
  destinationAddress: string | null;
  requestedAt: string;
}

export function DriverLiveRidePanel() {
  const { data: session } = useSession();
  const [pendingRides, setPendingRides] = useState<LiveRideNotification[]>([]);
  const [isAccepting, setIsAccepting] = useState<string | null>(null);
  const [showPanel, setShowPanel] = useState(false);

  // Connect to SSE stream for new ride requests
  useEffect(() => {
    if (!session?.user) return;
    
    // TODO: Add role-based check when role field is added to User model
    // For now, drivers must manually access /admin/chauffeur route

    const eventSource = new EventSource("/api/live-rides/stream/driver");

    eventSource.addEventListener("message", (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "rides" && message.data) {
          setPendingRides(message.data);
          if (message.data.length > 0) {
            setShowPanel(true);
            // Play notification sound
            if (typeof Audio !== "undefined") {
              const audio = new Audio("/notification.mp3");
              audio.play().catch(() => {
                // Ignore audio play errors
              });
            }
          }
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
  }, [session?.user]);

  const acceptRide = async (rideId: string) => {
    setIsAccepting(rideId);
    try {
      const res = await fetch(`/api/live-rides/${rideId}/accept`, {
        method: "PATCH",
      });

      if (res.ok) {
        setPendingRides((prev) => prev.filter((r) => r.id !== rideId));
        // TODO: Démarrer le suivi de géolocalisation
        alert("Course acceptée ! Le client a été notifié.");
      } else {
        alert("Erreur lors de l'acceptation de la course");
      }
    } catch (err) {
      alert("Erreur réseau");
    } finally {
      setIsAccepting(null);
    }
  };

  const declineRide = async (rideId: string) => {
    // For now, just remove from local list
    // TODO: Implement decline API endpoint
    setPendingRides((prev) => prev.filter((r) => r.id !== rideId));
  };

  if (!session?.user) return null;

  return (
    <>
      {/* Notification Badge */}
      {pendingRides.length > 0 && !showPanel && (
        <button
          onClick={() => setShowPanel(true)}
          className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all hover:scale-110"
        >
          <Bell className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
            {pendingRides.length}
          </span>
        </button>
      )}

      {/* Notification Panel */}
      {showPanel && pendingRides.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-zinc-900 rounded-lg shadow-2xl">
              <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <Bell className="w-6 h-6 text-blue-500" />
                  <h2 className="text-xl font-semibold text-white">
                    Nouvelles demandes de course
                  </h2>
                  <span className="bg-blue-600 text-white text-sm font-semibold px-3 py-1 rounded-full">
                    {pendingRides.length}
                  </span>
                </div>
                <button
                  onClick={() => setShowPanel(false)}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {pendingRides.map((ride) => (
                  <Card key={ride.id} className="p-5 bg-zinc-800/50 border-zinc-700">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-500" />
                          </div>
                          <div>
                            <p className="text-white font-semibold">{ride.clientName}</p>
                            <div className="flex items-center gap-2 text-sm text-zinc-400">
                              <Phone className="w-4 h-4" />
                              <span>{ride.clientPhone}</span>
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-zinc-500">
                          {new Date(ride.requestedAt).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs text-zinc-400 mb-1">Point de départ</p>
                            <p className="text-sm text-zinc-200">{ride.departureAddress}</p>
                          </div>
                        </div>
                        {ride.destinationAddress && (
                          <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs text-zinc-400 mb-1">Destination</p>
                              <p className="text-sm text-zinc-200">{ride.destinationAddress}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3 pt-2">
                        <Button
                          onClick={() => acceptRide(ride.id)}
                          disabled={isAccepting === ride.id}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        >
                          {isAccepting === ride.id ? (
                            "Acceptation..."
                          ) : (
                            <>
                              <Check className="w-4 h-4 mr-2" />
                              Accepter
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => declineRide(ride.id)}
                          disabled={isAccepting === ride.id}
                          variant="outline"
                          className="flex-1 border-zinc-700 hover:bg-zinc-800"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Refuser
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
