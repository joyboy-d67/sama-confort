"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { Place } from "@/types";

interface AddressAutocompleteProps {
  label?: string;
  placeholder: string;
  onPlaceSelect?: (place: Place) => void;
  onSelect?: (place: Place) => void; // Alias for onPlaceSelect
  required?: boolean;
  className?: string;
}

type NominatimResult = {
  place_id: number;
  osm_id?: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: Record<string, string>;
};

export default function AddressAutocomplete({
  label,
  placeholder,
  onPlaceSelect,
  onSelect,
  required = false,
  className,
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Array<NominatimResult & { formatted?: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showGeoPrompt, setShowGeoPrompt] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [isGeoLoading, setIsGeoLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  // Use onSelect if provided, otherwise fallback to onPlaceSelect
  const handlePlaceSelect = onSelect || onPlaceSelect;

  function formatAddress(item: NominatimResult) {
    const addr = item.address || {};
    const displayLower = item.display_name.toLowerCase();
    
    // Exception spécifique : Aéroport de Strasbourg à Entzheim (67960) uniquement
    if (displayLower.includes('aéroport') && displayLower.includes('strasbourg') && 
        (displayLower.includes('entzheim') || displayLower.includes('67960'))) {
      return 'Aéroport de Strasbourg';
    }
    
    // Pour toutes les autres adresses : format standard
    const road = addr.road || addr.pedestrian || addr.cycleway || addr.footway || "";
    const house = addr.house_number || addr.building || "";
    const postcode = addr.postcode || "";
    const country = addr.country || "";

    const first = [house, road].filter(Boolean).join(" ").trim();
    const second = [postcode, country].filter(Boolean).join(" ").trim();

    if (first && second) return `${first}, ${second}`;
    if (first) return first;
    return item.display_name;
  }

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length > 2) {
        setIsLoading(true);
        setGeoError(null);
        try {
          const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(
            query
          )}&countrycodes=fr&limit=6`;
          const res = await fetch(url, { headers: { "User-Agent": "Sama Confort - autocomplete" } });
          const data: NominatimResult[] = await res.json();
          const withFormatted = data.map((d) => ({ ...d, formatted: formatAddress(d) }));
          setResults(withFormatted);
          setShowDropdown(true);
        } catch (err) {
          console.error("Error fetching address:", err);
        } finally {
          setIsLoading(false);
        }
      } else {
        setResults([]);
        setShowDropdown(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setShowGeoPrompt(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (item: NominatimResult & { formatted?: string }) => {
    const formatted = item.formatted || formatAddress(item);
    setQuery(formatted);
    setShowDropdown(false);

    const place: Place = {
      address: formatted,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      placeId: (item.osm_id ?? item.place_id)?.toString(),
    };

    handlePlaceSelect?.(place);
  };

  async function handleUseMyLocation() {
    setGeoError(null);
    setShowGeoPrompt(false);
    if (!navigator.geolocation) {
      setGeoError("Géolocalisation non supportée par votre navigateur.");
      return;
    }

    setIsGeoLoading(true);
    try {
      await new Promise<void>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            (async () => {
              try {
                const url = `https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&lat=${latitude}&lon=${longitude}`;
                const res = await fetch(url, { headers: { "User-Agent": "Sama Confort - reverse" } });
                const data = await res.json();
                const formatted = data && data.address ? formatAddress({
                  place_id: data.place_id,
                  display_name: data.display_name,
                  lat: String(latitude),
                  lon: String(longitude),
                  address: data.address,
                } as NominatimResult) : `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

                setQuery(formatted);
                const place: Place = {
                  address: formatted,
                  lat: latitude,
                  lng: longitude,
                  placeId: data?.osm_id?.toString() ?? data?.place_id?.toString(),
                };
                handlePlaceSelect?.(place);
                resolve();
              } catch (err) {
                reject(err);
              }
            })();
          },
          (err) => {
            let msg = "Erreur lors de la géolocalisation.";
            if ((err as any).code === 1) msg = "Permission refusée pour la géolocalisation.";
            else if ((err as any).code === 2) msg = "Position introuvable.";
            else if ((err as any).code === 3) msg = "Délai d'attente dépassé.";
            setGeoError(msg);
            reject(err);
          },
          { enableHighAccuracy: true, timeout: 10000 }
        )
      );
    } catch (err) {
      console.error("Geolocation error", err);
    } finally {
      setIsGeoLoading(false);
    }
  }

  return (
    <div className={className || "w-full"} ref={wrapperRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
          {required && <span className="text-primary ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <div className="relative h-12">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            required={required}
            aria-label={label}
            className="w-full pl-12 pr-28 py-3 bg-dark-lighter border border-dark-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200"
            onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
          />

          <button
            type="button"
            title="Utiliser ma position"
            onClick={() => setShowGeoPrompt(true)}
            className="absolute right-12 top-1/2 -translate-y-1/2 text-xs bg-transparent border border-dark-gray text-gray-300 px-2 py-1 rounded-md hover:bg-dark-gray"
          >
            Ma position
          </button>

          {isLoading && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
          )}

          {isGeoLoading && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
          )}
        </div>

        {showGeoPrompt && (
          <div className="absolute right-0 mt-2 w-64 bg-dark-lighter border border-dark-gray rounded-md shadow-lg p-3 z-50">
            <p className="text-sm text-gray-300">Autoriser Sama Confort à utiliser votre position actuelle ?</p>
            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={() => setShowGeoPrompt(false)}
                className="text-xs px-2 py-1 border border-dark-gray rounded-md text-gray-300 hover:bg-dark-gray"
              >
                Annuler
              </button>
              <button
                onClick={handleUseMyLocation}
                className="text-xs px-2 py-1 bg-primary rounded-md text-black font-medium"
              >
                Autoriser
              </button>
            </div>
          </div>
        )}

        {showDropdown && results.length > 0 && (
          <ul className="absolute z-50 w-full mt-1 bg-dark-lighter border border-dark-gray rounded-lg shadow-lg max-h-60 overflow-auto">
            {results.map((item) => (
              <li
                key={item.place_id}
                onClick={() => handleSelect(item)}
                className="px-4 py-3 hover:bg-dark-gray cursor-pointer text-sm text-gray-300 border-b border-dark-gray last:border-0"
              >
                {item.formatted}
              </li>
            ))}
          </ul>
        )}

        {geoError && <p className="mt-2 text-xs text-rose-400">{geoError}</p>}
      </div>
    </div>
  );
}
