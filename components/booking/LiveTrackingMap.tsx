"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface LiveTrackingMapProps {
  departureLat: number;
  departureLng: number;
  destinationLat?: number;
  destinationLng?: number;
  driverLat?: number;
  driverLng?: number;
  showDriver?: boolean;
}

// Custom icons
const createIcon = (color: string, icon: string) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        background-color: ${color};
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        font-size: 20px;
      ">
        ${icon}
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

export default function LiveTrackingMap({
  departureLat,
  departureLng,
  destinationLat,
  destinationLng,
  driverLat,
  driverLng,
  showDriver = false,
}: LiveTrackingMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const routeLineRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (!mapRef.current) {
      // Initialize map
      mapRef.current = L.map("live-tracking-map", {
        zoomControl: true,
      }).setView([departureLat, departureLng], 13);

      // Add tile layer
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '© OpenStreetMap contributors © CARTO',
        maxZoom: 19,
      }).addTo(mapRef.current);
    }

    return () => {
      // Cleanup map on unmount
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [departureLat, departureLng]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers and route
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    if (routeLineRef.current) {
      routeLineRef.current.remove();
      routeLineRef.current = null;
    }

    const bounds: L.LatLngExpression[] = [];

    // Add departure marker (green)
    const departureMarker = L.marker([departureLat, departureLng], {
      icon: createIcon('#10b981', '📍'),
    })
      .addTo(mapRef.current)
      .bindPopup('<b>Point de départ</b>');
    markersRef.current.push(departureMarker);
    bounds.push([departureLat, departureLng]);

    // Add destination marker (red) if provided
    if (destinationLat && destinationLng) {
      const destinationMarker = L.marker([destinationLat, destinationLng], {
        icon: createIcon('#ef4444', '🎯'),
      })
        .addTo(mapRef.current)
        .bindPopup('<b>Destination</b>');
      markersRef.current.push(destinationMarker);
      bounds.push([destinationLat, destinationLng]);
    }

    // Add driver marker (blue) if provided and should be shown
    if (showDriver && driverLat && driverLng) {
      const driverMarker = L.marker([driverLat, driverLng], {
        icon: createIcon('#3b82f6', '🚗'),
      })
        .addTo(mapRef.current)
        .bindPopup('<b>Chauffeur</b>');
      markersRef.current.push(driverMarker);
      bounds.push([driverLat, driverLng]);

      // Draw route from driver to departure
      fetchAndDrawRoute(driverLat, driverLng, departureLat, departureLng);
    } else if (destinationLat && destinationLng) {
      // Draw route from departure to destination
      fetchAndDrawRoute(departureLat, departureLng, destinationLat, destinationLng);
    }

    // Fit map to show all markers
    if (bounds.length > 0) {
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [departureLat, departureLng, destinationLat, destinationLng, driverLat, driverLng, showDriver]);

  const fetchAndDrawRoute = async (
    fromLat: number,
    fromLng: number,
    toLat: number,
    toLng: number
  ) => {
    if (!mapRef.current) return;

    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`
      );
      const data = await response.json();

      if (data.routes && data.routes[0]) {
        const coordinates = data.routes[0].geometry.coordinates.map(
          (coord: number[]) => [coord[1], coord[0]] as L.LatLngExpression
        );

        if (routeLineRef.current) {
          routeLineRef.current.remove();
        }

        routeLineRef.current = L.polyline(coordinates, {
          color: showDriver ? '#3b82f6' : '#8b5cf6',
          weight: 4,
          opacity: 0.7,
          dashArray: '10, 10',
        }).addTo(mapRef.current);
      }
    } catch (error) {
      console.error("Error fetching route:", error);
    }
  };

  return (
    <div
      id="live-tracking-map"
      style={{ width: "100%", height: "100%", minHeight: "400px", borderRadius: "0.5rem" }}
    />
  );
}
