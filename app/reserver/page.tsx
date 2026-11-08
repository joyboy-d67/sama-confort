"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Car, MapPin, Calendar as CalendarIcon, Clock, Euro, ArrowLeft } from "lucide-react";
import { toast } from "react-hot-toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import DatePicker from "@/components/ui/DatePicker";
import Textarea from "@/components/ui/Textarea";
import Card from "@/components/ui/Card";
import MapComponent from "@/components/booking/MapComponent";
import AddressAutocomplete from "@/components/booking/AddressAutocomplete";
import TimeSlotPicker from "@/components/booking/TimeSlotPicker";
import BookingConfirmationModal from "@/components/booking/BookingConfirmationModal";
import Header from "@/components/Header";
import { BookingFormData, Place } from "@/types";
import { calculateDistance, calculatePrice, formatPrice } from "@/lib/utils";

const bookingSchema = z.object({
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  phoneNumber: z.string().regex(/^(\+33|0)[1-9](\d{2}){4}$/, "Numéro de téléphone invalide"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  date: z.string().min(1, "La date est requise"),
  timeSlot: z.string().min(1, "L'heure est requise"),
  notes: z.string().optional(),
  isRecurring: z.boolean(),
  recurrenceType: z.enum(["DAILY", "WEEKLY", "MONTHLY"]).optional(),
  recurrenceEndDate: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

export default function BookingPage() {
  const { data: session } = useSession();
  const [departure, setDeparture] = useState<Place | null>(null);
  const [destination, setDestination] = useState<Place | null>(null);
  const [distance, setDistance] = useState<number>(0);
  const [price, setPrice] = useState<number>(0);
  const [additionalServices, setAdditionalServices] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      isRecurring: false,
    },
  });

  const isRecurring = watch("isRecurring");

  // Pre-fill form with user data if logged in
  useEffect(() => {
    if (session?.user) {
      if (session.user.firstName) setValue("firstName", session.user.firstName);
      if (session.user.lastName) setValue("lastName", session.user.lastName);
      if (session.user.email) setValue("email", session.user.email);
      if (session.user.phoneNumber) setValue("phoneNumber", session.user.phoneNumber);
    }
  }, [session, setValue]);

  // Calculate distance and price when addresses change
  // We'll receive routed distance from the Map component (OSRM). As a fallback,
  // compute straight-line distance when route data is not available.
  useEffect(() => {
    if (!departure || !destination) return;

    // If route provided a distance already, skip fallback
    if (distance > 0) return;

    const dist = calculateDistance(
      departure.lat,
      departure.lng,
      destination.lat,
      destination.lng
    );
    setDistance(dist);
    const calculatedPrice = calculatePrice(dist, 0, departure.address, destination.address);
    setPrice(calculatedPrice);
  }, [departure, destination]);

  const handleRouteUpdate = useCallback(
    ({ distance: routedKm, duration: routedMinutes }: { distance: number; duration: number }) => {
      setDistance(routedKm);
      const calculatedPrice = calculatePrice(routedKm, 0, departure?.address, destination?.address);
      setPrice(calculatedPrice);
    },
    [departure, destination]
  );

  const onSubmit = async (data: BookingFormValues) => {
    if (!departure || !destination) {
      toast.error("Veuillez sélectionner les adresses de départ et d'arrivée");
      return;
    }

    setIsSubmitting(true);

    try {
      const bookingData: BookingFormData = {
        ...data,
        departureAddress: departure.address,
        destinationAddress: destination.address,
        departureLat: departure.lat,
        departureLng: departure.lng,
        destinationLat: destination.lat,
        destinationLng: destination.lng,
        additionalServices,
        distance,
        price,
      };

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors de la réservation");
      }

      const result = await response.json();
      
      // Fetch the complete booking details
      const bookingResponse = await fetch(`/api/bookings/${result.id}`);
      if (bookingResponse.ok) {
        const bookingData = await bookingResponse.json();
        setConfirmedBooking(bookingData.booking);
        setShowConfirmModal(true);
        toast.success("Réservation créée avec succès !");
      } else {
        // Fallback if fetch fails
        toast.success("Réservation créée ! Vérifiez votre profil pour les détails.");
      }
    } catch (error: any) {
      toast.error(error.message || "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark">
      <Header>
        <Link href="/">
          <Button variant="ghost">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </Link>
      </Header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Réserver un trajet</h1>
          <p className="text-xl text-gray-400 mb-12">
            Remplissez le formulaire ci-dessous pour réserver votre chauffeur VTC
          </p>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Left side - Form */}
            <div className="lg:col-span-3">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Personal Information */}
                <Card>
                  <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                    <MapPin className="w-6 h-6 text-primary" />
                    Informations personnelles
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      label="Prénom"
                      {...register("firstName")}
                      error={errors.firstName?.message}
                      placeholder="Jean"
                      required
                    />
                    <Input
                      label="Nom"
                      {...register("lastName")}
                      error={errors.lastName?.message}
                      placeholder="Dupont"
                      required
                    />
                    <Input
                      label="Téléphone"
                      type="tel"
                      {...register("phoneNumber")}
                      error={errors.phoneNumber?.message}
                      placeholder="+33 6 12 34 56 78"
                      required
                    />
                    <Input
                      label="Email"
                      type="email"
                      {...register("email")}
                      error={errors.email?.message}
                      placeholder="jean.dupont@email.com"
                    />
                  </div>
                </Card>

                {/* Trip Details */}
                <Card>
                  <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                    <MapPin className="w-6 h-6 text-primary" />
                    Détails du trajet
                  </h2>
                  <div className="space-y-4">
                    <AddressAutocomplete
                      label="Adresse de départ"
                      placeholder="Entrez l'adresse de départ"
                      onPlaceSelect={setDeparture}
                      required
                    />
                    <AddressAutocomplete
                      label="Adresse d'arrivée"
                      placeholder="Entrez l'adresse d'arrivée"
                      onPlaceSelect={setDestination}
                      required
                    />
                  </div>
                </Card>

                {/* Date and Time */}
                <Card>
                  <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                    <CalendarIcon className="w-6 h-6 text-primary" />
                    Date et heure
                  </h2>
                  <div className="space-y-4">
                    <DatePicker
                      label="Date"
                      value={watch("date")}
                      onChange={(date) => setValue("date", date)}
                      error={errors.date?.message}
                      min={new Date().toISOString().split("T")[0]}
                      max={
                        new Date(
                          new Date().setMonth(new Date().getMonth() + 3)
                        )
                          .toISOString()
                          .split("T")[0]
                      }
                      required
                    />
                    <TimeSlotPicker
                      date={watch("date")}
                      selectedSlot={watch("timeSlot")}
                      onSlotSelect={(slot) => setValue("timeSlot", slot)}
                      error={errors.timeSlot?.message}
                    />

                    {/* Recurring Booking */}
                    <div className="border-t border-dark-gray pt-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          {...register("isRecurring")}
                          className="w-5 h-5 rounded border-dark-gray bg-dark-lighter text-primary focus:ring-2 focus:ring-primary"
                        />
                        <span className="text-gray-300">Réservation récurrente</span>
                      </label>

                      {isRecurring && (
                        <div className="mt-4 space-y-4 pl-8">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Fréquence
                            </label>
                            <select
                              {...register("recurrenceType")}
                              className="w-full px-4 py-3 bg-dark-lighter border border-dark-gray rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                              <option value="">Sélectionner</option>
                              <option value="DAILY">Quotidien</option>
                              <option value="WEEKLY">Hebdomadaire</option>
                              <option value="MONTHLY">Mensuel</option>
                            </select>
                          </div>
                          <Input
                            label="Date de fin"
                            type="date"
                            {...register("recurrenceEndDate")}
                            min={watch("date")}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Additional Notes */}
                <Card>
                  <h2 className="text-2xl font-semibold mb-6">Notes additionnelles</h2>
                  <Textarea
                    {...register("notes")}
                    placeholder="Informations supplémentaires (facultatif)"
                    rows={4}
                  />
                </Card>

                <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting}>
                  Confirmer la réservation
                </Button>
              </form>
            </div>

            {/* Right side - Summary */}
            <div className="lg:col-span-2">
              <div className="sticky top-24">
                {/* Map */}
                  <div className="mb-6 rounded-lg overflow-hidden border border-dark-gray shadow-lg h-80">
                  <MapComponent
                    departure={departure}
                    destination={destination}
                    departureTime={watch("timeSlot")}
                    height="100%"
                    onRouteUpdate={handleRouteUpdate}
                  />
                </div>

                <Card variant="glass">
                  <h2 className="text-2xl font-semibold mb-6">Récapitulatif</h2>
                  
                  <div className="space-y-4 mb-6">
                    {departure && (
                      <div className="flex gap-3">
                        <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                        <div>
                          <p className="text-sm text-gray-400">Départ</p>
                          <p className="font-medium">{departure.address}</p>
                        </div>
                      </div>
                    )}
                    
                    {destination && (
                      <div className="flex gap-3">
                        <MapPin className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                        <div>
                          <p className="text-sm text-gray-400">Arrivée</p>
                          <p className="font-medium">{destination.address}</p>
                        </div>
                      </div>
                    )}

                    {distance > 0 && (
                      <div className="border-t border-dark-gray pt-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-400">Distance</span>
                          <span className="font-semibold">{distance.toFixed(2)} km</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Prix de base</span>
                          <span className="font-semibold">{formatPrice(price)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {departure && destination && (
                    <>
                      <div className="border-t border-dark-gray pt-4 mb-6">
                        <div className="flex justify-between items-center text-lg">
                          <span className="font-semibold flex items-center gap-2">
                            <Euro className="w-5 h-5 text-primary" />
                            Total
                          </span>
                          <span className="text-2xl font-bold text-primary">
                            {formatPrice(price)}
                          </span>
                        </div>
                      </div>

                      {/* header removed (page-level header is used) */}
                    </>
                  )}
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Confirmation Modal */}
      {confirmedBooking && (
        <BookingConfirmationModal
          isOpen={showConfirmModal}
          onClose={() => {
            setShowConfirmModal(false);
            setConfirmedBooking(null);
          }}
          booking={confirmedBooking}
        />
      )}
    </div>
  );
}
