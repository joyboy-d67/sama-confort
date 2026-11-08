"use client";

import { useEffect } from "react";
import { CheckCircle, X } from "lucide-react";
import Button from "@/components/ui/Button";

interface BookingConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: {
    id: string;
    status: string;
    departureAddress: string;
    destinationAddress: string;
    date: string;
    timeSlot: string;
    price: number;
    firstName: string;
    lastName: string;
  };
}

export default function BookingConfirmationModal({
  isOpen,
  onClose,
  booking,
}: BookingConfirmationModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const statusColors = {
    PENDING: "bg-yellow-600",
    CONFIRMED: "bg-green-600",
    COMPLETED: "bg-blue-600",
    CANCELLED: "bg-red-600",
  };

  const statusLabels = {
    PENDING: "En attente de confirmation",
    CONFIRMED: "Confirmée",
    COMPLETED: "Terminée",
    CANCELLED: "Annulée",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70">
      <div className="relative w-full max-w-lg bg-dark-lighter rounded-2xl shadow-2xl border border-dark-gray animate-fade-in">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          aria-label="Fermer"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="p-6 border-b border-dark-gray">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-green-600/20 flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-green-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Réservation créée !</h2>
              <p className="text-sm text-gray-400">Un email de confirmation vous a été envoyé</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Booking number */}
          <div className="bg-dark rounded-lg p-4 border border-dark-gray">
            <p className="text-sm text-gray-400 mb-1">Numéro de réservation</p>
            <p className="text-lg font-mono font-bold text-primary">
              #{booking.id.slice(0, 8).toUpperCase()}
            </p>
          </div>

          {/* Status */}
          <div className="bg-dark rounded-lg p-4 border border-dark-gray">
            <p className="text-sm text-gray-400 mb-2">Statut</p>
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-white text-sm font-medium ${
                  statusColors[booking.status as keyof typeof statusColors] || "bg-gray-600"
                }`}
              >
                {statusLabels[booking.status as keyof typeof statusLabels] || booking.status}
              </span>
            </div>
            {booking.status === "PENDING" && (
              <p className="text-xs text-gray-500 mt-2">
                Votre réservation sera confirmée par un chauffeur sous peu
              </p>
            )}
          </div>

          {/* Trip details */}
          <div className="bg-dark rounded-lg p-4 border border-dark-gray space-y-3">
            <div>
              <p className="text-xs text-gray-500">Départ</p>
              <p className="text-sm text-white">{booking.departureAddress}</p>
            </div>
            <div className="h-px bg-dark-gray" />
            <div>
              <p className="text-xs text-gray-500">Arrivée</p>
              <p className="text-sm text-white">{booking.destinationAddress}</p>
            </div>
            <div className="h-px bg-dark-gray" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Date & Heure</p>
                <p className="text-sm text-white">
                  {new Date(booking.date).toLocaleDateString("fr-FR")}
                </p>
                <p className="text-sm text-white">{booking.timeSlot}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Prix</p>
                <p className="text-lg font-bold text-primary">{booking.price.toFixed(2)} €</p>
              </div>
            </div>
          </div>

          {/* Info message */}
          <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-4">
            <p className="text-sm text-blue-400">
              📱 Vous pouvez suivre l'état de votre réservation dans votre{" "}
              <a href="/profile" className="underline font-medium">
                espace client
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-dark-gray">
          <Button onClick={onClose} className="w-full" size="lg">
            J'ai compris
          </Button>
        </div>
      </div>
    </div>
  );
}
