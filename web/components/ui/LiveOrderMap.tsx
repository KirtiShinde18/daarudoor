"use client";

import React, { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

interface Coordinates {
  latitude: number;
  longitude: number;
  heading?: number;
  timestamp?: string | Date;
}

interface LiveOrderMapProps {
  currentLocation?: Coordinates | null;
  customerLocation?: Coordinates | null;
  deliveryAddress?: any;
  deliveryPartnerName?: string;
  isLocationStale?: boolean;
  orderStatus?: string;
  height?: string;
}

export function LiveOrderMap({
  currentLocation,
  customerLocation,
  deliveryAddress,
  deliveryPartnerName,
  isLocationStale = false,
  orderStatus,
  height = "380px",
}: LiveOrderMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    // Dynamically import Leaflet on client side
    let isMounted = true;
    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      // Clean up previous map instance if any
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const defaultLat = currentLocation?.latitude || customerLocation?.latitude || 19.8762;
      const defaultLng = currentLocation?.longitude || customerLocation?.longitude || 75.3433;

      const map = L.map(mapContainerRef.current, {
        center: [defaultLat, defaultLng],
        zoom: 14,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      // Custom icon generators using SVG
      const deliveryBoyIcon = L.divIcon({
        className: "custom-delivery-marker",
        html: `
          <div style="background-color: #6A0409; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(106, 4, 9, 0.4); border: 2px solid #FFFFFF;">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
              <path d="M15 18H9"/>
              <circle cx="7" cy="18" r="2"/>
              <circle cx="17" cy="18" r="2"/>
              <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
            </svg>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const customerIcon = L.divIcon({
        className: "custom-customer-marker",
        html: `
          <div style="background-color: #22C55E; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(34, 197, 94, 0.4); border: 2px solid #FFFFFF;">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const boundsGroup: any[] = [];

      // Delivery Partner Marker
      if (currentLocation && currentLocation.latitude && currentLocation.longitude) {
        const marker = L.marker([currentLocation.latitude, currentLocation.longitude], {
          icon: deliveryBoyIcon,
        }).addTo(map);

        marker.bindPopup(`
          <div style="font-family: inherit; font-size: 13px;">
            <strong style="color: #6A0409;">${deliveryPartnerName || "Delivery Partner"}</strong><br/>
            <span>Status: ${orderStatus || "In Transit"}</span><br/>
            <small style="color: #6B7280;">GPS: ${currentLocation.latitude.toFixed(5)}, ${currentLocation.longitude.toFixed(5)}</small>
          </div>
        `);

        boundsGroup.push([currentLocation.latitude, currentLocation.longitude]);
      }

      // Customer Marker
      if (customerLocation && customerLocation.latitude && customerLocation.longitude) {
        const marker = L.marker([customerLocation.latitude, customerLocation.longitude], {
          icon: customerIcon,
        }).addTo(map);

        const addrText = typeof deliveryAddress === "object"
          ? `${deliveryAddress.fullName || ""}, ${deliveryAddress.city || ""}`
          : (deliveryAddress || "Customer Destination");

        marker.bindPopup(`
          <div style="font-family: inherit; font-size: 13px;">
            <strong style="color: #22C55E;">Delivery Destination</strong><br/>
            <span>${addrText}</span>
          </div>
        `);

        boundsGroup.push([customerLocation.latitude, customerLocation.longitude]);
      }

      // Draw polyline connecting delivery partner to destination if both are available
      if (
        currentLocation?.latitude &&
        currentLocation?.longitude &&
        customerLocation?.latitude &&
        customerLocation?.longitude
      ) {
        L.polyline(
          [
            [currentLocation.latitude, currentLocation.longitude],
            [customerLocation.latitude, customerLocation.longitude],
          ],
          {
            color: "#6A0409",
            weight: 4,
            opacity: 0.7,
            dashArray: "6, 8",
          }
        ).addTo(map);
      }

      // Fit bounds if multiple points exist
      if (boundsGroup.length > 1) {
        map.fitBounds(L.latLngBounds(boundsGroup), { padding: [40, 40] });
      } else if (boundsGroup.length === 1) {
        map.setView(boundsGroup[0], 15);
      }
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [currentLocation, customerLocation, deliveryAddress, deliveryPartnerName, orderStatus]);

  const hasGps = Boolean(currentLocation?.latitude || customerLocation?.latitude);

  return (
    <div className="relative rounded-xl overflow-hidden border border-border-main bg-surface shadow-sm">
      {/* Alert banner for stale location */}
      {isLocationStale && hasGps && (
        <div className="absolute top-3 left-3 right-3 z-[1000] bg-amber-50 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 px-3.5 py-2 rounded-lg text-xs font-medium flex items-center justify-between shadow-md backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Last GPS ping received &gt; 15 minutes ago. Location may be stale.</span>
          </div>
          {currentLocation?.timestamp && (
            <span className="text-[11px] opacity-80">
              {new Date(currentLocation.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
      )}

      {/* When no live GPS is present */}
      {!hasGps ? (
        <div 
          style={{ height }}
          className="flex flex-col items-center justify-center p-6 text-center bg-gray-50 dark:bg-gray-900 text-muted"
        >
          <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <h4 className="font-semibold text-text-main text-base mb-1">Live GPS Coordinates Pending</h4>
          <p className="text-sm max-w-sm text-muted">
            The delivery partner hasn&apos;t transmitted live coordinates yet or GPS tracking is not active for this order stage.
          </p>
          {deliveryAddress && (
            <div className="mt-4 p-3 bg-surface border border-border-main rounded-lg text-xs text-left max-w-md w-full">
              <span className="font-medium text-text-main block mb-1">Destination Address:</span>
              <span className="text-muted">
                {typeof deliveryAddress === "object"
                  ? `${deliveryAddress.fullName || ""} • ${deliveryAddress.houseNo || ""}, ${deliveryAddress.area || ""}, ${deliveryAddress.city || ""} (${deliveryAddress.pincode || ""})`
                  : deliveryAddress}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div ref={mapContainerRef} style={{ height, width: "100%" }} className="z-0" />
      )}
    </div>
  );
}
