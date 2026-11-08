"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Place } from "@/types";

// Fix for default markers in Leaflet with Next.js/Webpack
const iconUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
const iconRetinaUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png";
const shadowUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

const defaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

interface MapProps {
  departure: Place | null;
  destination: Place | null;
  departureTime?: string; // Format: "HH:mm"
  /**
   * Height can be a CSS size string (e.g. '320px', '40vh') or a number (pixels).
   * Defaults to '320px'.
   */
  height?: string | number;
  onRouteUpdate?: (info: { distance: number; duration: number }) => void;
}

// Calculate traffic multiplier based on time of day
function getTrafficMultiplier(timeString?: string): number {
  if (!timeString) return 1.0;
  
  const [hours] = timeString.split(":").map(Number);
  
  // Rush hours (7-9h and 17-19h): +40% time
  if ((hours >= 7 && hours < 9) || (hours >= 17 && hours < 19)) {
    return 1.4;
  }
  // Mid-day traffic (12-14h): +20% time
  if (hours >= 12 && hours < 14) {
    return 1.2;
  }
  // Night (22h-6h): -10% time (less traffic)
  if (hours >= 22 || hours < 6) {
    return 0.9;
  }
  // Normal traffic
  return 1.0;
}

export default function Map({ departure, destination, departureTime, height = "320px", onRouteUpdate }: MapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const departureMarkerRef = useRef<L.Marker | null>(null);
  const destinationMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const routeInfoRef = useRef<L.Control | null>(null);

  // Default center (Strasbourg) - used before user selects departure/destination
  const defaultCenter: [number, number] = [48.5839, 7.7455];

  // Initialize map only once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    try {
      // Create map instance
      const map = L.map(containerRef.current, {
        center: defaultCenter,
        zoom: 11,
        scrollWheelZoom: true,
      });

      // Add tile layer (Apple Maps style - Clean & Light)
      // Using CartoDB Voyager which closely resembles Apple Maps standard view
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 20,
      }).addTo(map);

      mapRef.current = map;
      
      // Fix: Invalidate size after a short delay to ensure tiles load correctly
      // This solves the "grey area" issue when the map container resizes or initializes
      setTimeout(() => {
        map.invalidateSize();
      }, 100);

      console.log("Map initialized successfully");
    } catch (error) {
      console.error("Error initializing map:", error);
    }

    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update markers and polyline when departure/destination/time change
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers, polyline and info
    if (departureMarkerRef.current) {
      departureMarkerRef.current.remove();
      departureMarkerRef.current = null;
    }
    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.remove();
      destinationMarkerRef.current = null;
    }
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }
    if (routeInfoRef.current) {
      routeInfoRef.current.remove();
      routeInfoRef.current = null;
    }

    // Add departure marker
    if (departure) {
      departureMarkerRef.current = L.marker([departure.lat, departure.lng])
        .bindPopup(`Départ: ${departure.address}`)
        .addTo(mapRef.current);
    }

    // Add destination marker
    if (destination) {
      destinationMarkerRef.current = L.marker([destination.lat, destination.lng])
        .bindPopup(`Arrivée: ${destination.address}`)
        .addTo(mapRef.current);
    }

    // Fetch and add routing polyline if both points exist
    if (departure && destination) {
      // Fetch route from OSRM (Open Source Routing Machine)
      const fetchRoute = async () => {
        try {
          const response = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${departure.lng},${departure.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`
          );
          const data = await response.json();

          if (data.code === "Ok" && data.routes && data.routes[0]) {
            const route = data.routes[0];
            const coordinates = route.geometry.coordinates.map((coord: number[]) => [
              coord[1],
              coord[0],
            ]) as L.LatLngExpression[];

            // Calculate adjusted duration based on time of day
            const baseDuration = route.duration / 60; // in minutes
            const trafficMultiplier = getTrafficMultiplier(departureTime);
            const adjustedDuration = Math.round(baseDuration * trafficMultiplier);
            const routeDistanceKm = Math.round((route.distance / 1000) * 100) / 100; // two decimals

            // Create polyline with route coordinates
            // Apple Maps style: Blue, thicker line
            polylineRef.current = L.polyline(coordinates, {
              color: "#007AFF", // Apple Maps Blue
              weight: 6,
              opacity: 0.9,
              lineCap: "round",
              lineJoin: "round",
              className: "leaflet-animated-route",
            }).addTo(mapRef.current!);

            // Remove old route info control if exists
            if (routeInfoRef.current) {
              routeInfoRef.current.remove();
            }

            // Add route info control (top-right corner)
            // Styled to look like Apple Maps UI (Glassmorphism)
            const RouteInfo = L.Control.extend({
              onAdd: function () {
                const div = L.DomUtil.create("div", "route-info-control");
                div.innerHTML = `
                  <div style="
                    background: rgba(255, 255, 255, 0.9); 
                    color: #000; 
                    padding: 12px 16px; 
                    border-radius: 12px; 
                    font-size: 14px; 
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15); 
                    backdrop-filter: blur(20px);
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                  ">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                      <div style="background: #007AFF; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                      <strong style="font-size: 16px;">${adjustedDuration} min</strong>
                    </div>
                    <div style="color: #666; font-size: 13px; margin-left: 32px;">
                      ${routeDistanceKm} km · ${trafficMultiplier > 1 ? 'Trafic dense' : 'Trafic fluide'}
                    </div>
                  </div>
                `;
                return div;
              },
            });

            routeInfoRef.current = new RouteInfo({ position: "topright" });
            routeInfoRef.current.addTo(mapRef.current!);

            // Fit bounds to show the entire route
            const bounds = L.latLngBounds(coordinates);
            mapRef.current!.fitBounds(bounds, { padding: [50, 50] });
            // Notify parent about route distance and adjusted duration
            if (typeof onRouteUpdate === "function") {
              try {
                onRouteUpdate({ distance: routeDistanceKm, duration: adjustedDuration });
              } catch (err) {
                console.error("onRouteUpdate callback error:", err);
              }
            }

            console.log(`Route: ${routeDistanceKm} km, ${adjustedDuration} min (multiplier: ${trafficMultiplier})`);
          } else {
            // Fallback to straight line if routing fails
            console.warn("Routing failed, using straight line");
            polylineRef.current = L.polyline(
              [
                [departure.lat, departure.lng],
                [destination.lat, destination.lng],
              ],
              {
                color: "#007AFF", // Apple Blue
                weight: 4,
                opacity: 0.7,
                dashArray: "10 10",
                className: "leaflet-animated-route",
              }
            ).addTo(mapRef.current!);

            const bounds = L.latLngBounds(
              [departure.lat, departure.lng],
              [destination.lat, destination.lng]
            );
            mapRef.current!.fitBounds(bounds, { padding: [50, 50] });

            // Inform parent about fallback straight-line distance
            if (typeof onRouteUpdate === "function") {
              const R = 6371;
              const toRad = (deg: number) => (deg * Math.PI) / 180;
              const dLat = toRad(destination.lat - departure.lat);
              const dLng = toRad(destination.lng - departure.lng);
              const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(toRad(departure.lat)) * Math.cos(toRad(destination.lat)) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
              const straightKm = Math.round(R * c * 100) / 100;
              try {
                onRouteUpdate({ distance: straightKm, duration: 0 });
              } catch (err) {
                console.error("onRouteUpdate callback error:", err);
              }
            }
          }
        } catch (error) {
          console.error("Error fetching route:", error);
          // Fallback to straight line
          polylineRef.current = L.polyline(
            [
              [departure.lat, departure.lng],
              [destination.lat, destination.lng],
            ],
            {
              color: "#007AFF", // Apple Blue
              weight: 4,
              opacity: 0.7,
              dashArray: "10 10",
              className: "leaflet-animated-route",
            }
          ).addTo(mapRef.current!);

          const bounds = L.latLngBounds(
            [departure.lat, departure.lng],
            [destination.lat, destination.lng]
          );
          mapRef.current!.fitBounds(bounds, { padding: [50, 50] });
        }
      };

      fetchRoute();
    } else if (departure) {
      mapRef.current.setView([departure.lat, departure.lng], 13);
    } else if (destination) {
      mapRef.current.setView([destination.lat, destination.lng], 13);
    }
  }, [departure, destination, departureTime]);

  const cssHeight = typeof height === "number" ? `${height}px` : height;

  return (
    <>
      <style>{`
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
          border-radius: 12px !important;
          overflow: hidden !important;
          margin: 12px !important;
        }
        .leaflet-control-zoom a {
          background-color: rgba(255, 255, 255, 0.9) !important;
          color: #007AFF !important;
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(0,0,0,0.1) !important;
          width: 36px !important;
          height: 36px !important;
          line-height: 36px !important;
          font-size: 18px !important;
          font-weight: 500 !important;
          transition: background-color 0.2s;
        }
        .leaflet-control-zoom a:last-child {
          border-bottom: none !important;
        }
        .leaflet-control-zoom a:hover {
          background-color: #ffffff !important;
          color: #0056b3 !important;
        }
        .leaflet-control-zoom a.leaflet-disabled {
          background-color: rgba(255, 255, 255, 0.6) !important;
          color: #bbb !important;
        }
      `}</style>
      <div
        ref={containerRef}
        // Allow configurable height; fall back to a sensible default so the map
        // is visible even when parent containers don't have an explicit height.
        style={{ minHeight: cssHeight, height: cssHeight, width: "100%", borderRadius: "0.5rem" }}
        className="z-0"
      />
    </>
  );
}
