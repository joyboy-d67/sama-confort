/**
 * Calculate the distance between two coordinates using Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate the price based on distance
 * - Under 10km: fixed 13€
 * - Above 10km: 1.35€ per km
 * - +5€ if departure or destination is Strasbourg Airport
 */
export function calculatePrice(
  distance: number,
  additionalServicesPrice: number = 0,
  departureAddress?: string,
  destinationAddress?: string
): number {
  let basePrice: number;

  if (distance < 10) {
    basePrice = 13;
  } else {
    basePrice = distance * 1.35;
  }

  // Supplément aéroport : +5€ si départ ou arrivée à l'aéroport de Strasbourg (Entzheim ou 67960)
  const checkAirport = (address?: string) => {
    if (!address) return false;
    const a = address.toLowerCase();
    return a.includes('aéroport') && a.includes('strasbourg') && (a.includes('entzheim') || a.includes('67960'));
  };
  const isDepartureAirport = checkAirport(departureAddress);
  const isDestinationAirport = checkAirport(destinationAddress);
  const isAirportTrip = isDepartureAirport || isDestinationAirport;
  const airportSurcharge = isAirportTrip ? 5 : 0;

  const totalPrice = basePrice + additionalServicesPrice + airportSurcharge;
  return Math.round(totalPrice * 100) / 100; // Round to 2 decimal places
}

/**
 * Generate time slots for a day (6:00 - 23:00)
 */
export function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let hour = 6; hour <= 22; hour++) {
    const startHour = hour.toString().padStart(2, '0');
    const endHour = (hour + 1).toString().padStart(2, '0');
    slots.push(`${startHour}:00-${endHour}:00`);
  }
  return slots;
}

/**
 * Check if a date is within the allowed booking range (up to 3 months)
 */
export function isDateInRange(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 3);
  maxDate.setHours(23, 59, 59, 999);

  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  return checkDate >= today && checkDate <= maxDate;
}

/**
 * Format a date to YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format price to display with currency
 */
export function formatPrice(price: number): string {
  return `${price.toFixed(2)} €`;
}
