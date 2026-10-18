import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, Navigation, Crosshair, CheckCircle2, Info } from 'lucide-react';

interface RemoteLocationPickerMapProps {
  initialLat: number;
  initialLng: number;
  initialAddress: string;
  onSelectLocation: (loc: {
    lat: number;
    lng: number;
    address: string;
    city: string;
    state: string;
  }) => void;
  height?: string;
  pinColor?: 'amber' | 'emerald';
  label?: string;
}

const EAST_AFRICA_PRESETS = [
  {
    name: 'Mombasa Port (Gate 18)',
    city: 'Mombasa',
    state: 'Coast Region, Kenya',
    address: 'Kilindini Harbour, Container Terminal 2, Gate 18',
    lat: -4.0435,
    lng: 39.6682,
  },
  {
    name: 'Nairobi ICD Embakasi',
    city: 'Nairobi',
    state: 'Nairobi County, Kenya',
    address: 'Inland Container Depot (ICD) Embakasi, SGR Terminal Road',
    lat: -1.3328,
    lng: 36.8925,
  },
  {
    name: 'Naivasha Dry Port',
    city: 'Naivasha',
    state: 'Nakuru County, Kenya',
    address: 'Naivasha Special Economic Zone Inland Depot',
    lat: -0.7172,
    lng: 36.4310,
  },
  {
    name: 'Nakuru Agro Depot',
    city: 'Nakuru',
    state: 'Rift Valley, Kenya',
    address: 'Nakuru Industrial Area Railway Depot',
    lat: -0.3031,
    lng: 36.0800,
  },
  {
    name: 'Eldoret Grain Silos',
    city: 'Eldoret',
    state: 'Uasin Gishu, Kenya',
    address: 'Uganda Road NCPB Grain Hub, Eldoret',
    lat: 0.5143,
    lng: 35.2698,
  },
  {
    name: 'Malaba OSBP Border',
    city: 'Malaba',
    state: 'Busia / Tororo Border',
    address: 'Malaba One-Stop Border Post (OSBP) Freight Yard',
    lat: 0.6329,
    lng: 34.2750,
  },
  {
    name: 'Kampala Namanve Park',
    city: 'Kampala',
    state: 'Central Region, Uganda',
    address: 'Namanve Industrial Business Park, Jinja Road',
    lat: 0.3541,
    lng: 32.6983,
  },
  {
    name: 'Dar es Salaam Port',
    city: 'Dar es Salaam',
    state: 'Tanzania',
    address: 'Kurasini Commercial Port Gate 5, Bandari Road',
    lat: -6.8488,
    lng: 39.2949,
  },
  {
    name: 'Kigali Masaka Dry Port',
    city: 'Kigali',
    state: 'Rwanda',
    address: 'Masaka Inland Dry Port, Special Economic Zone',
    lat: -1.9706,
    lng: 30.2044,
  },
];

export const RemoteLocationPickerMap: React.FC<RemoteLocationPickerMapProps> = ({
  initialLat,
  initialLng,
  initialAddress,
  onSelectLocation,
  height = '280px',
  pinColor = 'amber',
  label = 'Pick-Up',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  const isAmber = pinColor === 'amber';
  const pinHex = isAmber ? '#f59e0b' : '#10b981';
  const pinRgb = isAmber ? '245, 158, 11' : '16, 185, 129';

  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({
    lat: initialLat,
    lng: initialLng,
  });
  const [addressPreview, setAddressPreview] = useState(initialAddress);
  const [isGeocoding, setIsGeocoding] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Initialize Map centered on initial coordinates
    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 12,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    mapInstanceRef.current = map;

    // Custom Draggable Pin
    const pickupIcon = L.divIcon({
      className: 'custom-picker-pin',
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px;">
          <div style="position: absolute; width: 100%; height: 100%; border-radius: 9999px; background-color: rgba(${pinRgb}, 0.3); animation: pulse-ring 2s infinite;"></div>
          <div style="width: 32px; height: 32px; border-radius: 9999px; background-color: ${pinHex}; border: 3px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#020617" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    const marker = L.marker([initialLat, initialLng], {
      icon: pickupIcon,
      draggable: true,
    }).addTo(map);

    // 500m geofence radius visual circle around pinned location
    const geofenceCircle = L.circle([initialLat, initialLng], {
      radius: 500,
      color: pinHex,
      fillColor: pinHex,
      fillOpacity: 0.15,
      weight: 2,
      dashArray: '4, 6',
    }).addTo(map);

    markerRef.current = marker;
    circleRef.current = geofenceCircle;

    const handleNewLocation = (lat: number, lng: number) => {
      const roundedLat = Number(lat.toFixed(5));
      const roundedLng = Number(lng.toFixed(5));
      setCurrentCoords({ lat: roundedLat, lng: roundedLng });

      marker.setLatLng([lat, lng]);
      geofenceCircle.setLatLng([lat, lng]);

      // Check if near any East Africa preset
      let matchedPreset = EAST_AFRICA_PRESETS.find(
        (p) => Math.abs(p.lat - lat) < 0.05 && Math.abs(p.lng - lng) < 0.05
      );

      if (matchedPreset) {
        const generatedAddress = matchedPreset.address;
        const city = matchedPreset.city;
        const state = matchedPreset.state;
        setAddressPreview(generatedAddress);
        onSelectLocation({
          lat: roundedLat,
          lng: roundedLng,
          address: generatedAddress,
          city,
          state,
        });
      } else {
        // Reverse geocode from Nominatim (OpenStreetMap) for real address
        const fallbackAddress = `Pinned ${label} Location (${roundedLat > 0 ? '+' : ''}${roundedLat}°, ${roundedLng > 0 ? '+' : ''}${roundedLng}°)`;
        setAddressPreview('Looking up address...');
        setIsGeocoding(true);
        fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${roundedLat}&lon=${roundedLng}&zoom=18&addressdetails=1`,
          { headers: { 'Accept-Language': 'en' } }
        )
          .then((res) => res.json())
          .then((data: { display_name?: string; address?: { road?: string; neighbourhood?: string; suburb?: string; city?: string; town?: string; village?: string; county?: string; state?: string; region?: string; country?: string } }) => {
            const addr = data.address || {};
            const road = addr.road || addr.neighbourhood || addr.suburb || '';
            const cityPart = addr.city || addr.town || addr.village || 'Remote Location';
            const statePart = addr.state || addr.county || addr.region || addr.country || 'East Africa';
            const fullAddress = data.display_name || `${road}, ${cityPart}, ${statePart}`.replace(/^, /, '').replace(/, $/, '');

            setAddressPreview(fullAddress);
            onSelectLocation({
              lat: roundedLat,
              lng: roundedLng,
              address: fullAddress,
              city: cityPart,
              state: statePart,
            });
          })
          .catch(() => {
            setAddressPreview(fallbackAddress);
            onSelectLocation({
              lat: roundedLat,
              lng: roundedLng,
              address: fallbackAddress,
              city: 'Remote Location',
              state: 'East Africa',
            });
          })
          .finally(() => setIsGeocoding(false));
      }
    };

    // Click anywhere on map to reposition pin
    map.on('click', (e: L.LeafletMouseEvent) => {
      handleNewLocation(e.latlng.lat, e.latlng.lng);
    });

    // Drag marker event
    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      handleNewLocation(pos.lat, pos.lng);
    });

    // Cleanup
    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  const selectPreset = (preset: (typeof EAST_AFRICA_PRESETS)[0]) => {
    setCurrentCoords({ lat: preset.lat, lng: preset.lng });
    setAddressPreview(preset.address);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([preset.lat, preset.lng], 13, { duration: 1 });
    }
    if (markerRef.current) {
      markerRef.current.setLatLng([preset.lat, preset.lng]);
    }
    if (circleRef.current) {
      circleRef.current.setLatLng([preset.lat, preset.lng]);
    }

    onSelectLocation({
      lat: preset.lat,
      lng: preset.lng,
      address: preset.address,
      city: preset.city,
      state: preset.state,
    });
  };

  return (
    <div className="space-y-3">
      {/* Remote Pinning Notice */}
      <div className={`p-3 rounded-xl border flex items-start justify-between gap-3 text-xs ${isAmber ? 'bg-amber-500/10 border-amber-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
        <div className={`flex items-start gap-2 ${isAmber ? 'text-amber-200' : 'text-emerald-200'}`}>
          <MapPin className="w-4 h-4 shrink-0 mt-0.5" style={{ color: pinHex }} />
          <div>
            <strong className="text-white block font-semibold">
              Remote {label} Geopinning (No physical presence required)
            </strong>
            <span className="text-slate-300">
              Click anywhere on the map or drag the pin to set the exact {label.toLowerCase()} coordinates.
              The driver's diesel payment release is strictly geofenced to this location.
            </span>
          </div>
        </div>
        <span className={`shrink-0 font-mono text-[11px] bg-slate-900 border font-bold px-2 py-1 rounded-lg`}
          style={{ borderColor: `${pinHex}66`, color: pinHex }}>
          500m Geofence
        </span>
      </div>

      {/* Preset Quick Buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        <span className="text-[11px] uppercase font-bold text-slate-400 shrink-0 flex items-center gap-1">
          <Crosshair className="w-3 h-3 text-amber-400" />
          Hubs:
        </span>
        {EAST_AFRICA_PRESETS.slice(0, 6).map((preset) => {
          const isSelected =
            Math.abs(preset.lat - currentCoords.lat) < 0.001 &&
            Math.abs(preset.lng - currentCoords.lng) < 0.001;

          return (
            <button
              key={preset.name}
              type="button"
              onClick={() => selectPreset(preset)}
              className={`shrink-0 px-2.5 py-1 rounded-lg font-medium transition text-[11px] ${
                isSelected
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700'
              }`}
            >
              {preset.name}
            </button>
          );
        })}
      </div>

      {/* Interactive Leaflet Map Container */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-700 shadow-inner">
        <div ref={mapContainerRef} style={{ width: '100%', height }} className="z-10" />

        {/* Live Coordinates Overlay */}
        <div className="absolute bottom-2 left-2 z-20 bg-slate-950/90 backdrop-blur-md border border-slate-700 px-3 py-1.5 rounded-xl text-[11px] flex items-center gap-2 text-slate-300 shadow-lg">
          <Navigation className="w-3.5 h-3.5" style={{ color: pinHex }} />
          <span className="font-mono font-bold" style={{ color: pinHex }}>
            {currentCoords.lat.toFixed(5)}°, {currentCoords.lng.toFixed(5)}°
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-emerald-400 font-medium truncate max-w-[200px]">
            {isGeocoding ? 'Looking up address...' : addressPreview}
          </span>
        </div>
      </div>
    </div>
  );
};
