import React, { useRef, useState, useMemo } from 'react';
import { Truck, Package, MapPin, Star, Navigation, Weight, Clock, ArrowRight, ArrowLeft, Loader2, Truck as TruckIcon, Upload, IdCard, CheckCircle2, X, Crosshair, ShieldCheck, Calendar, AlertTriangle } from 'lucide-react';
import { Trip, Trucker } from '../types/logistics';
import { CurrencyConfig } from '../types/settings';
import { calculateDistanceKm, formatCurrency } from '../services/routing';
import { UserProfile } from '../types/auth';
import { useLiveLocation } from '../hooks/useLiveLocation';
import { supabase } from '../services/supabaseClient';
import { uploadLicenseScan } from '../services/authService';

interface MarketplaceProps {
  profile: UserProfile;
  trips: Trip[];
  truckers: Trucker[];
  currency: CurrencyConfig;
  driverActiveTrips?: Trip[]; // Trips currently assigned to the driver (for conflict checking)
  onSelectTrip: (trip: Trip, licenseScanUrl?: string) => void;
  onSelectTrucker: (trucker: Trucker) => void;
  onCreateLoad: () => void;
  onBack: () => void;
}

export const Marketplace: React.FC<MarketplaceProps> = ({
  profile,
  trips,
  truckers,
  currency,
  driverActiveTrips = [],
  onSelectTrip,
  onSelectTrucker,
  onCreateLoad,
  onBack,
}) => {
  const [loadingItem, setLoadingItem] = useState<string | null>(null);
  const [licenseModalTrip, setLicenseModalTrip] = useState<Trip | null>(null);
  const { location: liveLocation, loading: locLoading } = useLiveLocation();
  const maxListings = profile.maxListings;

  // Use live location if available, otherwise fall back to profile defaults
  const homeLat = liveLocation?.lat ?? profile.homeLat ?? -4.0435;
  const homeLng = liveLocation?.lng ?? profile.homeLng ?? 39.6682;
  const homeLabel = liveLocation?.address || (profile.homeAddress) || `${homeLat.toFixed(4)}°, ${homeLng.toFixed(4)}°`;

  // Compute the driver's earliest available date — the dropoff date of their
  // latest in-progress trip. A new load is only acceptable if its scheduled
  // pickup is after this date.
  const driverBusyUntil = useMemo(() => {
    const inProgress = driverActiveTrips.filter(
      (t) => t.status === 'DISPATCHED' || t.status === 'AT_PICKUP' || t.status === 'IN_TRANSIT'
    );
    if (inProgress.length === 0) return null;
    const dropoffDates = inProgress
      .map((t) => {
        if (t.estimatedDropoffDate) return new Date(t.estimatedDropoffDate);
        if (t.pickupDate) {
          const d = new Date(t.pickupDate);
          d.setHours(d.getHours() + (t.estimatedDurationHours || 0));
          return d;
        }
        return null;
      })
      .filter((d): d is Date => !!d)
      .sort((a, b) => b.getTime() - a.getTime());
    return dropoffDates[0] || null;
  }, [driverActiveTrips]);

  // For drivers: show available loads (trips not yet assigned or in MATCHING status)
  const availableLoads = useMemo(() => {
    const loads = trips.filter(
      (t) => t.trucker === null || t.status === 'MATCHING' || t.trucker === undefined
    );
    const withDistance = loads.map((t) => {
      const pickup = t.pickupDate ? new Date(t.pickupDate) : null;
      const conflict = driverBusyUntil && pickup ? pickup.getTime() < driverBusyUntil.getTime() : false;
      return {
        trip: t,
        distanceKm: calculateDistanceKm(homeLat, homeLng, t.origin.lat, t.origin.lng),
        conflict,
      };
    });
    withDistance.sort((a, b) => a.distanceKm - b.distanceKm);
    return withDistance.slice(0, maxListings);
  }, [trips, homeLat, homeLng, maxListings, driverBusyUntil]);

  // For shippers: show available trucks sorted by distance from home
  const availableTrucks = useMemo(() => {
    const withDistance = truckers.map((t) => ({
      trucker: t,
      distanceKm: calculateDistanceKm(homeLat, homeLng, t.currentLocation.lat, t.currentLocation.lng),
    }));
    withDistance.sort((a, b) => a.distanceKm - b.distanceKm);
    return withDistance.slice(0, maxListings);
  }, [truckers, homeLat, homeLng, maxListings]);

  const handleSelectTrucker = (id: string, trucker: Trucker) => {
    setLoadingItem(id);
    setTimeout(() => {
      setLoadingItem(null);
      onSelectTrucker(trucker);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl my-8">
        {/* Back button */}
        <button
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl border mb-3 ${profile.role === 'shipper' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
            {profile.role === 'shipper' ? <Package className="w-7 h-7 text-amber-400" /> : <TruckIcon className="w-7 h-7 text-emerald-400" />}
          </div>
          <h1 className="text-2xl font-black text-white">Available {profile.role === 'shipper' ? 'Trucks' : 'Loads'}</h1>
          <p className="text-slate-400 mt-1 text-sm">
            Sorted by distance from your location — showing the nearest {profile.role === 'shipper' ? availableTrucks.length : availableLoads.length} of max {maxListings}
          </p>
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Crosshair className={`w-4 h-4 ${locLoading ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`} />
            <span>{locLoading ? 'Detecting your location...' : `From: ${homeLabel}`}</span>
          </div>
          <div className="flex gap-2">
            {profile.role === 'shipper' && (
              <button
                onClick={onCreateLoad}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition flex items-center gap-2"
              >
                <Package className="w-4 h-4" /> Post a Load
              </button>
            )}
          </div>
        </div>

        {/* Lists */}
        {profile.role === 'shipper' ? (
          <div className="space-y-3">
            {availableTrucks.length === 0 && (
              <EmptyState message="No trucks available yet. Check back soon." />
            )}
            {availableTrucks.map(({ trucker, distanceKm }) => (
              <div
                key={trucker.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-amber-500/30 transition group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <img src={trucker.avatar} alt={trucker.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white truncate">{trucker.name}</h3>
                        {trucker.isOnline && <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />}
                      </div>
                      <p className="text-sm text-slate-400 truncate">{trucker.truckModel}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-amber-400" /> {trucker.rating}</span>
                        <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> {trucker.truckType.replace('_', ' ')}</span>
                        <span className="flex items-center gap-1"><Navigation className="w-3.5 h-3.5 text-amber-400" /> {distanceKm} km away</span>
                        <span className="flex items-center gap-1 font-semibold text-emerald-400">{formatCurrency(trucker.ratePerKm, currency)}/km</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSelectTrucker(trucker.id, trucker)}
                    disabled={loadingItem === trucker.id}
                    className="shrink-0 px-4 py-2 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-white font-semibold text-sm transition flex items-center gap-2"
                  >
                    {loadingItem === trucker.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Select <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {availableLoads.length === 0 && (
              <EmptyState message="No loads available yet. Check back soon." />
            )}
            {availableLoads.map(({ trip, distanceKm, conflict }) => (
              <div
                key={trip.id}
                className={`bg-slate-900 border rounded-2xl p-5 transition group ${conflict ? 'border-slate-800 opacity-60' : 'border-slate-800 hover:border-emerald-500/30'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-white truncate">{trip.cargo.title}</h3>
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-mono shrink-0">{trip.trackingNumber}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                      <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">{trip.origin.city}</span>
                      <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
                      <span className="truncate">{trip.destination.city}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><Weight className="w-3.5 h-3.5" /> {trip.cargo.weightTonnes} t</span>
                      <span className="flex items-center gap-1"><Navigation className="w-3.5 h-3.5 text-emerald-400" /> {distanceKm} km to pickup</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {trip.distanceKm} km haul</span>
                      <span className="flex items-center gap-1 font-semibold text-amber-400">{formatCurrency(trip.payments.totalFreightCost, currency)}</span>
                      {trip.pickupDate && (
                        <span className="flex items-center gap-1 text-sky-400">
                          <Calendar className="w-3.5 h-3.5" />
                          Pickup: {new Date(trip.pickupDate).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    {conflict && (
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-[11px] font-semibold">
                        <AlertTriangle className="w-3 h-3" />
                        Unavailable — conflicts with your current trip. Pickup must be after {driverBusyUntil && driverBusyUntil.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}.
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => !conflict && setLicenseModalTrip(trip)}
                    disabled={loadingItem === trip.id || conflict}
                    className="shrink-0 px-4 py-2 rounded-xl bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-white font-semibold text-sm transition flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-800 disabled:hover:text-white"
                  >
                    {loadingItem === trip.id ? <Loader2 className="w-4 h-4 animate-spin" /> : conflict ? <>Blocked</> : <>Accept <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Driver License Scan Modal */}
      {licenseModalTrip && (
        <LicenseScanModal
          trip={licenseModalTrip}
          profile={profile}
          onClose={() => setLicenseModalTrip(null)}
          onConfirm={(licenseScanUrl) => {
            const trip = licenseModalTrip;
            setLicenseModalTrip(null);
            setLoadingItem(trip.id);
            setTimeout(() => {
              setLoadingItem(null);
              onSelectTrip(trip, licenseScanUrl);
            }, 300);
          }}
        />
      )}
    </div>
  );
};

// --- Driver License Scan Modal ---

const LicenseScanModal: React.FC<{
  trip: Trip;
  profile: UserProfile;
  onClose: () => void;
  onConfirm: (licenseScanUrl: string) => void;
}> = ({ trip, profile, onClose, onConfirm }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      setError('License photo must be under 5MB.');
      return;
    }
    setFile(f);
    setError(null);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const handleConfirm = async () => {
    if (!file) {
      setError('Please scan or upload your driver license to accept this load.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id || profile.userId;

      const url = await uploadLicenseScan(userId, trip.id, file);
      if (!url) {
        setError('Could not upload license scan. Please try again.');
        setUploading(false);
        return;
      }

      // Save the scan URL to the trip
      await supabase.from('trips').update({ driver_license_scan_url: url }).eq('id', trip.id);

      setUploading(false);
      onConfirm(url);
    } catch {
      setError('Upload failed. Please try again.');
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-white">Accept Load</h2>
              <p className="text-xs text-slate-400">{trip.cargo.title} — {trip.trackingNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-sm text-emerald-200 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block">Scan your driver license to accept</strong>
              <span className="text-slate-300">By scanning your license, you accept full responsibility for this load and confirm you are legally authorized to transport it.</span>
            </div>
          </div>

          {/* License upload */}
          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />

          {preview ? (
            <div className="relative rounded-xl overflow-hidden border border-slate-700">
              <img src={preview} alt="License preview" className="w-full h-48 object-cover" />
              <button
                onClick={() => { setFile(null); setPreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-950/80 text-white hover:bg-red-500/80 transition"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/90 text-white text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> License scan ready
              </div>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-10 rounded-xl bg-slate-800/50 border-2 border-dashed border-slate-700 hover:border-emerald-500/50 transition flex flex-col items-center gap-2 text-slate-400 hover:text-white"
            >
              <Upload className="w-8 h-8" />
              <span className="text-sm font-medium">Tap to scan or upload your driver license</span>
              <span className="text-xs text-slate-500">Photo of your DL — max 5MB</span>
            </button>
          )}

          {/* Trip summary */}
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Route</span>
              <span className="text-white font-medium">{trip.origin.city} → {trip.destination.city}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Cargo</span>
              <span className="text-white font-medium">{trip.cargo.weightTonnes} tonnes</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Payment</span>
              <span className="text-amber-400 font-bold">{formatCurrency(trip.payments.totalFreightCost)}</span>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleConfirm}
            disabled={!file || uploading}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>Uploading... <Loader2 className="w-5 h-5 animate-spin" /></>
            ) : (
              <>Confirm & Accept Load <ArrowRight className="w-4 h-4" /></>
            )}
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-semibold text-sm transition flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Cancel & Back to Loads
          </button>
        </div>
      </div>
    </div>
  );
};

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
    <Package className="w-10 h-10 text-slate-600 mx-auto mb-3" />
    <p className="text-slate-400">{message}</p>
  </div>
);
