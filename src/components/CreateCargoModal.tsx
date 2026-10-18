import React, { useState } from 'react';
import { X, Truck, MapPin, Package, Weight, ShieldCheck, Fuel, DollarSign, Check, ChevronRight, Snowflake, CircleAlert as AlertCircle, Star, Layers, ArrowRight, ArrowLeft, Clock, Timer, Navigation } from 'lucide-react';
import { Trucker, LocationPoint, Cargo, Trip } from '../types/logistics';
import { AppSettings, CurrencyConfig, SUPPORTED_CURRENCIES, getDieselPriceForCurrency } from '../types/settings';
import { TRUCK_TYPES, PRESET_LOCATIONS } from '../services/mockData';
import { 
  calculateDistanceKm,
  calculateDistanceMiles, 
  calculateTripPricing, 
  generateRoutePoints,
  formatCurrency,
  formatDieselPricePerLiter
} from '../services/routing';
import { RemoteLocationPickerMap } from './RemoteLocationPickerMap';

interface CreateCargoModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableTruckers: Trucker[];
  settings?: AppSettings;
  currency?: CurrencyConfig;
  onCreateTrip: (newTrip: Trip) => void;
}

export const CreateCargoModal: React.FC<CreateCargoModalProps> = ({
  isOpen,
  onClose,
  availableTruckers,
  settings,
  currency,
  onCreateTrip,
}) => {
  const activeCurrency = currency || settings?.currency || SUPPORTED_CURRENCIES[0];
  // Step in wizard (1: Cargo Specs, 2: Locations & Distance, 3: Truck Matching & Escrow Deposit)
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Cargo state - ALL METRIC
  const [cargoTitle, setCargoTitle] = useState('Industrial Switchgear & Renewable Equipment');
  const [category, setCategory] = useState<Cargo['category']>('Machinery & Equipment');
  const [weightKg, setWeightKg] = useState(7500); // Metric kilograms
  const [palletsCount, setPalletsCount] = useState(3);
  const [isFragile, setIsFragile] = useState(true);
  const [isColdChain, setIsColdChain] = useState(false);
  const [targetTempC, setTargetTempC] = useState(4); // Celsius
  const [cargoValueUsd, setCargoValueUsd] = useState(85000);
  const [description, setDescription] = useState('Critical industrial backup generator on heavy pallets. Secure strapping required.');

  // Location & Remote Pinning State
  // User Prompt Requirement: Goods owner can pin pick-up location on the map without being physically on location
  const [pinnedOriginLocation, setPinnedOriginLocation] = useState<LocationPoint>(PRESET_LOCATIONS[0]);
  const [selectedDestIdx, setSelectedDestIdx] = useState(1); // Nairobi ICD by default
  const [destCustom, setDestCustom] = useState(PRESET_LOCATIONS[1].address);

  // Guarantee Diesel Payment Conditions
  // 1. Geofence radius
  // 2. Agreed pickup time + auto-refund grace window (default 3 hours)
  const [agreedPickupTime, setAgreedPickupTime] = useState('10:00 AM');
  const [pickupDate, setPickupDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 16);
  });
  const [autoRefundHours, setAutoRefundHours] = useState(3);

  // Shipper-set total freight pay (empty string = use auto-calculated rate)
  const [customFreightInput, setCustomFreightInput] = useState<string>('');

  // Phase 1 Advance Loading Payment Configuration (fillable by goods owner & accepted by trucker)
  const [advanceMode, setAdvanceMode] = useState<'percentage' | 'fixed_amount'>('percentage');
  const [advancePercentInput, setAdvancePercentInput] = useState<number>(40);
  // Store custom input as a string in the user's active currency (can be empty string so user can clear it)
  const [advanceCustomInput, setAdvanceCustomInput] = useState<string>('');
  const [deductFirstDiesel, setDeductFirstDiesel] = useState<boolean>(true);

  // Selected Trucker
  const [selectedTruckerId, setSelectedTruckerId] = useState<string>('tr-1');

  if (!isOpen) return null;

  const originPoint: LocationPoint = pinnedOriginLocation;
  const destPoint: LocationPoint = PRESET_LOCATIONS[selectedDestIdx] || PRESET_LOCATIONS[1];

  // Metric Distance in Kilometers
  const distanceKm = calculateDistanceKm(
    originPoint.lat,
    originPoint.lng,
    destPoint.lat,
    destPoint.lng
  );

  // Filter compatible truckers based on cold-chain or weight requirements
  const compatibleTruckers = availableTruckers.filter((t) => {
    if (isColdChain && t.truckType !== 'refrigerated') return false;
    const typeInfo = TRUCK_TYPES.find((tt) => tt.id === t.truckType);
    const weightTonnes = weightKg / 1000;
    if (typeInfo && weightTonnes > (typeInfo.maxWeightTonnes || typeInfo.maxWeightTons || 25)) return false;
    return true;
  });

  // Selected trucker or fallback
  const chosenTrucker = 
    compatibleTruckers.find((t) => t.id === selectedTruckerId) || 
    compatibleTruckers[0] || 
    availableTruckers[0];

  const deadheadKm = chosenTrucker.distanceToPickupKm || Math.round((chosenTrucker.distanceToPickupMiles || 8) * 1.609);
  const deadheadMiles = Math.round(deadheadKm / 1.609);
  const distanceMiles = Math.round(distanceKm / 1.609);
  const truckerRatePerKm = chosenTrucker.ratePerKm || Number(((chosenTrucker.ratePerMile || 2.85) / 1.609).toFixed(2));

  const dieselPricePerLiterUsd = getDieselPriceForCurrency(activeCurrency.code);
  const pricing = calculateTripPricing(
    distanceKm,
    truckerRatePerKm,
    deadheadKm,
    chosenTrucker.truckType,
    isFragile,
    isColdChain,
    dieselPricePerLiterUsd
  );

  const currencyRate = activeCurrency.rateToUsd || 1.0;

  // If the shipper entered a custom freight pay, use it; otherwise use the auto-calculated rate.
  const parsedFreightLocal = parseFloat(customFreightInput);
  const customFreightUsd = !isNaN(parsedFreightLocal) && parsedFreightLocal > 0
    ? Math.round(parsedFreightLocal / currencyRate)
    : 0;
  const effectiveTotalFreight = customFreightUsd > 0 ? customFreightUsd : pricing.totalFreight;
  const totalFreightInCurrency = Math.round(effectiveTotalFreight * currencyRate);
  const firstDieselAmount = pricing.fuelDeposit;

  // Parse custom amount entered in active currency
  const parsedCustomLocal = parseFloat(advanceCustomInput);
  const customGrossUsd = !isNaN(parsedCustomLocal) && parsedCustomLocal > 0
    ? Math.min(effectiveTotalFreight, Math.round(parsedCustomLocal / currencyRate))
    : 0;

  const grossAdvanceAmount = advanceMode === 'percentage'
    ? Math.round(effectiveTotalFreight * (advancePercentInput / 100))
    : (customGrossUsd > 0 ? customGrossUsd : (advanceCustomInput === '' ? 0 : Math.round(effectiveTotalFreight * 0.4)));

  const netAdvanceAmount = Math.max(0, grossAdvanceAmount - (deductFirstDiesel ? firstDieselAmount : 0));
  const finalPaymentAmount = Math.max(0, effectiveTotalFreight - grossAdvanceAmount);
  const effectiveAdvancePercent = effectiveTotalFreight > 0 && grossAdvanceAmount > 0
    ? Math.round((grossAdvanceAmount / effectiveTotalFreight) * 100)
    : 0;

  const handleSwitchToPercentage = () => {
    setAdvanceMode('percentage');
    if (effectiveTotalFreight > 0 && customGrossUsd > 0) {
      const derivedPct = Math.min(90, Math.max(5, Math.round((customGrossUsd / effectiveTotalFreight) * 100)));
      setAdvancePercentInput(derivedPct);
    }
  };

  const handleSwitchToFixedAmount = () => {
    setAdvanceMode('fixed_amount');
    if (!advanceCustomInput || advanceCustomInput === '0') {
      const defaultLocal = Math.round(totalFreightInCurrency * (advancePercentInput / 100));
      setAdvanceCustomInput(String(defaultLocal));
    }
  };

  const handleCompleteBooking = () => {
    const routeWaypoints = generateRoutePoints(
      [originPoint.lat, originPoint.lng],
      [destPoint.lat, destPoint.lng],
      35
    );

    const newTripId = `TRIP-${Math.floor(1000 + Math.random() * 9000)}`;
    const trackingCode = `EAC-${Math.floor(10000 + Math.random() * 90000)}-AFR`;

    const pickupDateIso = pickupDate ? new Date(pickupDate).toISOString() : undefined;
    const dropoffDateIso = pickupDate
      ? new Date(new Date(pickupDate).getTime() + (Number((distanceKm / 70).toFixed(1)) * 3600 * 1000)).toISOString()
      : undefined;

    // Compute deadhead km
    const driverDistKm = calculateDistanceKm(
      chosenTrucker.currentLocation.lat,
      chosenTrucker.currentLocation.lng,
      originPoint.lat,
      originPoint.lng
    );

    const newTrip: Trip = {
      id: newTripId,
      trackingNumber: trackingCode,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      pickupDate: pickupDateIso,
      estimatedDropoffDate: dropoffDateIso,
      shipperId: 'user-shipper-01',
      shipperName: settings?.shipperProfile.legalName || 'East Africa Intermodal Freight',
      shipperPhone: settings?.shipperProfile.phone || '+254 712 345 678',
      cargo: {
        title: cargoTitle,
        category,
        weightKg,
        weightTonnes: Number((weightKg / 1000).toFixed(1)),
        weightLbs: Math.round(weightKg * 2.20462),
        weightTons: Number((weightKg / 1000).toFixed(1)),
        dimensions: { lengthM: 6.5, widthM: 2.4, heightM: 2.4, lengthFt: 21, widthFt: 8, heightFt: 8 },
        palletsCount,
        isFragile,
        temperatureControlled: isColdChain,
        targetTempC: isColdChain ? targetTempC : undefined,
        targetTempF: isColdChain ? Math.round((targetTempC * 9) / 5 + 32) : undefined,
        description,
        cargoValueUsd,
        photos: [
          'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80',
        ],
      },
      origin: originPoint,
      destination: destPoint,
      distanceKm,
      distanceMiles: Math.round(distanceKm / 1.609),
      estimatedDurationHours: Number((distanceKm / 70).toFixed(1)),
      trucker: chosenTrucker,
      status: 'DISPATCHED',
      escrow: {
        id: `ESCROW-VAULT-${Math.floor(100 + Math.random() * 900)}`,
        fuelAmountUsd: pricing.fuelDeposit,
        driverBondAmountUsd: pricing.fuelDeposit,
        driverBondStatus: 'LOCKED',
        totalEscrowLockedUsd: pricing.fuelDeposit * 2,
        deadheadDistanceKm: deadheadKm,
        deadheadDistanceMiles: Math.round(deadheadKm / 1.609),
        dieselPricePerLiter: pricing.dieselPricePerLiter,
        dieselPricePerGallon: pricing.dieselPricePerLiter * 3.785,
        estimatedLiters: pricing.fuelLiters,
        estimatedGallons: pricing.fuelGallons,
        status: 'HELD_IN_ESCROW',
        shipperApproved: false,
        truckerApproved: false,
        escrowContractHash: `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 8)}`,
        releaseTerms: `Dual-bond escrow: Goods owner deposits ${pricing.fuelDeposit} USD diesel guarantee and trucker deposits matching ${pricing.fuelDeposit} USD commitment bond. If driver cancels before pickup, escrow pool transfers to shipper. If shipper cancels before pickup, escrow pool transfers to driver. Releases upon GPS geofenced pickup arrival.`,
        dualSignOffCode: `SEC-${Math.floor(1000 + Math.random() * 9000)}-DIESEL`,
        // Geofence Condition
        geofenceRadiusMeters: 500,
        driverDistanceToPickupKm: driverDistKm,
        isDriverAtPickup: driverDistKm <= 0.5,
        // Auto-Refund Condition
        agreedPickupTime,
        autoRefundHours,
        autoRefundDeadline: '01:00 PM',
        autoRefundStatus: 'PENDING_ARRIVAL',
      },
      payments: {
        totalFreightCost: effectiveTotalFreight,
        fuelEscrowDeposit: pricing.fuelDeposit,
        driverBondDeposit: pricing.fuelDeposit,
        advancePayment: {
          amount: netAdvanceAmount,
          percentage: effectiveAdvancePercent,
          mode: advanceMode,
          grossAmount: grossAdvanceAmount,
          dieselDeducted: deductFirstDiesel ? firstDieselAmount : 0,
          deductDiesel: deductFirstDiesel,
          status: 'PENDING_ACCEPTANCE',
          proposedBy: 'shipper',
          acceptedByTrucker: false,
        },
        finalPayment: {
          amount: finalPaymentAmount,
          percentage: Math.max(0, 100 - effectiveAdvancePercent),
          status: 'PENDING_DELIVERY',
        },
      },
      milestones: [
        {
          key: 'REQUESTED',
          label: 'Trip Created & Truck Dispatched',
          description: `Assigned carrier ${chosenTrucker.name} (${chosenTrucker.truckModel}).`,
          timestamp: 'Just now',
          completed: true,
          current: false,
        },
        {
          key: 'FUEL_ESCROW_LOCKED',
          label: `Fuel Escrow Locked (${formatCurrency(pricing.fuelDeposit, activeCurrency)})`,
          description: `Shipper fuel deposit (~${pricing.fuelLiters} L) securely locked in dual-release custody.`,
          timestamp: 'Just now',
          completed: true,
          current: true,
        },
        {
          key: 'ARRIVED_AT_PICKUP',
          label: 'Carrier Arrival at Pickup Point',
          description: 'Trucker arrives at dock; awaiting mutual tap to release fuel escrow.',
          completed: false,
          current: false,
        },
        {
          key: 'ADVANCE_PAID_LOADED',
          label: `Cargo Loaded & Advance Payment (${formatCurrency(netAdvanceAmount, activeCurrency)})`,
          description: 'Bill of Lading verified and Phase 1 payment transferred to driver.',
          completed: false,
          current: false,
        },
        {
          key: 'IN_TRANSIT',
          label: `In Transit (${distanceKm} km)`,
          description: 'Shipment rolling on corridor highway with live telemetry.',
          completed: false,
          current: false,
        },
        {
          key: 'ARRIVED_DESTINATION',
          label: 'Arrival at Destination Facility',
          description: 'Arrived at receiver dock for cargo inspection.',
          completed: false,
          current: false,
        },
        {
          key: 'INSPECTED_POD_FINAL_PAID',
          label: `Proof of Delivery & Final Balance (${formatCurrency(finalPaymentAmount, activeCurrency)})`,
          description: 'Receiver signature and final payout release.',
          completed: false,
          current: false,
        },
      ],
      routeWaypoints,
      currentLocation: {
        lat: chosenTrucker.currentLocation.lat,
        lng: chosenTrucker.currentLocation.lng,
      },
      currentSpeedKmh: 65,
      currentSpeedMph: 40,
      progressPercent: 2,
      simulationActive: false,
      simulationSpeedMultiplier: 1,
      messages: [
        {
          id: `msg-${Date.now()}`,
          senderId: 'system',
          senderName: 'HaulFlow Escrow Protocol',
          senderRole: 'system',
          content: `Trip dispatched! Fuel security deposit of ${formatCurrency(pricing.fuelDeposit, activeCurrency)} (~${pricing.fuelLiters} L) locked in dual-release vault. Driver ${chosenTrucker.name} has been notified.`,
          timestamp: 'Just now',
        },
      ],
      cargoTelemetry: {
        temperatureC: isColdChain ? targetTempC : 22,
        temperatureF: isColdChain ? Math.round((targetTempC * 9) / 5 + 32) : 72,
        humidityPercent: 45,
        vibrationG: 0.04,
      },
    };

    onCreateTrip(newTrip);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Truck className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-white">Create Cargo Dispatch Request</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Match with nearby trucks, lock fuel escrow, and schedule 2-phase payments
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${
              step >= 1 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
            }`}>
              1
            </span>
            <span className={step === 1 ? 'font-bold text-white' : 'text-slate-400'}>
              Cargo Specs
            </span>
          </div>

          <div className="w-12 h-0.5 bg-slate-800" />

          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${
              step >= 2 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
            }`}>
              2
            </span>
            <span className={step === 2 ? 'font-bold text-white' : 'text-slate-400'}>
              Route & Freight Hubs
            </span>
          </div>

          <div className="w-12 h-0.5 bg-slate-800" />

          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${
              step >= 3 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
            }`}>
              3
            </span>
            <span className={step === 3 ? 'font-bold text-white' : 'text-slate-400'}>
              Trucker Match & Escrow
            </span>
          </div>
        </div>

        {/* Step 1: Cargo Specs */}
        {step === 1 && (
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                Cargo Item Description / Title
              </label>
              <input
                type="text"
                value={cargoTitle}
                onChange={(e) => setCargoTitle(e.target.value)}
                placeholder="e.g. 5-Axis CNC Machine, Palletized Auto Glass, Fresh Strawberries"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                  Cargo Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Machinery & Equipment">Machinery & Heavy Equipment</option>
                  <option value="General Freight">General Freight / Palletized Goods</option>
                  <option value="Perishable / Cold Chain">Perishable / Cold Chain (Reefer)</option>
                  <option value="Building Materials">Building Materials & Steel</option>
                  <option value="Electronics">Electronics & Precision Tech</option>
                  <option value="Automotive Parts">Automotive Parts</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                  Weight (Kilograms)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    step="500"
                    min="500"
                    max="45000"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-medium">
                    ~{(weightKg / 1000).toFixed(1)} Tonnes
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                  Standard Pallets
                </label>
                <input
                  type="number"
                  value={palletsCount}
                  onChange={(e) => setPalletsCount(Number(e.target.value))}
                  min="1"
                  max="30"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                  Declared Cargo Value (USD)
                </label>
                <input
                  type="number"
                  value={cargoValueUsd}
                  onChange={(e) => setCargoValueUsd(Number(e.target.value))}
                  step="5000"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                  Special Handling
                </label>
                <div className="flex items-center gap-4 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={isFragile}
                      onChange={(e) => setIsFragile(e.target.checked)}
                      className="rounded border-slate-700 text-amber-500 focus:ring-0"
                    />
                    <span>Fragile</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={isColdChain}
                      onChange={(e) => setIsColdChain(e.target.checked)}
                      className="rounded border-slate-700 text-amber-500 focus:ring-0"
                    />
                    <span>Reefer</span>
                  </label>
                </div>
              </div>
            </div>

            {isColdChain && (
              <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-blue-300">
                  <Snowflake className="w-4 h-4 text-blue-400" />
                  <span>Reefer temperature target:</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={targetTempC}
                    onChange={(e) => setTargetTempC(Number(e.target.value))}
                    className="w-20 bg-slate-900 border border-blue-500/50 rounded-lg px-2 py-1 text-xs text-white"
                  />
                  <span className="text-xs text-blue-300 font-bold">°C</span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                Driver Instructions & Notes
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        )}

        {/* Step 2: Locations, Remote Geopinning & Diesel Guarantee Conditions */}
        {step === 2 && (
          <div className="p-6 space-y-5">
            {/* Remote Geopinning Map for Goods Owner */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  <span>Pin Pick-up Depot on Map (Remote Geopinning)</span>
                </label>
                <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                  Zero Physical Presence Required
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Click anywhere on the East Africa map or choose a logistics corridor hub. The trucker’s diesel release will be strictly locked to this pinned location until arrival.
              </p>

              <RemoteLocationPickerMap
                initialLat={pinnedOriginLocation.lat}
                initialLng={pinnedOriginLocation.lng}
                initialAddress={pinnedOriginLocation.address}
                onSelectLocation={(loc) => {
                  setPinnedOriginLocation({
                    ...pinnedOriginLocation,
                    ...loc,
                    isRemotelyPinned: true,
                    pinnedCoordinatesText: `${loc.lat}°, ${loc.lng}°`,
                  });
                }}
                height="240px"
              />
            </div>

            {/* Destination Selection */}
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                Delivery Destination (East Africa Logistics Corridor)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                {PRESET_LOCATIONS.map((loc, idx) => (
                  <button
                    key={loc.address}
                    type="button"
                    onClick={() => {
                      setSelectedDestIdx(idx);
                      setDestCustom(loc.address);
                    }}
                    className={`text-left p-3 rounded-xl border text-xs transition ${
                      selectedDestIdx === idx
                        ? 'bg-amber-500/10 border-amber-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-white">{loc.city}, {loc.state}</div>
                    <div className="truncate text-slate-400 mt-0.5">{loc.address}</div>
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={destCustom}
                onChange={(e) => setDestCustom(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white"
                placeholder="Or specify custom dropoff address"
              />
            </div>

            {/* Guaranteed Diesel Payment Conditions Agreement */}
            <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase flex items-center gap-1.5">
                  <Fuel className="w-4 h-4 text-amber-400" />
                  Diesel Escrow Guarantee Conditions
                </span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded">
                  Dual-Protection
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                    Scheduled Pickup Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                    Agreed Pick-up Time Label
                  </label>
                  <input
                    type="text"
                    value={agreedPickupTime}
                    onChange={(e) => setAgreedPickupTime(e.target.value)}
                    placeholder="e.g. 10:00 AM"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                  Auto-Refund Grace Period
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 6].map((hrs) => (
                    <button
                      key={hrs}
                      type="button"
                      onClick={() => setAutoRefundHours(hrs)}
                      className={`flex-1 py-1 rounded-lg text-xs font-bold transition ${
                        autoRefundHours === hrs
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-700'
                      }`}
                    >
                      {hrs} hrs
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                <p>
                  🛡️ <strong>Auto-Refund Guarantee:</strong> If the truck is not at the pick-up point within <strong>{autoRefundHours} hours</strong> of <strong>{agreedPickupTime}</strong>, your diesel deposit will automatically return to your account.
                </p>
                <p>
                  📍 <strong>Geofence Protection:</strong> Payment release buttons will stay locked until the trucker’s GPS matches the pinned pick-up depot (within 500m).
                </p>
              </div>
            </div>

            {/* Calculated Distance Banner */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block">Corridor Freight Distance</span>
                <span className="text-xl font-black text-amber-400">
                  {distanceMiles} miles (~{Math.round(distanceMiles * 1.609)} km)
                </span>
                <span className="text-xs text-slate-400 ml-2">
                  (~{(distanceMiles / 50).toFixed(1)} hrs road transit)
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Pick-up → Delivery</span>
                <span className="text-xs font-semibold text-white">
                  {originPoint.city} → {destPoint.city}
                </span>
              </div>
            </div>

            {/* Freight Pay Input — shipper sets the total pay for this load/trip */}
            <div className="p-4 rounded-xl bg-gradient-to-b from-slate-950 to-slate-900 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  Total Freight Pay for this Load
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded">
                  Shipper-Set Rate
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Enter the total amount you'll pay the driver for this trip. Leave empty to use the auto-calculated rate based on distance and truck type.
              </p>
              <div className="flex items-center rounded-xl bg-slate-900 border border-slate-700 overflow-hidden focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition">
                <div className="px-3.5 py-2.5 bg-slate-800 text-sm font-bold text-emerald-400 border-r border-slate-700 select-none flex items-center">
                  {activeCurrency.symbol}
                </div>
                <input
                  type="number"
                  value={customFreightInput}
                  onChange={(e) => setCustomFreightInput(e.target.value)}
                  placeholder={`Auto: ${new Intl.NumberFormat('en-US').format(Math.round(pricing.totalFreight * currencyRate))} ${activeCurrency.code}`}
                  min="0"
                  className="flex-1 bg-transparent px-3 py-2.5 text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none"
                />
                <div className="px-3 py-2.5 bg-slate-800/60 text-xs font-mono font-semibold text-slate-400 border-l border-slate-700 select-none">
                  {activeCurrency.code}
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Auto-calculated: <strong className="text-slate-300 font-mono">{formatCurrency(pricing.totalFreight, activeCurrency)}</strong></span>
                <span>Effective total: <strong className="text-emerald-400 font-mono">{formatCurrency(effectiveTotalFreight, activeCurrency)}</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Truck Matching & Dual Escrow Deposit */}
        {step === 3 && (
          <div className="p-6 space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase text-slate-400">
                  Nearest Compatible Truckers ({compatibleTruckers.length} Available)
                </label>
                <span className="text-xs text-emerald-400 font-medium">GPS Dispatch Radar</span>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {compatibleTruckers.map((trucker) => (
                  <div
                    key={trucker.id}
                    onClick={() => setSelectedTruckerId(trucker.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                      chosenTrucker.id === trucker.id
                        ? 'bg-amber-500/10 border-amber-500'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={trucker.avatar}
                        alt={trucker.name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-700"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{trucker.name}</h4>
                          <span className="flex items-center gap-0.5 text-xs text-amber-400 font-semibold">
                            <Star className="w-3 h-3 fill-amber-400" />
                            {trucker.rating}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {trucker.truckModel} • <span className="text-emerald-400">{trucker.tripsCompleted} trips</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-white">
                        {trucker.distanceToPickupMiles || 8} mi away
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {formatCurrency(trucker.ratePerKm, activeCurrency)}/km
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Crucial Escrow & Payment Breakdown */}
            <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-950 to-slate-900 border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                  <div>
                    <h4 className="text-sm font-bold text-white">Security & Payment Escrow Terms</h4>
                    <p className="text-[11px] text-slate-400">
                      Mobilization fuel locked immediately; freight split into 2 verified phases
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Estimated</span>
                  <span className="text-lg font-black text-amber-400">{formatCurrency(effectiveTotalFreight + pricing.fuelDeposit, activeCurrency)}</span>
                </div>
              </div>

              {/* Specific Fuel Escrow Highlight */}
              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/40 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Fuel className="w-5 h-5 text-amber-400" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-amber-300">Fuel Security Deposit</span>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-mono">
                        Dual-Approval Vault
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Locked to guarantee trucker fuel for the {deadheadMiles}-mile run to your dock. Released ONLY when BOTH parties press approve upon arrival!
                    </p>
                  </div>
                </div>
                <span className="text-base font-black text-white ml-2">
                  {formatCurrency(pricing.fuelDeposit, activeCurrency)}
                </span>
              </div>

              {/* Phase 1 Advance Loading Payment - Fillable by Goods Owner */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-blue-500/30 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 uppercase">
                      Phase 1 Advance Loading Payment
                    </span>
                    <span className="text-[11px] text-slate-300 font-semibold">
                      Fillable by Goods Owner
                    </span>
                  </div>
                  <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-medium self-start sm:self-auto">
                    Requires Trucker Acceptance
                  </span>
                </div>

                {/* Calculation Mode Toggle: By Amount vs By Percentage */}
                <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={handleSwitchToPercentage}
                    className={`flex-1 py-1.5 rounded-md font-bold transition flex items-center justify-center gap-1 ${
                      advanceMode === 'percentage'
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>% By Percentage</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSwitchToFixedAmount}
                    className={`flex-1 py-1.5 rounded-md font-bold transition flex items-center justify-center gap-1 ${
                      advanceMode === 'fixed_amount'
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>{activeCurrency.symbol} By Exact Amount (Fixed Sum)</span>
                  </button>
                </div>

                {/* Mode Input Controls */}
                {advanceMode === 'percentage' ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Choose Advance Percentage:</span>
                      <span className="font-bold text-white font-mono">{advancePercentInput}% of freight ({formatCurrency(grossAdvanceAmount, activeCurrency)} gross)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {[20, 30, 40, 50].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setAdvancePercentInput(pct)}
                          className={`flex-1 py-1 rounded-lg text-xs font-bold transition ${
                            advancePercentInput === pct
                              ? 'bg-blue-500 text-white'
                              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                          }`}
                        >
                          {pct}%
                        </button>
                      ))}
                      <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg text-xs">
                        <input
                          type="number"
                          value={advancePercentInput}
                          onChange={(e) => setAdvancePercentInput(Math.min(90, Math.max(5, Number(e.target.value))))}
                          min="5"
                          max="90"
                          className="w-10 bg-transparent text-white font-bold text-center focus:outline-none"
                        />
                        <span className="text-slate-500">%</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-semibold text-slate-300 uppercase">
                        Enter Fixed Gross Advance Sum ({activeCurrency.code})
                      </label>
                      <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                        {advanceCustomInput ? `~${effectiveAdvancePercent}% of freight` : 'Fixed Cash Agreement'}
                      </span>
                    </div>

                    {/* Clean Input Group: Symbol Prefix Addon, Clearable Input, Currency Suffix */}
                    <div className="flex items-center rounded-xl bg-slate-900 border border-slate-700 overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition">
                      <div className="px-3.5 py-2 bg-slate-800 text-xs font-bold text-amber-400 border-r border-slate-700 select-none flex items-center">
                        {activeCurrency.symbol}
                      </div>
                      <input
                        type="number"
                        value={advanceCustomInput}
                        onChange={(e) => setAdvanceCustomInput(e.target.value)}
                        placeholder={`e.g. ${Math.round(totalFreightInCurrency * 0.4)}`}
                        min="0"
                        max={totalFreightInCurrency}
                        className="flex-1 bg-transparent px-3 py-2 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none"
                      />
                      <div className="px-3 py-2 bg-slate-800/60 text-[11px] font-mono font-semibold text-slate-400 border-l border-slate-700 select-none">
                        {activeCurrency.code}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Max Freight: <strong className="text-slate-300 font-mono">{formatCurrency(effectiveTotalFreight, activeCurrency)}</strong></span>
                      {advanceCustomInput && (
                        <span>Base Equiv: <strong className="text-emerald-400 font-mono">{formatCurrency(grossAdvanceAmount, activeCurrency)}</strong></span>
                      )}
                    </div>

                    {/* Quick amount presets in active currency */}
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">Presets:</span>
                      {[0.25, 0.35, 0.40, 0.50].map((ratio) => {
                        const presetLocal = Math.round(totalFreightInCurrency * ratio);
                        const isSelected = parsedCustomLocal === presetLocal;
                        return (
                          <button
                            key={ratio}
                            type="button"
                            onClick={() => setAdvanceCustomInput(String(presetLocal))}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono transition ${
                              isSelected
                                ? 'bg-blue-600 text-white font-bold'
                                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                            }`}
                          >
                            {activeCurrency.symbol}{new Intl.NumberFormat('en-US').format(presetLocal)} ({Math.round(ratio * 100)}%)
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Condition: Minus First Diesel Amount */}
                <div className="pt-2 border-t border-slate-800/80">
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={deductFirstDiesel}
                      onChange={(e) => setDeductFirstDiesel(e.target.checked)}
                      className="mt-0.5 rounded border-slate-700 text-blue-500 focus:ring-0"
                    />
                    <div>
                      <span className="font-semibold text-white">
                        Minus First Diesel Deposit ({formatCurrency(firstDieselAmount, activeCurrency)})
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Subtracts initial fuel deposit from Phase 1 advance so the driver's loading payment is net of mobilized diesel.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Net Advance & Final Balance Summary */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="p-2.5 rounded-lg bg-blue-950/30 border border-blue-500/30">
                    <span className="text-[10px] text-blue-400 font-bold uppercase block">
                      Phase 1: Net Loading Payout {advanceMode === 'fixed_amount' ? '(Fixed Sum)' : '(Percentage Mode)'}
                    </span>
                    <span className="text-base font-black text-white">
                      {formatCurrency(netAdvanceAmount, activeCurrency)}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {deductFirstDiesel 
                        ? `${formatCurrency(grossAdvanceAmount, activeCurrency)} gross minus ${formatCurrency(firstDieselAmount, activeCurrency)} diesel`
                        : `${formatCurrency(grossAdvanceAmount, activeCurrency)} full gross`}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30">
                    <span className="text-[10px] text-emerald-400 font-bold uppercase block">
                      Phase 2: Final Settlement {advanceMode === 'fixed_amount' ? '(Fixed Balance)' : ''}
                    </span>
                    <span className="text-base font-black text-white">
                      {formatCurrency(finalPaymentAmount, activeCurrency)}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {advanceMode === 'fixed_amount'
                        ? `Remaining balance upon delivery & signed POD (~${100 - effectiveAdvancePercent}%)`
                        : `Released upon delivery & signed POD (${100 - effectiveAdvancePercent}%)`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer Controls */}
        <div className="p-6 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                onClick={() => setStep((s) => (s - 1) as any)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-red-300 bg-slate-800 hover:bg-red-500/10 border border-slate-700 hover:border-red-500/30 transition"
            >
              Cancel
            </button>
          </div>

          {step < 3 ? (
            <button
              onClick={() => setStep((s) => (s + 1) as any)}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-450 text-slate-950 transition shadow-lg shadow-amber-500/20"
            >
              <span>Continue to {step === 1 ? 'Route' : 'Match & Escrow'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleCompleteBooking}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 transition shadow-xl shadow-amber-500/25 active:scale-[0.98]"
            >
              <Fuel className="w-4 h-4" />
              <span>Deposit {formatCurrency(pricing.fuelDeposit, activeCurrency)} Fuel Escrow & Dispatch</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
