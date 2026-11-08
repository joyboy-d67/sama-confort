export interface BookingFormData {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email?: string;
  departureAddress: string;
  destinationAddress: string;
  departureLat: number;
  departureLng: number;
  destinationLat: number;
  destinationLng: number;
  date: string;
  timeSlot: string;
  notes?: string;
  additionalServices: string[];
  isRecurring: boolean;
  recurrenceType?: "DAILY" | "WEEKLY" | "MONTHLY";
  recurrenceEndDate?: string;
  distance?: number;
  price?: number;
}

export interface Place {
  address: string;
  lat: number;
  lng: number;
  placeId?: string;
}

export interface TimeSlot {
  slot: string;
  isAvailable: boolean;
}

export interface AdditionalService {
  id: string;
  name: string;
  description?: string;
  price: number;
}

export interface PricingCalculation {
  distance: number;
  basePrice: number;
  servicesPrice: number;
  totalPrice: number;
}

export interface Booking {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email?: string;
  departureAddress: string;
  destinationAddress: string;
  departureLat: number;
  departureLng: number;
  destinationLat: number;
  destinationLng: number;
  driverNotified?: boolean;
  customerNotified?: boolean;
  tripStarted?: boolean;
  date: Date;
  timeSlot: string;
  distance: number;
  price: number;
  status: "PENDING" | "CONFIRMED" | "REJECTED" | "COMPLETED" | "CANCELLED";
  isRecurring: boolean;
  recurrenceType?: "DAILY" | "WEEKLY" | "MONTHLY";
  additionalServices?: AdditionalService[];
  notes?: string;
  createdAt: Date;
}
