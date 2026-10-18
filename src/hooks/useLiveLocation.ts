import { useState, useEffect } from 'react';

interface GeoLocation {
  lat: number;
  lng: number;
  address?: string;
}

export function useLiveLocation() {
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported by your browser.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: Number(pos.coords.latitude.toFixed(5)),
          lng: Number(pos.coords.longitude.toFixed(5)),
        });
        setLoading(false);

        // Reverse geocode for a readable address
        fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&zoom=18&addressdetails=1`,
          { headers: { 'Accept-Language': 'en' } }
        )
          .then((res) => res.json())
          .then((data: { display_name?: string; address?: { city?: string; town?: string; village?: string; state?: string; country?: string } }) => {
            const addr = data.address || {};
            const cityPart = addr.city || addr.town || addr.village || '';
            const statePart = addr.state || addr.country || '';
            const fullAddress = data.display_name || `${cityPart}, ${statePart}`.replace(/^, |, $/g, '');
            setLocation((prev) => prev ? { ...prev, address: fullAddress } : prev);
          })
          .catch(() => {
            // Address lookup failed — coordinates are still valid
          });
      },
      (err) => {
        setError(err.message || 'Could not get your location.');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  return { location, error, loading };
}
