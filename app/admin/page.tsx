"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Check, X, RefreshCw, Navigation, Clock, MapPin } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Header from "@/components/Header";
import { Booking } from "@/types";
import { formatPrice } from "@/lib/utils";

export default function AdminPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    fetchBookings();
  }, [filter]);

  // Met à jour l'heure actuelle pour le compte à rebours
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const url =
        filter === "all"
          ? "/api/bookings"
          : `/api/bookings?status=${filter}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateBookingStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetchBookings();
      }
    } catch (error) {
      console.error("Error updating booking:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "text-yellow-500";
      case "CONFIRMED":
        return "text-green-500";
      case "REJECTED":
        return "text-red-500";
      case "COMPLETED":
        return "text-blue-500";
      case "CANCELLED":
        return "text-gray-500";
      default:
        return "text-gray-400";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: "En attente",
      CONFIRMED: "Confirmée",
      REJECTED: "Refusée",
      COMPLETED: "Terminée",
      CANCELLED: "Annulée",
    };
    return labels[status] || status;
  };

  const formatRemainingTime = (booking: Booking) => {
    try {
      const bookingDate = new Date(booking.date);

      // timeSlot est de la forme "15:00-16:00"
      const [startHour] = booking.timeSlot.split("-");
      const [hour, minute] = startHour.split(":").map(Number);
      bookingDate.setHours(hour, minute, 0, 0);

      const diffMs = bookingDate.getTime() - now.getTime();
      const diffMinutes = Math.round(diffMs / 60000);

      if (diffMinutes < 0) return { label: "En retard", color: "text-red-400" };
      if (diffMinutes === 0) return { label: "Maintenant", color: "text-green-400" };

      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;

      let label = "";
      if (hours > 0) {
        label = `${hours}h ${minutes.toString().padStart(2, "0")} min`;
      } else {
        label = `${minutes} min`;
      }

      let color = "text-green-400";
      if (diffMinutes <= 15) {
        color = "text-red-400"; // très urgent
      } else if (diffMinutes <= 30) {
        color = "text-yellow-400"; // approche
      }

      return { label, color };
    } catch {
      return { label: "-", color: "text-gray-400" };
    }
  };

  return (
    <div className="min-h-screen bg-dark">
      <Header title="Sama Confort - Admin">
        <Link href="/admin/live">
          <Button className="bg-green-600 hover:bg-green-700">
            <Navigation className="w-4 h-4 mr-2" />
            Courses en direct
          </Button>
        </Link>
        <Button variant="ghost" onClick={fetchBookings}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
        <Link href="/">
          <Button variant="outline">Retour au site</Button>
        </Link>
      </Header>

      <main className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Gestion des Réservations</h1>
          <p className="text-gray-400">
            Gérez toutes les réservations de vos clients
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-8 overflow-x-auto">
          {[
            { value: "all", label: "Toutes" },
            { value: "PENDING", label: "En attente" },
            { value: "CONFIRMED", label: "Confirmées" },
            { value: "REJECTED", label: "Refusées" },
            { value: "COMPLETED", label: "Terminées" },
          ].map((f) => (
            <Button
              key={f.value}
              variant={filter === f.value ? "primary" : "ghost"}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>

        {/* Bookings List */}
        {isLoading ? (
          <div className="text-center py-20">
            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-400">Chargement des réservations...</p>
          </div>
        ) : bookings.length === 0 ? (
          <Card variant="glass" className="text-center py-20">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p className="text-xl text-gray-400">Aucune réservation trouvée</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Card key={booking.id} variant="glass">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex-1 space-y-4">
                    {/* Customer Info */}
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold">
                          {booking.firstName} {booking.lastName}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                            booking.status
                          )} bg-dark-anthracite`}
                        >
                          {getStatusLabel(booking.status)}
                        </span>
                      </div>
                      <div className="text-gray-400 text-sm space-y-1">
                        <p>📞 {booking.phoneNumber}</p>
                        {booking.email && <p>✉️ {booking.email}</p>}
                      </div>
                    </div>

                    {/* Trip Details */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Trajet</p>
                        <p className="font-medium">
                          <span className="text-gray-400 mr-1 text-sm">Départ :</span>
                          {booking.departureAddress}
                        </p>
                        <p className="font-medium mt-1">
                          <span className="text-gray-400 mr-1 text-sm">Destination :</span>
                          {booking.destinationAddress}
                        </p>
                        <p className="text-sm text-gray-400 mt-2">
                          Distance: {booking.distance.toFixed(2)} km
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Date et heure</p>
                        <p className="font-medium">
                          <span className="text-gray-400 mr-1 text-sm">Date :</span>
                          {new Date(booking.date).toLocaleDateString("fr-FR", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                        <p className="font-medium mt-1">
                          <span className="text-gray-400 mr-1 text-sm">Heure :</span>
                          {booking.timeSlot.split("-")[0]}
                        </p>
                        {(() => {
                          const remaining = formatRemainingTime(booking);
                          return (
                            <div className="mt-3 p-2 bg-dark-anthracite rounded-lg border border-dark-gray">
                              <span className="text-gray-400 text-xs">Dans</span>
                              <div className={`text-lg font-bold ${remaining.color} mt-0.5`}>
                                {remaining.label}
                              </div>
                            </div>
                          );
                        })()}
                        {booking.isRecurring && (
                          <p className="text-sm text-primary mt-2">
                            🔄 Récurrent ({booking.recurrenceType})
                          </p>
                        )}
                      </div>
                    </div>

                    {booking.notes && (
                      <div className="border-t border-dark-gray pt-3">
                        <p className="text-sm text-gray-400 mb-1">Notes</p>
                        <p className="text-gray-300">{booking.notes}</p>
                      </div>
                    )}

                    <div className="border-t border-dark-gray pt-3 flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-primary">
                          {formatPrice(booking.price)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Réservé le{" "}
                          {new Date(booking.createdAt).toLocaleString("fr-FR")}
                        </p>
                      </div>
                      
                      {booking.status === "CONFIRMED" && booking.customerNotified && !booking.tripStarted && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={async () => {
                            try {
                              await fetch(`/api/admin/bookings/${booking.id}/start-trip`, {
                                method: "POST",
                              });
                              fetchBookings();
                            } catch (e) {
                              console.error("Error starting trip:", e);
                            }

                            const wazeUrl = `https://waze.com/ul?ll=${booking.destinationLat},${booking.destinationLng}&navigate=yes`;
                            window.open(wazeUrl, "_blank");
                          }}
                        >
                          <Navigation className="w-4 h-4 mr-2" />
                          Se rendre à la destination
                        </Button>
                      )}
                    </div>

                    {booking.status === "CONFIRMED" && booking.customerNotified && !booking.tripStarted && (
                      <div className="mt-3 p-2 bg-green-900/20 border border-green-700/30 rounded-lg text-green-400 text-xs flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        <span>Client informé - En route vers le point de départ</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {booking.status === "PENDING" && (
                    <div className="flex lg:flex-col gap-3">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() =>
                          updateBookingStatus(booking.id, "CONFIRMED")
                        }
                        className="flex-1 lg:flex-none"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Confirmer
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateBookingStatus(booking.id, "REJECTED")
                        }
                        className="flex-1 lg:flex-none bg-gray-700 border-gray-600 text-gray-400 hover:bg-gray-600 hover:border-gray-500"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  {booking.status === "CONFIRMED" && !booking.customerNotified && (
                    <div className="flex lg:flex-col gap-3">
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-1 lg:flex-none"
                        onClick={async () => {
                          try {
                            await fetch(`/api/admin/bookings/${booking.id}/notify-enroute`, {
                              method: "POST",
                            });
                            fetchBookings();
                          } catch (e) {
                            console.error("Error notifying customer:", e);
                          }

                          const wazeUrl = `https://waze.com/ul?ll=${booking.departureLat},${booking.departureLng}&navigate=yes`;
                          window.open(wazeUrl, "_blank");
                        }}
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        Se rendre chez le client
                      </Button>
                    </div>
                  )}

                  {booking.status === "CONFIRMED" && booking.tripStarted && (
                    <div className="flex lg:flex-col gap-3">
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-1 lg:flex-none"
                        onClick={() =>
                          updateBookingStatus(booking.id, "COMPLETED")
                        }
                      >
                        Course terminée
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
