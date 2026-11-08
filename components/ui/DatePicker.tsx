"use client";

import { useState, forwardRef } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import clsx from "clsx";

interface DatePickerProps {
  label?: string;
  value?: string;
  onChange?: (date: string) => void;
  error?: string;
  min?: string;
  max?: string;
  required?: boolean;
}

const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ label, value, onChange, error, min, max, required }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(
      value ? new Date(value) : new Date()
    );

    const minDate = min ? new Date(min) : new Date();
    const maxDate = max ? new Date(max) : new Date(new Date().setMonth(new Date().getMonth() + 3));

    const daysInMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0
    ).getDate();

    const firstDayOfMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    ).getDay();

    const monthNames = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];

    const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

    const handleDateClick = (day: number) => {
      const selectedDate = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day
      );
      
      // Check if date is within min/max range
      if (selectedDate < minDate || selectedDate > maxDate) return;

      const dateString = selectedDate.toISOString().split("T")[0];
      onChange?.(dateString);
      setIsOpen(false);
    };

    const goToPreviousMonth = () => {
      setCurrentMonth(
        new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
      );
    };

    const goToNextMonth = () => {
      setCurrentMonth(
        new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
      );
    };

    const isDateDisabled = (day: number) => {
      const date = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day
      );
      return date < minDate || date > maxDate;
    };

    const isDateSelected = (day: number) => {
      if (!value) return false;
      const selectedDate = new Date(value);
      return (
        selectedDate.getFullYear() === currentMonth.getFullYear() &&
        selectedDate.getMonth() === currentMonth.getMonth() &&
        selectedDate.getDate() === day
      );
    };

    const isToday = (day: number) => {
      const today = new Date();
      return (
        today.getFullYear() === currentMonth.getFullYear() &&
        today.getMonth() === currentMonth.getMonth() &&
        today.getDate() === day
      );
    };

    const formatDisplayDate = (dateString?: string) => {
      if (!dateString) return "Sélectionner une date";
      const date = new Date(dateString);
      return date.toLocaleDateString("fr-FR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    return (
      <div className="w-full relative">
        {label && (
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {label}
            {required && <span className="text-primary ml-1">*</span>}
          </label>
        )}

        {/* Hidden input for form compatibility */}
        <input
          ref={ref}
          type="hidden"
          value={value || ""}
          required={required}
        />

        {/* Display Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={clsx(
            "w-full px-4 py-3 bg-dark-lighter border rounded-lg text-left flex items-center justify-between",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
            "transition duration-200",
            error
              ? "border-red-500"
              : "border-dark-gray hover:border-dark-anthracite",
            value ? "text-white" : "text-gray-500"
          )}
        >
          <span className="capitalize">{formatDisplayDate(value)}</span>
          <Calendar className="w-5 h-5 text-gray-400" />
        </button>

        {/* Calendar Dropdown */}
        {isOpen && (
          <div className="absolute z-50 mt-2 w-full bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-4 animate-in fade-in zoom-in duration-200">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={goToPreviousMonth}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-400" />
              </button>
              <h3 className="text-lg font-semibold text-white">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h3>
              <button
                type="button"
                onClick={goToNextMonth}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Day Names */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-gray-500 py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for days before month starts */}
              {Array.from({ length: firstDayOfMonth }).map((_, index) => (
                <div key={`empty-${index}`} className="aspect-square" />
              ))}

              {/* Days of the month */}
              {Array.from({ length: daysInMonth }).map((_, index) => {
                const day = index + 1;
                const disabled = isDateDisabled(day);
                const selected = isDateSelected(day);
                const today = isToday(day);

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => !disabled && handleDateClick(day)}
                    disabled={disabled}
                    className={clsx(
                      "aspect-square rounded-lg text-sm font-medium transition-all duration-200",
                      "flex items-center justify-center",
                      disabled &&
                        "text-gray-700 cursor-not-allowed opacity-50",
                      !disabled && !selected &&
                        "text-gray-300 hover:bg-zinc-800 hover:text-white",
                      selected &&
                        "bg-primary text-white shadow-lg shadow-primary/30",
                      today && !selected && "ring-2 ring-primary ring-opacity-50",
                      !disabled && "hover:scale-105"
                    )}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Close button */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              Fermer
            </button>
          </div>
        )}

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
);

DatePicker.displayName = "DatePicker";

export default DatePicker;
