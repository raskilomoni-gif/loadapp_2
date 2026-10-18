import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Navigation, 
  Gauge, 
  Clock, 
  MapPin, 
  Maximize2,
  Zap,
  Truck as TruckIcon,
  Crosshair
} from 'lucide-react';
import { LocationPoint, Trucker } from '../types/logistics';

interface TrackingMapProps {
  origin: LocationPoint;
  destination: LocationPoint;
  routeWaypoints: [number, number][];
  currentLocation: { lat: number; lng: number };
  currentSpeedMph?: number;
  currentSpeedKmh?: number;
  progressPercent: number;
  trucker: Trucker | null;
  tripStatus: string;
  isSimulating: boolean;
  onToggleSimulation: () => void;
  onResetSimulation: () => void;
  speedMultiplier: number;
  onChangeSpeedMultiplier: (mult: number) => void;
}

export const TrackingMap: React.FC<TrackingMapProps> = ({
  origin,
  destination,
  routeWaypoints,
  currentLocation,
  currentSpeedMph = 45,
  currentSpeedKmh,
  progressPercent,
  trucker,
  tripStatus,
  isSimulating,
  onToggleSimulation,
  onResetSimulation,
  speedMultiplier,
  onChangeSpeedMultiplier,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const truckMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const passedPolylineRef = useRef<L.Polyline | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center between origin and destination
    const centerLat = (origin.lat + destination.lat) / 2;
    const centerLng = (origin.lng + destination.lng) / 2;

    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: 7,
      zoomControl: false,
      attributionControl: false,
    });

    // Dark-themed tiles from CartoDB or standard OSM with CSS filter
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;

    // Origin Pickup Custom Icon
    const originIcon = L.divIcon({
      className: 'custom-origin-icon',
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
          <div style="position: absolute; width: 100%; height: 100%; border-radius: 9999px; background-color: rgba(16, 185, 129, 0.25); animation: pulse-ring 2s infinite;"></div>
          <div style="width: 30px; height: 30px; border-radius: 9999px; background-color: #059669; border: 2px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.4);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    // Destination Custom Icon
    const destIcon = L.divIcon({
      className: 'custom-dest-icon',
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
          <div style="width: 30px; height: 30px; border-radius: 9999px; background-color: #d97706; border: 2px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.4);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    // Add origin and destination markers
    const originMarker = L.marker([origin.lat, origin.lng], { icon: originIcon })
      .addTo(map)
      .bindPopup(`
        <div style="font-family: inherit; font-size: 12px; line-height: 1.4;">
          <strong style="color: #10b981; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em;">Pickup Origin</strong><br/>
          <strong style="font-size: 13px; color: #fff;">${origin.address}</strong><br/>
          <span style="color: #94a3b8;">${origin.city}, ${origin.state}</span>
        </div>
      `);

    const destMarker = L.marker([destination.lat, destination.lng], { icon: destIcon })
      .addTo(map)
      .bindPopup(`
        <div style="font-family: inherit; font-size: 12px; line-height: 1.4;">
          <strong style="color: #f59e0b; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em;">Final Delivery</strong><br/>
          <strong style="font-size: 13px; color: #fff;">${destination.address}</strong><br/>
          <span style="color: #94a3b8;">${destination.city}, ${destination.state}</span>
        </div>
      `);

    // Draw background Planned Route Polyline
    if (routeWaypoints.length > 0) {
      const plannedLine = L.polyline(routeWaypoints, {
        color: '#3b82f6',
        weight: 5,
        opacity: 0.75,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);
      routePolylineRef.current = plannedLine;

      // Fit map bounds to encompass the route
      map.fitBounds(plannedLine.getBounds(), { padding: [50, 50] });
    }

    // Custom Truck Live Marker
    const truckIcon = L.divIcon({
      className: 'custom-truck-marker',
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px;">
          <div style="position: absolute; width: 100%; height: 100%; border-radius: 9999px; background-color: rgba(245, 158, 11, 0.35); animation: pulse-ring 1.5s infinite;"></div>
          <div style="width: 36px; height: 36px; border-radius: 9999px; background-color: #0f172a; border: 2.5px solid #f59e0b; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.6);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
              <path d="M15 18H9"/>
              <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
              <circle cx="17" cy="18" r="2"/>
              <circle cx="7" cy="18" r="2"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    const truckMarker = L.marker([currentLocation.lat, currentLocation.lng], {
      icon: truckIcon,
      zIndexOffset: 1000,
    }).addTo(map);

    truckMarker.bindPopup(`
      <div style="font-family: inherit; font-size: 12px; line-height: 1.4;">
        <strong style="color: #f59e0b; font-size: 13px;">${trucker?.name || 'Carrier Truck'}</strong><br/>
        <span style="color: #94a3b8;">${trucker?.truckModel || 'Freight Transport'}</span><br/>
        <span style="color: #10b981; font-weight: 600;">Status: ${tripStatus}</span>
      </div>
    `);

    truckMarkerRef.current = truckMarker;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Truck marker position dynamically as simulation runs
  useEffect(() => {
    if (truckMarkerRef.current) {
      truckMarkerRef.current.setLatLng([currentLocation.lat, currentLocation.lng]);
    }
  }, [currentLocation]);

  // Recenter map on truck
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([currentLocation.lat, currentLocation.lng], 9, {
        animate: true,
      });
    }
  };

  // Zoom to fit entire route
  const handleFitRoute = () => {
    if (mapInstanceRef.current && routePolylineRef.current) {
      mapInstanceRef.current.fitBounds(routePolylineRef.current.getBounds(), {
        padding: [60, 60],
        animate: true,
      });
    }
  };

  return (
    <div className="relative w-full h-[460px] lg:h-[540px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
      {/* Leaflet DOM container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Floating HUD: Live Status & Telematics */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Left Telemetry pill */}
        <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700/80 shadow-lg pointer-events-auto">
          <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <Gauge className="w-3.5 h-3.5" />
            <span>{currentSpeedKmh !== undefined ? currentSpeedKmh : Math.round(currentSpeedMph * 1.609)} KM/H</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1 text-xs text-slate-300 font-medium">
            <Navigation className="w-3.5 h-3.5 text-blue-400" />
            <span>{progressPercent}% Complete</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>{currentLocation.lat.toFixed(3)}, {currentLocation.lng.toFixed(3)}</span>
          </div>
        </div>

        {/* Right Map View Controls */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/80 shadow-lg pointer-events-auto">
          <button
            onClick={handleRecenter}
            title="Focus on Truck"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            <Crosshair className="w-4 h-4" />
          </button>
          <button
            onClick={handleFitRoute}
            title="Fit Entire Route"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Floating Simulation Dock */}
      <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/95 backdrop-blur-md p-3 rounded-2xl border border-slate-700/80 shadow-2xl">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={onToggleSimulation}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg ${
              isSimulating
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
            }`}
          >
            {isSimulating ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause Live GPS</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Simulate Truck Drive</span>
              </>
            )}
          </button>

          <button
            onClick={onResetSimulation}
            title="Reset to Pickup Point"
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Speed multiplier selector */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-bold">
            {[1, 2, 5, 10].map((mult) => (
              <button
                key={mult}
                onClick={() => onChangeSpeedMultiplier(mult)}
                className={`px-2 py-1 rounded-lg transition ${
                  speedMultiplier === mult
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {mult}x
              </button>
            ))}
          </div>
        </div>

        {/* Progress bar and milestone status */}
        <div className="w-full sm:w-72 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 truncate max-w-[160px]">{origin.city} → {destination.city}</span>
            <span className="font-mono text-amber-400 font-bold">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
