"use client";

import dynamic from "next/dynamic";
import { Place } from "@/types";

const Map = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-dark-lighter text-gray-400">
      Chargement de la carte...
    </div>
  ),
});

interface MapComponentProps {
  departure: Place | null;
  destination: Place | null;
  departureTime?: string;
  height?: string | number;
  onRouteUpdate?: (info: { distance: number; duration: number }) => void;
}

export default function MapComponent({ departure, destination, departureTime, height, onRouteUpdate }: MapComponentProps) {
  return (
    <Map
      departure={departure}
      destination={destination}
      departureTime={departureTime}
      height={height}
      onRouteUpdate={onRouteUpdate}
    />
  );
}
