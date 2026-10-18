import React, { useState } from 'react';
import { 
  Truck, 
  MapPin, 
  Navigation, 
  Fuel, 
  Wallet, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  MessageSquare, 
  Phone, 
  AlertCircle,
  FileCheck,
  ChevronRight,
  ChevronDown,
  Sparkles,
  ArrowRight,
  Flame,
  Check,
  Star,
  Award,
  ThumbsUp,
  Settings,
  Landmark,
  Receipt,
  Building2,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Trip, Trucker } from '../types/logistics';
import { AppSettings, CurrencyConfig } from '../types/settings';
import { DualEscrowCard } from './DualEscrowCard';
import { PaymentPlanCard } from './PaymentPlanCard';
import { TrackingMap } from './TrackingMap';
import { TripReviewsCard } from './TripReviewsCard';
import { formatCurrency } from '../services/routing';

interface DriverDashboardProps {
  activeTrip: Trip;
  trucker: Trucker;
  settings?: AppSettings;
  currency?: CurrencyConfig;
  onOpenSettings?: () => void;
  onOpenChat: () => void;
  onOpenPODModal: () => void;
  onOpenReviewModal: () => void;
  onShipperApproveEscrow: () => void;
  onTruckerApproveEscrow: () => void;
  onDriverArrivedAtPickup: () => void;
  onDriverCargoLoaded: () => void;
  onDriverArrivedDestination: () => void;
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
  // Simulation props
  isSimulating: boolean;
  onToggleSimulation: () => void;
  onResetSimulation: () => void;
  speedMultiplier: number;
  onChangeSpeedMultiplier: (mult: number) => void;
}

export const DriverDashboard: React.FC<DriverDashboardProps> = ({
  activeTrip,
  trucker,
  settings,
  currency,
  onOpenSettings,
  onOpenChat,
  onOpenPODModal,
  onOpenReviewModal,
  onShipperApproveEscrow,
  onTruckerApproveEscrow,
  onDriverArrivedAtPickup,
  onDriverCargoLoaded,
  onDriverArrivedDestination,
  onUpdateAdvanceTerms,
  onTruckerAcceptAdvance,
  onTriggerAutoRefund,
  onToggleDriverAtPickup,
  onUpdateAutoRefundHours,
  onResetEscrow,
  onOpenCancelModal,
  isSimulating,
  onToggleSimulation,
  onResetSimulation,
  speedMultiplier,
  onChangeSpeedMultiplier,
}) => {
  const [isOnline, setIsOnline] = useState(true);
  const [showReviewsHistory, setShowReviewsHistory] = useState(true);
  const escrow = activeTrip.escrow;
  const isAdvanceReleased = activeTrip.payments.advancePayment.status === 'RELEASED';
  const isFinalReleased = activeTrip.payments.finalPayment.status === 'RELEASED';
  const isTripCompleted = activeTrip.status === 'COMPLETED' || activeTrip.status === 'DELIVERED';

  return (
    <div className="space-y-6">
      {/* Driver Status Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={trucker.avatar}
              alt={trucker.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500 shadow-md"
            />
            <span className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-slate-900 ${
              isOnline ? 'bg-emerald-500' : 'bg-slate-500'
            }`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">{trucker.name}</h2>
              <span className="text-xs bg-slate-800 text-amber-400 font-bold px-2 py-0.5 rounded-full border border-slate-700">
                PRO CARRIER
              </span>
              <span className="flex items-center gap-1 text-xs text-amber-400 font-black bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                {trucker.rating}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {trucker.truckModel} • <span className="font-mono text-slate-300">{trucker.plateNumber}</span>
            </p>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
              <span className="font-mono text-amber-400 font-medium">Permit: {trucker.permitNumber}</span>
              <span>•</span>
              <span className="text-emerald-400 font-semibold">{trucker.tripsCompleted} Trips Completed</span>
            </div>
          </div>
        </div>

        {/* Right: Driver Balances and Status Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-0.5">
              <Fuel className="w-3.5 h-3.5 text-amber-400" />
              <span>Fuel Card Vault</span>
            </div>
            <span className="text-lg font-black text-amber-400">
              {formatCurrency(trucker.fuelCardBalance, currency || settings?.currency)}
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-0.5">
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Total Earnings</span>
            </div>
            <span className="text-lg font-black text-white">
              {formatCurrency(trucker.walletBalance, currency || settings?.currency)}
            </span>
          </div>

          {onOpenCancelModal && 
            (activeTrip.status === 'MATCHING' || activeTrip.status === 'DISPATCHED' || activeTrip.status === 'AT_PICKUP') && 
            activeTrip.escrow.status === 'HELD_IN_ESCROW' && (
            <button
              onClick={onOpenCancelModal}
              className="px-3.5 py-3 rounded-2xl font-bold text-xs bg-red-950/60 hover:bg-red-900 text-red-300 hover:text-white border border-red-700/50 transition flex items-center gap-1.5 active:scale-95"
              title="Cancel accepted load before pickup (escrow transfers to shipper)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Cancel Load (Before Pick-up)</span>
            </button>
          )}

          <button
            onClick={() => setIsOnline(!isOnline)}
            className={`px-4 py-3 rounded-2xl font-bold text-xs transition flex items-center gap-2 ${
              isOnline
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span>{isOnline ? 'Active on Radar' : 'Offline'}</span>
          </button>
        </div>
      </div>

      {/* Driver Active Trip HUD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Navigation Route Map, Dual Escrow, & Post-Delivery Reviews */}
        <div className="lg:col-span-2 space-y-6">
          {/* Turn-by-Turn Instruction Banner */}
          <div className="bg-gradient-to-r from-blue-950/40 to-slate-900 border border-blue-500/30 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                <Navigation className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider block">
                  Next Waypoint Instruction
                </span>
                <h4 className="text-sm font-bold text-white">
                  {activeTrip.status === 'AT_PICKUP'
                    ? 'Docked at Mombasa Port Terminal 2 (Gate 18) - Pick-up Geofence Active'
                    : activeTrip.status === 'IN_TRANSIT'
                    ? 'Northern Corridor A109 Highway toward Nairobi ICD Embakasi (Speed: 58 MPH)'
                    : activeTrip.status === 'DELIVERED'
                    ? 'Arrived at Nairobi ICD Embakasi (Gate 4) - Offload & POD'
                    : activeTrip.status === 'COMPLETED'
                    ? 'Delivery Complete & Final Escrow Settled - Rate Shipper'
                    : 'Dispatch confirmed - Head to Pinned Pick-up Depot'}
                </h4>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-mono font-bold text-blue-300">
                {activeTrip.distanceMiles} mi total
              </span>
            </div>
          </div>

          {/* Interactive Live Route Map */}
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

          {/* Dual-Authorization Fuel Escrow Card from Driver Perspective */}
          <DualEscrowCard
            escrow={escrow}
            currentRole="trucker"
            currency={currency || settings?.currency}
            onShipperApprove={onShipperApproveEscrow}
            onTruckerApprove={onTruckerApproveEscrow}
            onTriggerAutoRefund={onTriggerAutoRefund}
            onToggleDriverAtPickup={onToggleDriverAtPickup}
            onUpdateAutoRefundHours={onUpdateAutoRefundHours}
            onResetEscrow={onResetEscrow}
            onOpenCancelModal={onOpenCancelModal}
          />

          {/* 2-Phase Payment Card with Trucker Acceptance */}
          <PaymentPlanCard
            key={`payment-plan-driver-${activeTrip.id}`}
            payments={activeTrip.payments}
            tripStatus={activeTrip.status}
            currency={currency || settings?.currency}
            onReleaseAdvance={() => {}}
            onReleaseFinal={onOpenPODModal}
            isShipper={false}
            currentRole="trucker"
            onUpdateAdvanceTerms={onUpdateAdvanceTerms}
            onTruckerAcceptAdvance={onTruckerAcceptAdvance}
          />

          {/* Mutual Trip Rating & Review Card */}
          <TripReviewsCard
            trip={activeTrip}
            currentRole="trucker"
            onOpenReviewModal={onOpenReviewModal}
          />
        </div>

        {/* Right Col: Driver Operations Control Pad & Carrier Reputation Hub */}
        <div className="space-y-6">
          {/* Driver Workflow Step Controller */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Driver Trip Actions
              </span>
              <span className="text-xs font-mono text-amber-400 font-bold">
                Trip #{activeTrip.id}
              </span>
            </div>

            {/* Quick action triggers depending on trip status */}
            <div className="space-y-3">
              {/* Action 1: Confirm Arrival at Pickup */}
              <div className={`p-3.5 rounded-2xl border transition ${
                activeTrip.status === 'AT_PICKUP' || activeTrip.status === 'IN_TRANSIT' || activeTrip.status === 'DELIVERED' || activeTrip.status === 'COMPLETED'
                  ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-800 text-xs font-bold flex items-center justify-center">
                      1
                    </span>
                    <span className="text-xs font-bold text-white">Arrival at Pickup Dock</span>
                  </div>
                  {activeTrip.status !== 'DISPATCHED' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mb-2.5">
                  Notify shipper you have reached the depot. Enables the mutual fuel release button.
                </p>
                {activeTrip.status === 'DISPATCHED' && (
                  <button
                    onClick={onDriverArrivedAtPickup}
                    className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-450 text-slate-950 text-xs font-bold transition"
                  >
                    Tap: I Have Arrived at Dock
                  </button>
                )}
              </div>

              {/* Action 2: Mutual Fuel Release Handshake */}
              <div className={`p-3.5 rounded-2xl border transition ${
                escrow.status === 'RELEASED_TO_TRUCKER'
                  ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-800 text-xs font-bold flex items-center justify-center">
                      2
                    </span>
                    <span className="text-xs font-bold text-white">Fuel Escrow Release</span>
                  </div>
                  <span className="text-xs font-bold text-amber-400">
                    {formatCurrency(escrow.fuelAmountUsd, currency || settings?.currency)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mb-2.5">
                  {escrow.status === 'RELEASED_TO_TRUCKER'
                    ? `Both parties confirmed. ${formatCurrency(escrow.fuelAmountUsd, currency || settings?.currency)} credited to your Fuel Card!`
                    : escrow.truckerApproved
                    ? 'You have approved. Waiting for Shipper button press.'
                    : 'Press approve in the Escrow card to claim fuel deposit.'}
                </p>
                {!escrow.truckerApproved && (
                  <button
                    onClick={onTruckerApproveEscrow}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <Fuel className="w-3.5 h-3.5" />
                    <span>Driver Sign-Off for Fuel Escrow</span>
                  </button>
                )}
              </div>

              {/* Action 3: Cargo Loaded & Depart */}
              <div className={`p-3.5 rounded-2xl border transition ${
                activeTrip.status === 'IN_TRANSIT' || activeTrip.status === 'DELIVERED' || activeTrip.status === 'COMPLETED'
                  ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-800 text-xs font-bold flex items-center justify-center">
                      3
                    </span>
                    <span className="text-xs font-bold text-white">Cargo Loaded & Start Run</span>
                  </div>
                  {activeTrip.status === 'IN_TRANSIT' && (
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-bold">
                      IN TRANSIT
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mb-2.5">
                  Cargo tied down, BOL signed, Phase 1 Advance Payment unlocked.
                </p>
                {activeTrip.status === 'AT_PICKUP' && (
                  <button
                    onClick={onDriverCargoLoaded}
                    className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Confirm Loaded & Hit Highway</span>
                  </button>
                )}
              </div>

              {/* Action 4: Destination Arrival, Proof of Delivery, & Review */}
              <div className={`p-3.5 rounded-2xl border transition ${
                activeTrip.status === 'DELIVERED' || activeTrip.status === 'COMPLETED'
                  ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-800 text-xs font-bold flex items-center justify-center">
                      4
                    </span>
                    <span className="text-xs font-bold text-white">Arrival & Settlement</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-400">
                    {formatCurrency(activeTrip.payments.finalPayment.amount, currency || settings?.currency)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mb-2.5">
                  {activeTrip.status === 'COMPLETED'
                    ? 'Final settlement cleared! Rate the shipper dock below.'
                    : 'Offload at receiver dock and collect digital signature.'}
                </p>
                {activeTrip.status === 'IN_TRANSIT' && (
                  <button
                    onClick={onDriverArrivedDestination}
                    className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-450 text-slate-950 text-xs font-bold transition"
                  >
                    Arrived at Dropoff Dock
                  </button>
                )}
                {activeTrip.status === 'DELIVERED' && (
                  <button
                    onClick={onOpenPODModal}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>Collect Receiver Signature & Settle</span>
                  </button>
                )}
                {activeTrip.status === 'COMPLETED' && !activeTrip.driverReview && (
                  <button
                    onClick={onOpenReviewModal}
                    className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-450 text-slate-950 text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <Star className="w-3.5 h-3.5 fill-slate-950" />
                    <span>Rate Shipper Facility & Escrow Speed</span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick Contact Shipper */}
            <div className="pt-3 border-t border-slate-800">
              <button
                onClick={onOpenChat}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 transition"
              >
                <MessageSquare className="w-4 h-4 text-amber-400" />
                <span>Chat with Cargo Owner ({activeTrip.shipperName.split(' ')[0]})</span>
              </button>
            </div>
          </div>

          {/* Carrier Driver Reputation & Public Ratings Hub */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  Carrier Reputation Hub
                </span>
              </div>
              <span className="text-xs text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                Top Rated Pro
              </span>
            </div>

            {/* Score Summary */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-2xl font-black text-amber-400 tracking-tight flex items-center gap-1.5">
                  <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
                  {trucker.rating}
                </span>
                <span className="text-[11px] text-slate-400">
                  Based on {trucker.tripsCompleted} verified freight hauls
                </span>
              </div>

              <div className="text-right text-[11px] text-slate-300 space-y-0.5">
                <div>Timeliness: <strong className="text-white">5.0 ★</strong></div>
                <div>Cargo Care: <strong className="text-white">4.9 ★</strong></div>
                <div>Escrow Handshake: <strong className="text-white">5.0 ★</strong></div>
              </div>
            </div>

            {/* Praise Badges Earned */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                Top Shipper Compliments
              </span>
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[10px] bg-amber-950/40 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-lg">
                  🏆 140+ On-Time Deliveries
                </span>
                <span className="text-[10px] bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                  🔒 95+ Flawless Escrow Releases
                </span>
                <span className="text-[10px] bg-blue-950/40 text-blue-300 border border-blue-500/30 px-2.5 py-1 rounded-lg">
                  📦 Zero Damage Claims
                </span>
              </div>
            </div>

            {/* Recent Shipper Reviews */}
            {trucker.recentReviews && trucker.recentReviews.length > 0 && (
              <div className="pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowReviewsHistory(!showReviewsHistory)}
                  className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-white font-semibold py-1"
                >
                  <span>Verified Reviews From Shippers ({trucker.recentReviews.length})</span>
                  {showReviewsHistory ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>

                {showReviewsHistory && (
                  <div className="mt-2.5 space-y-2 max-h-56 overflow-y-auto pr-1">
                    {trucker.recentReviews.map((rev) => (
                      <div key={rev.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-[11px]">{rev.reviewerName}</span>
                          <span className="text-amber-400 font-bold text-[11px] flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5 fill-amber-400" /> {rev.rating}.0
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 italic">"{rev.comment}"</p>
                        <span className="text-[10px] text-slate-500 block">{rev.createdAt}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Carrier Business, Tax (TIN / VAT / USDOT) & Fuel Card Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  Carrier Tax &amp; Bank Profile
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
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Carrier Legal Entity</span>
                <span className="font-bold text-white text-xs block">
                  {settings?.truckerProfile.legalName || 'Vance Express Hauling LLC'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">TIN / Tax ID</span>
                  <span className="font-mono font-bold text-amber-400 text-xs">
                    {settings?.truckerProfile.tinNumber || 'A008294192M'}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">EAC Transit Permit</span>
                  <span className="font-mono font-bold text-amber-400 text-xs">
                    {settings?.truckerProfile.eacTransitPermit || trucker.permitNumber}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <Fuel className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-slate-300 truncate max-w-[170px]">
                    {settings?.truckerBanking.fuelCardProvider || 'EFS Fleet Card'} ({settings?.truckerBanking.fuelCardNumber || '7088-••••-9921'})
                  </span>
                </div>
                <span className="text-[10px] bg-slate-900 text-amber-400 font-bold px-1.5 py-0.5 rounded border border-slate-800">
                  Escrow Card
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
