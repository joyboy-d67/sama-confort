"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import clsx from "clsx";
import { generateTimeSlots, isDateInRange } from "@/lib/utils";

interface TimeSlotPickerProps {
  date: string;
  selectedSlot: string;
  onSlotSelect: (slot: string) => void;
  error?: string;
}

export default function TimeSlotPicker({
  date,
  selectedSlot,
  onSlotSelect,
  error,
}: TimeSlotPickerProps) {
  const [availableSlots, setAvailableSlots] = useState<{ slot: string; isAvailable: boolean }[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!date) {
      setAvailableSlots([]);
      return;
    }

    const selectedDate = new Date(date);
    if (!isDateInRange(selectedDate)) {
      setAvailableSlots([]);
      return;
    }

    // Fetch available slots from API
    const fetchSlots = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/timeslots?date=${date}`);
        if (response.ok) {
          const data = await response.json();
          setAvailableSlots(data.slots);
        } else {
          // Fallback: show all slots as available
          const allSlots = generateTimeSlots();
          setAvailableSlots(allSlots.map((slot) => ({ slot, isAvailable: true })));
        }
      } catch (error) {
        console.error("Error fetching time slots:", error);
        // Fallback: show all slots as available
        const allSlots = generateTimeSlots();
        setAvailableSlots(allSlots.map((slot) => ({ slot, isAvailable: true })));
      } finally {
        setIsLoading(false);
      }
    };

    fetchSlots();
  }, [date]);

  if (!date) {
    return (
      <div className="text-center text-gray-400 py-8 border border-dark-gray rounded-lg">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>Veuillez d'abord sélectionner une date</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center text-gray-400 py-8 border border-dark-gray rounded-lg">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2" />
        <p>Chargement des créneaux...</p>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-3">
        Heure
        <span className="text-primary ml-1">*</span>
      </label>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {availableSlots.map(({ slot, isAvailable }) => (
          <button
            key={slot}
            type="button"
            onClick={() => isAvailable && onSlotSelect(slot)}
            disabled={!isAvailable}
            className={clsx(
              "px-4 py-3 rounded-lg font-medium transition-all duration-200",
              "border-2 text-sm",
              selectedSlot === slot
                ? "border-primary bg-primary text-white"
                : isAvailable
                ? "border-dark-gray bg-dark-lighter text-white hover:border-primary hover:bg-dark-anthracite"
                : "border-dark-gray bg-dark-lighter text-gray-600 cursor-not-allowed opacity-50"
            )}
          >
            {slot.split("-")[0]}
          </button>
        ))}
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
