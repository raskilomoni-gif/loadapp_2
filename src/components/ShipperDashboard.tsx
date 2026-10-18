import React, { useState } from 'react';
import { Truck, MapPin, Package, ShieldCheck, Fuel, DollarSign, Clock, Calendar, MessageSquare, Phone, Star, CircleCheck as CheckCircle2, CircleAlert as AlertCircle, Thermometer, Activity, Droplets, Share2, ChevronRight, ChevronDown, Plus, Award, ThumbsUp, Settings, Landmark, Receipt, Building2, RotateCcw } from 'lucide-react';
import { Trip, Trucker, LocationPoint } from '../types/logistics';
import { AppSettings, CurrencyConfig } from '../types/settings';
import { DualEscrowCard } from './DualEscrowCard';
import { PaymentPlanCard } from './PaymentPlanCard';
import { TrackingMap } from './TrackingMap';
import { TripReviewsCard } from './TripReviewsCard';
import { RemoteLocationPickerMap } from './RemoteLocationPickerMap';
import { MOCK_SHIPPER_PROFILE } from '../services/mockData';
import { formatCurrency } from '../services/routing';

interface ShipperDashboardProps {
  activeTrip: Trip;
  allTrips: Trip[];
  settings?: AppSettings;
  currency?: CurrencyConfig;
  onOpenSettings?: () => void;
  onSelectTrip: (trip: Trip) => void;
  onOpenCreateModal: () => void;
  onOpenChat: () => void;
  onOpenPODModal: () => void;
  onOpenReviewModal: () => void;
  onShipperApproveEscrow: () => void;
  onTruckerApproveEscrow: () => void;
  onReleaseAdvance: () => void;
  onReleaseFinal: () => void;
  onUpdateAdvanceTerms?: (terms: {
    mode: 'percentage' | 'fixed_amount';
    grossAmount: number;
    netAmount: number;
    percentage: number;
    deductDiesel: boolean;
    dieselDeducted: number;
  }) => void;
  onTruckerAcceptAdvance?: () => void;
  onTriggerAutoRefund?: () => void;
  onToggleDriverAtPickup?: () => void;
  onUpdateAutoRefundHours?: (hours: number) => void;
  onResetEscrow?: () => void;
  onOpenCancelModal?: () => void;
  onRepinPickup?: (origin: LocationPoint) => void;
  onRepinDelivery?: (destination: LocationPoint) => void;
  // Simulation props
  isSimulating: boolean;
  onToggleSimulation: () => void;
  onResetSimulation: () => void;
  speedMultiplier: number;
  onChangeSpeedMultiplier: (mult: number) => void;
}

export const ShipperDashboard: React.FC<ShipperDashboardProps> = ({
  activeTrip,
  allTrips,
  settings,
  currency,
  onOpenSettings,
  onSelectTrip,
  onOpenCreateModal,
  onOpenChat,
  onOpenPODModal,
  onOpenReviewModal,
  onShipperApproveEscrow,
  onTruckerApproveEscrow,
  onReleaseAdvance,
  onReleaseFinal,
  onUpdateAdvanceTerms,
  onTruckerAcceptAdvance,
  onTriggerAutoRefund,
  onToggleDriverAtPickup,
  onUpdateAutoRefundHours,
  onResetEscrow,
  onOpenCancelModal,
  onRepinPickup,
  onRepinDelivery,
  isSimulating,
  onToggleSimulation,
  onResetSimulation,
  speedMultiplier,
  onChangeSpeedMultiplier,
}) => {
  const [showDriverReviews, setShowDriverReviews] = useState(false);
  const [showShipperReputation, setShowShipperReputation] = useState(false);
  const [showRepinMap, setShowRepinMap] = useState(false);
  const [showRepinDeliveryMap, setShowRepinDeliveryMap] = useState(false);
  const trucker = activeTrip.trucker;
  const isTripCompleted = activeTrip.status === 'COMPLETED' || activeTrip.status === 'DELIVERED';

  return (
    <div className="space-y-6">
      {/* Top Banner: Active Shipments Bar & New Request CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-lg font-bold text-white">Active Cargo Dispatch</h1>
            <span className="text-xs bg-slate-800 text-amber-400 font-mono px-2.5 py-0.5 rounded-md border border-slate-700">
              {activeTrip.trackingNumber}
            </span>
            {isTripCompleted && (
              <span className="text-xs bg-emerald-950 text-emerald-400 font-bold px-2.5 py-0.5 rounded-md border border-emerald-500/40">
                DELIVERED & SETTLED
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {activeTrip.origin.city}, {activeTrip.origin.state} → {activeTrip.destination.city}, {activeTrip.destination.state} ({activeTrip.distanceMiles} miles)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {allTrips.length > 1 && (
            <select
              value={activeTrip.id}
              onChange={(e) => {
                const found = allTrips.find((t) => t.id === e.target.value);
                if (found) onSelectTrip(found);
              }}
              className="bg-slate-950 border border-slate-700 text-xs rounded-xl px-3 py-2 text-white"
            >
              {allTrips.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.id} - {t.cargo.title.substring(0, 20)}...
                </option>
              ))}
            </select>
          )}

          {onOpenCancelModal && 
            (activeTrip.status === 'MATCHING' || activeTrip.status === 'DISPATCHED' || activeTrip.status === 'AT_PICKUP') && 
            activeTrip.escrow.status === 'HELD_IN_ESCROW' && (
            <button
              onClick={onOpenCancelModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-300 hover:text-white bg-red-950/60 hover:bg-red-900 border border-red-700/50 transition active:scale-[0.98]"
              title="Cancel shipment before pickup (transfers escrow to driver)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Cancel Load (Before Pick-up)</span>
            </button>
          )}

          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-450 text-slate-950 transition shadow-md shadow-amber-500/20 active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Book Another Truck</span>
          </button>
        </div>
      </div>

      {/* Primary Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Map, Dual Escrow, Payments & Post-Delivery Reviews */}
        <div className="lg:col-span-2 space-y-6">
          {/* Interactive Live Tracking Map */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-white text-sm">Real-Time Route Telemetry & Driver Tracking</h3>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {onRepinPickup && !isTripCompleted && (
                  <button
                    onClick={() => { setShowRepinMap(!showRepinMap); setShowRepinDeliveryMap(false); }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold border transition active:scale-95 ${
                      showRepinMap
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-800 text-amber-400 border-slate-700 hover:bg-slate-750'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Re-pin Pickup</span>
                  </button>
                )}
                {onRepinDelivery && !isTripCompleted && (
                  <button
                    onClick={() => { setShowRepinDeliveryMap(!showRepinDeliveryMap); setShowRepinMap(false); }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold border transition active:scale-95 ${
                      showRepinDeliveryMap
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                        : 'bg-slate-800 text-emerald-400 border-slate-700 hover:bg-slate-750'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Re-pin Delivery</span>
                  </button>
                )}
                <span className="text-slate-400">Carrier:</span>
                <span className="font-semibold text-white">{trucker?.name}</span>
              </div>
            </div>

            {showRepinMap && onRepinPickup && (
              <div className="mb-3 p-4 rounded-2xl bg-slate-950 border border-amber-500/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> Adjust Pick-Up Pin
                  </span>
                  <button
                    onClick={() => setShowRepinMap(false)}
                    className="text-xs text-slate-400 hover:text-white font-bold"
                  >
                    Done
                  </button>
                </div>
                <RemoteLocationPickerMap
                  initialLat={activeTrip.origin.lat}
                  initialLng={activeTrip.origin.lng}
                  initialAddress={activeTrip.origin.address}
                  height="220px"
                  onSelectLocation={(loc) => {
                    onRepinPickup({
                      ...activeTrip.origin,
                      lat: loc.lat,
                      lng: loc.lng,
                      address: loc.address,
                      city: loc.city,
                      state: loc.state,
                    });
                  }}
                />
              </div>
            )}

            {showRepinDeliveryMap && onRepinDelivery && (
              <div className="mb-3 p-4 rounded-2xl bg-slate-950 border border-emerald-500/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> Adjust Delivery Pin
                  </span>
                  <button
                    onClick={() => setShowRepinDeliveryMap(false)}
                    className="text-xs text-slate-400 hover:text-white font-bold"
                  >
                    Done
                  </button>
                </div>
                <RemoteLocationPickerMap
                  initialLat={activeTrip.destination.lat}
                  initialLng={activeTrip.destination.lng}
                  initialAddress={activeTrip.destination.address}
                  height="220px"
                  pinColor="emerald"
                  label="Delivery"
                  onSelectLocation={(loc) => {
                    onRepinDelivery({
                      ...activeTrip.destination,
                      lat: loc.lat,
                      lng: loc.lng,
                      address: loc.address,
                      city: loc.city,
                      state: loc.state,
                    });
                  }}
                />
              </div>
            )}

            <TrackingMap
              origin={activeTrip.origin}
              destination={activeTrip.destination}
              routeWaypoints={activeTrip.routeWaypoints}
              currentLocation={activeTrip.currentLocation}
              currentSpeedMph={activeTrip.currentSpeedMph}
              progressPercent={activeTrip.progressPercent}
              trucker={trucker}
              tripStatus={activeTrip.status}
              isSimulating={isSimulating}
              onToggleSimulation={onToggleSimulation}
              onResetSimulation={onResetSimulation}
              speedMultiplier={speedMultiplier}
              onChangeSpeedMultiplier={onChangeSpeedMultiplier}
            />
          </div>

          {/* DUAL AUTHORIZATION ESCROW VAULT - Directly satisfies the user's core security prompt */}
          <DualEscrowCard
            escrow={activeTrip.escrow}
            currentRole="shipper"
            currency={currency || settings?.currency}
            onShipperApprove={onShipperApproveEscrow}
            onTruckerApprove={onTruckerApproveEscrow}
            onTriggerAutoRefund={onTriggerAutoRefund}
            onToggleDriverAtPickup={onToggleDriverAtPickup}
            onUpdateAutoRefundHours={onUpdateAutoRefundHours}
            onResetEscrow={onResetEscrow}
            onOpenCancelModal={onOpenCancelModal}
          />

          {/* 2-Phase Payment Card */}
          <PaymentPlanCard
            key={`payment-plan-${activeTrip.id}`}
            payments={activeTrip.payments}
            tripStatus={activeTrip.status}
            currency={currency || settings?.currency}
            onReleaseAdvance={onReleaseAdvance}
            onReleaseFinal={onOpenPODModal}
            isShipper={true}
            currentRole="shipper"
            onUpdateAdvanceTerms={onUpdateAdvanceTerms}
            onTruckerAcceptAdvance={onTruckerAcceptAdvance}
          />

          {/* MUTUAL POST-DELIVERY RATING & REVIEWS CARD */}
          <TripReviewsCard
            trip={activeTrip}
            currentRole="shipper"
            onOpenReviewModal={onOpenReviewModal}
          />
        </div>

        {/* Right Col: Driver Info, Past Reviews Expander, Shipper Reputation, Cargo Details, and Milestones */}
        <div className="space-y-6">
          {/* Driver Assigned Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Assigned Carrier
              </span>
              <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                GPS Connected
              </span>
            </div>

            {trucker ? (
              <div className="mt-4">
                <div className="flex items-center gap-3.5">
                  <img
                    src={trucker.avatar}
                    alt={trucker.name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-700 shadow-md"
                  />
                  <div>
                    <h4 className="font-bold text-white text-base">{trucker.name}</h4>
                    <p className="text-xs text-slate-400">{trucker.truckModel}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="flex items-center gap-1 text-xs text-amber-400 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        {trucker.rating}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-xs text-slate-400">{trucker.tripsCompleted} completed</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block">License Plate</span>
                    <span className="font-mono text-white font-bold">{trucker.plateNumber}</span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block">EAC Transit Permit</span>
                    <span className="font-mono text-amber-400 font-bold">{trucker.permitNumber}</span>
                  </div>
                </div>

                {/* Actions: Direct Chat & Call */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    onClick={onOpenChat}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold border border-slate-700 transition"
                  >
                    <MessageSquare className="w-4 h-4 text-amber-400" />
                    <span>Driver Chat</span>
                  </button>
                  <a
                    href={`tel:${trucker.phone}`}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold border border-slate-700 transition"
                  >
                    <Phone className="w-4 h-4 text-emerald-400" />
                    <span>Call Driver</span>
                  </a>
                </div>

                {/* Driver's Past Reviews Expander */}
                {trucker.recentReviews && trucker.recentReviews.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowDriverReviews(!showDriverReviews)}
                      className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-amber-400 transition py-1"
                    >
                      <span className="flex items-center gap-1.5 font-semibold">
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        Driver Reviews History ({trucker.recentReviews.length})
                      </span>
                      {showDriverReviews ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>

                    {showDriverReviews && (
                      <div className="mt-3 space-y-2.5 max-h-60 overflow-y-auto pr-1">
                        {trucker.recentReviews.map((rev) => (
                          <div key={rev.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-white text-[11px]">{rev.reviewerName}</span>
                              <div className="flex items-center gap-1 text-amber-400 font-bold text-[11px]">
                                <Star className="w-3 h-3 fill-amber-400" />
                                <span>{rev.rating}.0</span>
                              </div>
                            </div>
                            <p className="text-[11px] text-slate-400 italic">"{rev.comment}"</p>
                            <span className="text-[10px] text-slate-600 block">{rev.createdAt}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                Finding the nearest trucker...
              </div>
            )}
          </div>

          {/* Shipper's Own Reputation Hub (What truckers say about Frank Miller's dock) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Your Shipper Reputation
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                <Star className="w-3 h-3 fill-amber-400" />
                {MOCK_SHIPPER_PROFILE.rating}
              </div>
            </div>

            <div className="mt-3 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <h5 className="font-bold text-white text-xs">{MOCK_SHIPPER_PROFILE.company}</h5>
                  <span className="text-[11px] text-emerald-400 font-medium">
                    Verified Fast-Escrow Shipper
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {MOCK_SHIPPER_PROFILE.tripsPosted} loads posted
                </span>
              </div>

              {/* Badges earned from truckers */}
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[10px] bg-slate-950 text-slate-300 border border-slate-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Instant Escrow Clearance
                </span>
                <span className="text-[10px] bg-slate-950 text-slate-300 border border-slate-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-blue-400" />
                  Quick Dock Turnaround
                </span>
              </div>

              {/* View reviews from truckers toggle */}
              <button
                type="button"
                onClick={() => setShowShipperReputation(!showShipperReputation)}
                className="w-full text-left text-xs text-slate-400 hover:text-white flex items-center justify-between pt-1 font-semibold"
              >
                <span>Read Trucker Feedback ({MOCK_SHIPPER_PROFILE.recentReviews.length})</span>
                {showShipperReputation ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              {showShipperReputation && (
                <div className="space-y-2 pt-1 max-h-52 overflow-y-auto pr-1">
                  {MOCK_SHIPPER_PROFILE.recentReviews.map((rev) => (
                    <div key={rev.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{rev.reviewerName} (Carrier)</span>
                        <div className="flex items-center gap-0.5 text-amber-400 font-bold">
                          <Star className="w-2.5 h-2.5 fill-amber-400" />
                          <span>{rev.rating}.0</span>
                        </div>
                      </div>
                      <p className="text-slate-400 italic">"{rev.comment}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Goods Owner Company, Tax & Banking Information Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Company, Tax &amp; Banking Profile
                </span>
              </div>
              {onOpenSettings && (
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-bold bg-slate-950 px-2 py-1 rounded-lg border border-slate-800"
                >
                  <Settings className="w-3 h-3" />
                  <span>Edit in Settings</span>
                </button>
              )}
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Entity Name</span>
                <span className="font-bold text-white text-xs block">
                  {settings?.shipperProfile.legalName || 'AeroPrecision Industrial Dynamics LLC'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Tax ID (TIN/EIN)</span>
                  <span className="font-mono font-bold text-amber-400 text-xs">
                    {settings?.shipperProfile.tinNumber || '36-4920184'}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">VAT / Tax Reg</span>
                  <span className="font-mono font-bold text-emerald-400 text-xs">
                    {settings?.shipperProfile.vatNumber || 'US-IL-9948201'}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <Landmark className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-slate-300 truncate max-w-[170px]">
                    {settings?.shipperBanking.bankName || 'JPMorgan Chase Commercial Bank'}
                  </span>
                </div>
                <span className="text-[10px] bg-slate-900 text-emerald-400 font-bold px-1.5 py-0.5 rounded border border-slate-800">
                  Verified
                </span>
              </div>
            </div>
          </div>

          {/* Cargo Specs & IoT Telematics */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Cargo Specifications
              </span>
              <span className="text-xs text-amber-400 font-bold">
                {formatCurrency(activeTrip.cargo.cargoValueUsd, currency || settings?.currency)} Insured
              </span>
            </div>

            <div className="mt-3 space-y-3 text-xs">
              <div>
                <h5 className="font-bold text-white text-sm">{activeTrip.cargo.title}</h5>
                <p className="text-slate-400 text-xs mt-0.5">{activeTrip.cargo.category}</p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-500 block">Weight</span>
                  <span className="font-bold text-white">
                    {activeTrip.cargo.weightTonnes || activeTrip.cargo.weightTons || ((activeTrip.cargo.weightKg || (activeTrip.cargo.weightLbs || 0) * 0.453592) / 1000).toFixed(1)}T
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-500 block">Pallets</span>
                  <span className="font-bold text-white">{activeTrip.cargo.palletsCount} Units</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-500 block">Handling</span>
                  <span className="font-bold text-amber-400">
                    {activeTrip.cargo.isFragile ? 'Fragile' : 'Standard'}
                  </span>
                </div>
              </div>

              {/* IoT Telematics Sensor Box */}
              {activeTrip.cargoTelemetry && (
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                    <span className="flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5 text-blue-400" />
                      Live Cargo IoT Telemetry
                    </span>
                    <span className="text-emerald-400 text-[10px]">Active Sensor #84</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Temp</span>
                      <span className="font-bold text-white text-xs">
                        {activeTrip.cargoTelemetry.temperatureF}°F
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Humidity</span>
                      <span className="font-bold text-white text-xs">
                        {activeTrip.cargoTelemetry.humidityPercent}%
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Shock / G</span>
                      <span className="font-bold text-emerald-400 text-xs">
                        {activeTrip.cargoTelemetry.vibrationG}G (Normal)
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Logistics Milestones Stepper */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-4">
              Trip Milestones & Escrow Ledger
            </span>

            <div className="space-y-4">
              {activeTrip.milestones.map((ms, index) => (
                <div key={ms.key} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      ms.completed
                        ? 'bg-emerald-500 text-slate-950'
                        : ms.current
                        ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-500/20 animate-pulse'
                        : 'bg-slate-800 text-slate-500'
                    }`}>
                      {ms.completed ? '✓' : index + 1}
                    </div>
                    {index < activeTrip.milestones.length - 1 && (
                      <div className={`w-0.5 flex-1 my-1 ${
                        ms.completed ? 'bg-emerald-500/50' : 'bg-slate-800'
                      }`} />
                    )}
                  </div>

                  <div className="pb-2">
                    <div className="flex items-center gap-2">
                      <h6 className={`text-xs font-bold ${
                        ms.completed ? 'text-white' : ms.current ? 'text-amber-400' : 'text-slate-500'
                      }`}>
                        {ms.label}
                      </h6>
                      {ms.timestamp && (
                        <span className="text-[10px] text-slate-500 font-mono">{ms.timestamp}</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                      {ms.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
