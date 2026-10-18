import React, { useState } from 'react';
import { ShieldCheck, Lock, Clock as Unlock, Fuel, CircleCheck as CheckCircle2, Clock, TriangleAlert as AlertTriangle, Info, ArrowRight, Sparkles, MapPin, RotateCcw, Timer, ChevronDown, DollarSign } from 'lucide-react';
import confetti from 'canvas-confetti';
import { DualEscrowVault } from '../types/logistics';
import { CurrencyConfig } from '../types/settings';
import { formatCurrency, formatDieselPricePerLiter } from '../services/routing';

interface DualEscrowCardProps {
  escrow: DualEscrowVault;
  currentRole: 'shipper' | 'trucker' | 'both';
  currency?: CurrencyConfig;
  onShipperApprove: () => void;
  onTruckerApprove: () => void;
  onTriggerAutoRefund?: () => void;
  onToggleDriverAtPickup?: () => void;
  onUpdateAutoRefundHours?: (hours: number) => void;
  onResetEscrow?: () => void;
  onOpenCancelModal?: () => void;
}

export const DualEscrowCard: React.FC<DualEscrowCardProps> = ({
  escrow,
  currentRole,
  currency,
  onShipperApprove,
  onTruckerApprove,
  onTriggerAutoRefund,
  onToggleDriverAtPickup,
  onUpdateAutoRefundHours,
  onResetEscrow,
  onOpenCancelModal,
}) => {
  const [showExplanation, setShowExplanation] = useState(false);
  const [selectedHours, setSelectedHours] = useState(escrow.autoRefundHours || 3);
  const [isSimulatedAtPickup, setIsSimulatedAtPickup] = useState(
    escrow.isDriverAtPickup !== undefined ? escrow.isDriverAtPickup : true
  );

  const isFullyReleased = escrow.status === 'RELEASED_TO_TRUCKER';
  const isRefunded = escrow.status === 'REFUNDED_TO_SHIPPER';
  const isCancelled = escrow.status === 'FORFEITED_TO_SHIPPER' || escrow.status === 'FORFEITED_TO_TRUCKER';
  const bothApproved = escrow.shipperApproved && escrow.truckerApproved;

  const totalEscrowPool = escrow.totalEscrowLockedUsd || escrow.fuelAmountUsd * 2;
  const driverBond = escrow.driverBondAmountUsd || escrow.fuelAmountUsd;

  // Condition 1: Geofence Verification Requirement
  // Payment is ONLY released when the geolocation of the driver is in the same place as the pick up point
  const isDriverAtPickupPoint = isSimulatedAtPickup;
  const isGeofenceUnlocked = isDriverAtPickupPoint && !isRefunded && !isCancelled;

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#10b981', '#3b82f6'],
    });
  };

  const handleShipperClick = () => {
    if (!isGeofenceUnlocked || escrow.shipperApproved || isFullyReleased || isRefunded) return;
    onShipperApprove();
    if (escrow.truckerApproved) {
      triggerConfetti();
    }
  };

  const handleTruckerClick = () => {
    if (!isGeofenceUnlocked || escrow.truckerApproved || isFullyReleased || isRefunded) return;
    onTruckerApprove();
    if (escrow.shipperApproved) {
      triggerConfetti();
    }
  };

  const handleHoursChange = (hrs: number) => {
    setSelectedHours(hrs);
    if (onUpdateAutoRefundHours) {
      onUpdateAutoRefundHours(hrs);
    }
  };

  const handleToggleGeofence = () => {
    const nextState = !isSimulatedAtPickup;
    setIsSimulatedAtPickup(nextState);
    if (onToggleDriverAtPickup) {
      onToggleDriverAtPickup();
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/30 p-6 shadow-xl shadow-amber-950/20">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-56 h-56 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl flex items-center justify-center ${
            isRefunded
              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
              : isFullyReleased 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
          }`}>
            {isRefunded ? (
              <RotateCcw className="w-6 h-6" />
            ) : isFullyReleased ? (
              <Unlock className="w-6 h-6" />
            ) : (
              <Lock className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-white">Guaranteed Diesel Escrow Vault</h3>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                isCancelled
                  ? 'bg-red-950/80 text-red-300 border-red-500/40'
                  : isRefunded
                  ? 'bg-red-950/80 text-red-300 border-red-500/40'
                  : isFullyReleased
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                  : bothApproved
                  ? 'bg-blue-950/80 text-blue-300 border-blue-500/40'
                  : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
              }`}>
                {isCancelled
                  ? escrow.status === 'FORFEITED_TO_SHIPPER'
                    ? 'CANCELLED: ESCROW PAID TO GOODS OWNER'
                    : 'CANCELLED: ESCROW PAID TO TRUCKER'
                  : isRefunded
                  ? 'AUTO-REFUNDED TO GOODS OWNER'
                  : isFullyReleased
                  ? 'FUNDS DISBURSED TO DRIVER'
                  : bothApproved
                  ? 'MUTUAL CONSENT REACHED'
                  : 'MUTUAL ESCROW LOCKED'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Dual-deposit escrow: Goods owner diesel guarantee matched by trucker load commitment bond
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 bg-slate-800/80 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 transition"
          >
            <Info className="w-3.5 h-3.5" />
            <span>Escrow Guarantee Rules</span>
          </button>
        </div>
      </div>

      {/* Explanation Banner */}
      {showExplanation && (
        <div className="mt-4 p-4 rounded-xl bg-slate-900/90 border border-amber-500/40 text-xs text-slate-300 space-y-2">
          <div className="font-semibold text-amber-300 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            Strict Diesel Payment Conditions &amp; Protections
          </div>
          <p>
            The goods owner deposits mobilization diesel funds in advance so the trucker drives with guaranteed fuel security.
            To protect both the goods owner and trucker, the following smart contract rules are strictly enforced:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
            <li>
              <strong className="text-amber-300">Condition 1 (Geofence Requirement):</strong> The <em>driver's</em> claim button is locked until the truck's live GPS coordinates match the goods owner's pinned pick-up location (within 500m). The goods owner can pre-authorize from anywhere; funds only disburse once the driver also confirms on-site.
            </li>
            <li>
              <strong className="text-amber-300">Condition 2 (3-Hour Auto-Refund Window):</strong> If the truck is not at the pick-up point at the agreed time, the diesel deposit automatically returns to the goods owner after 3 hours (or agreed grace hours).
            </li>
            <li>
              <strong className="text-amber-300">Condition 3 (Remote Pinning):</strong> Goods owners can accurately pin the pick-up point on the map from anywhere without being physically present.
            </li>
          </ul>
        </div>
      )}

      {/* CONDITION 1: Geofence Verification Status Card */}
      <div className={`mt-5 p-4 rounded-xl border transition-all ${
        isRefunded
          ? 'bg-slate-950/60 border-slate-800 opacity-60'
          : isGeofenceUnlocked
          ? 'bg-emerald-950/30 border-emerald-500/50 shadow-sm shadow-emerald-900/20'
          : 'bg-amber-950/20 border-amber-500/40'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className={`p-2 rounded-xl shrink-0 ${
              isGeofenceUnlocked 
                ? 'bg-emerald-500/20 text-emerald-400' 
                : 'bg-amber-500/20 text-amber-400'
            }`}>
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Pick-up Point Geofence Check
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  isGeofenceUnlocked
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}>
                  {isGeofenceUnlocked ? 'Driver In Range (Geofence Unlocked)' : 'Driver Out of Range (Geofence Locked)'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isGeofenceUnlocked
                  ? 'Truck driver GPS is within 500m of the pinned pick-up depot. The driver claim button is now ACTIVE.'
                  : 'Driver has NOT arrived at the pick-up point yet. The driver release button stays disabled until arrival. The goods owner can still pre-authorize from anywhere.'}
              </p>
            </div>
          </div>

          {/* Interactive Demo Simulation Button */}
          {!isRefunded && (
            <button
              type="button"
              onClick={handleToggleGeofence}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition active:scale-95"
              title="Toggle simulated driver location between At Pick-up vs Away"
            >
              <span>{isSimulatedAtPickup ? 'Simulate Truck Away' : '📍 Simulate Truck at Pick-up'}</span>
            </button>
          )}
        </div>
      </div>

      {/* CONDITION 2: Agreed Time & Auto-Refund Protection Banner */}
      <div className={`mt-3 p-4 rounded-xl border transition-all ${
        isRefunded
          ? 'bg-red-950/30 border-red-500/50'
          : 'bg-slate-950/80 border-slate-800'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start md:items-center gap-3">
            <div className={`p-2 rounded-xl shrink-0 ${
              isRefunded ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
            }`}>
              <Timer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Agreed Pick-up Time &amp; Auto-Refund Guarantee
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  isRefunded
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                }`}>
                  {isRefunded ? 'DEPOSIT RETURNED' : `${selectedHours}-Hour Auto-Refund Active`}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Agreed pick-up: <strong className="text-white">{escrow.agreedPickupTime || '10:00 AM'}</strong>. If truck is absent after{' '}
                <strong className="text-amber-400">{selectedHours} hours</strong>, diesel deposit automatically reverts to the goods owner.
              </p>
            </div>
          </div>

          {/* Grace Hours Agreement Selector & Auto-Refund Trigger */}
          {!isRefunded && !isFullyReleased && (
            <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg text-xs">
                <span className="text-slate-400 text-[11px] font-medium mr-1">Agreed Hours:</span>
                {[1, 2, 3, 6].map((hrs) => (
                  <button
                    key={hrs}
                    type="button"
                    onClick={() => handleHoursChange(hrs)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                      selectedHours === hrs
                        ? 'bg-amber-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {hrs}h
                  </button>
                ))}
              </div>

              {onTriggerAutoRefund && (
                <button
                  type="button"
                  onClick={onTriggerAutoRefund}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-700/60 transition active:scale-95"
                  title="Simulate truck failing to arrive within agreed hours"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Trigger {selectedHours}h Timeout Refund</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* If already refunded banner */}
        {isRefunded && (
          <div className="mt-3 p-3 rounded-lg bg-red-950/60 border border-red-500/40 text-xs text-red-200 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-red-400 shrink-0" />
              <span>
                <strong>Refund Complete:</strong> {formatCurrency(escrow.fuelAmountUsd, currency)} has been automatically credited back to Goods Owner due to truck arrival timeout (&gt;{selectedHours} hours past agreed time).
              </span>
            </span>
            {onResetEscrow && (
              <button
                type="button"
                onClick={onResetEscrow}
                className="ml-2 text-xs underline font-semibold text-white hover:text-amber-300"
              >
                Reset Escrow
              </button>
            )}
          </div>
        )}
      </div>

      {/* Vault Amount & Telemetry: Showing Both Shipper Deposit & Trucker Matching Bond */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-blue-500/30">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Shipper Diesel Escrow</span>
          <span className="text-xl font-black text-amber-400 tracking-tight">
            {formatCurrency(escrow.fuelAmountUsd, currency)}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Goods Owner Deposit</span>
        </div>

        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-emerald-500/30">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Trucker Security Bond</span>
          <span className="text-xl font-black text-emerald-400 tracking-tight">
            {formatCurrency(driverBond, currency)}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Matching Load Security</span>
        </div>

        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-amber-500/40 bg-gradient-to-br from-slate-950 to-amber-950/20">
          <span className="text-[11px] font-medium text-amber-300 uppercase tracking-wider block">Total Locked Escrow</span>
          <span className="text-xl font-black text-white tracking-tight">
            {formatCurrency(totalEscrowPool, currency)}
          </span>
          <span className="text-[10px] text-amber-400/80 block mt-0.5">Combined 2-Party Vault</span>
        </div>

        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Deadhead Run</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-white">
              {escrow.deadheadDistanceKm || Math.round((escrow.deadheadDistanceMiles || 8) * 1.609)}
            </span>
            <span className="text-xs text-amber-400 font-semibold">km</span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">{formatDieselPricePerLiter(escrow.dieselPricePerLiter || 1.25, currency)}</span>
        </div>
      </div>

      {/* Mutual Escrow Rule Notice */}
      <div className="mt-3 p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-300">
        <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-white">Mutual Cancellation Rule:</strong> Both parties have deposited equal sums ({formatCurrency(escrow.fuelAmountUsd, currency)} each) to secure this shipment. If either the goods owner or trucker cancels before pickup, the counterparty automatically receives the full <strong className="text-amber-300 font-mono">{formatCurrency(totalEscrowPool, currency)}</strong> escrow balance.
        </p>
      </div>

      {/* Pre-Pickup Cancellation Action Banner */}
      {!isFullyReleased && !isRefunded && !isCancelled && onOpenCancelModal && (
        <div className="mt-3 p-3 rounded-xl bg-red-950/20 border border-red-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>
              Pre-pickup cancellation option: If either party cancels, the full <strong className="text-white font-mono">{formatCurrency(totalEscrowPool, currency)}</strong> transfers to the other party.
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenCancelModal}
            className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold text-red-300 hover:text-white bg-red-950/70 hover:bg-red-900 border border-red-700/60 shadow-sm transition active:scale-95 flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Cancel Load (Before Pick-up)</span>
          </button>
        </div>
      )}

      {/* Cancelled State Settlement Banner */}
      {isCancelled && (
        <div className="mt-4 p-4 rounded-xl bg-red-950/40 border border-red-500/60 text-xs text-red-100 space-y-2.5 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-red-500/30">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              <span className="font-bold text-sm uppercase tracking-wider text-white">
                Load Cancelled Before Pick-up by {escrow.cancellationRecord?.cancelledBy === 'shipper' ? 'Goods Owner (Shipper)' : 'Truck Driver'}
              </span>
            </div>
            <span className="text-xs font-mono font-black text-amber-300 bg-red-950/80 px-2.5 py-1 rounded border border-red-500/40 self-start sm:self-auto">
              {formatCurrency(totalEscrowPool, currency)} Escrow Disbursed
            </span>
          </div>

          <p className="leading-relaxed text-slate-200">
            Under the dual escrow penalty policy, the full mutual escrow pool has been{' '}
            <strong className="text-emerald-300">transferred to the {escrow.cancellationRecord?.payoutRecipient === 'shipper' ? 'Goods Owner (Shipper)' : 'Truck Driver'}</strong>{' '}
            as agreed compensation.
          </p>

          {escrow.cancellationRecord?.reason && (
            <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300">
              <strong className="text-slate-400 uppercase text-[10px] block">Recorded Reason:</strong>
              "{escrow.cancellationRecord.reason}"
            </div>
          )}

          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
            <span>Settled at: {escrow.cancellationRecord?.cancelledAt || 'Prior to pickup arrival'}</span>
            {onResetEscrow && (
              <button
                type="button"
                onClick={onResetEscrow}
                className="text-white hover:text-amber-300 underline font-semibold text-xs"
              >
                Reset Load / Escrow Vault
              </button>
            )}
          </div>
        </div>
      )}

      {/* The Two Parties Dual-Approval Panel */}
      <div className="mt-5 pt-5 border-t border-slate-800/80">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Mutual Authorization (Both Signatures Required to Disburse)
          </span>
          {isFullyReleased && (
            <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              Transferred to Driver Fleet Fuel Card
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Party 1: Shipper (Goods Owner) */}
          <div className={`p-4 rounded-xl border transition-all ${
            escrow.shipperApproved 
              ? 'bg-emerald-950/30 border-emerald-500/50 shadow-sm shadow-emerald-900/20' 
              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                  escrow.shipperApproved ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                }`}>
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-white">Goods Owner Approval</h4>
                  <span className="text-xs text-slate-400">Cargo Owner App</span>
                </div>
              </div>
              {escrow.shipperApproved ? (
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  APPROVED
                </span>
              ) : isRefunded ? (
                <span className="text-xs text-red-400 bg-red-950/50 px-2 py-0.5 rounded-full border border-red-500/30">
                  REFUNDED
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-medium text-amber-400 bg-amber-950/50 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  <Clock className="w-3.5 h-3.5" />
                  AWAITING
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 mb-4">
              {escrow.shipperApproved 
                ? `Authorized at ${escrow.shipperApprovedAt || '10:05 AM'}. Shipper confirmed truck on-site at pinned depot.`
                : 'Approve the diesel release to the driver. You may authorize from anywhere; funds disburse only after the driver also confirms arrival inside the pick-up geofence.'}
            </p>

            <button
              onClick={handleShipperClick}
              disabled={escrow.shipperApproved || isFullyReleased || isRefunded}
              className={`w-full py-2.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition ${
                escrow.shipperApproved
                  ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/50 cursor-default'
                  : isRefunded
                  ? 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold hover:shadow-lg hover:shadow-amber-500/25 active:scale-[0.98]'
              }`}
            >
              {escrow.shipperApproved ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Goods Owner Signed &amp; Verified</span>
                </>
              ) : isRefunded ? (
                <>
                  <RotateCcw className="w-4 h-4" />
                  <span>Deposit Returned to Goods Owner</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Approve Diesel Release (Goods Owner)</span>
                </>
              )}
            </button>
          </div>

          {/* Party 2: Truck Driver (Carrier) */}
          <div className={`p-4 rounded-xl border transition-all ${
            escrow.truckerApproved 
              ? 'bg-emerald-950/30 border-emerald-500/50 shadow-sm shadow-emerald-900/20' 
              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                  escrow.truckerApproved ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                }`}>
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-white">Truck Driver Confirmation</h4>
                  <span className="text-xs text-slate-400">Carrier Driver App</span>
                </div>
              </div>
              {escrow.truckerApproved ? (
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  APPROVED
                </span>
              ) : isRefunded ? (
                <span className="text-xs text-red-400 bg-red-950/50 px-2 py-0.5 rounded-full border border-red-500/30">
                  CANCELLED
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-medium text-amber-400 bg-amber-950/50 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  <Clock className="w-3.5 h-3.5" />
                  AWAITING
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 mb-4">
              {escrow.truckerApproved 
                ? `Authorized at ${escrow.truckerApprovedAt || '10:05 AM'}. Driver has confirmed on-site arrival.`
                : !isGeofenceUnlocked
                ? '🔒 Geofence Inactive: Driver app GPS must enter pick-up depot perimeter before claim button unlocks.'
                : 'GPS verified inside depot geofence. Tap to confirm arrival and claim diesel payment.'}
            </p>

            <button
              onClick={handleTruckerClick}
              disabled={!isGeofenceUnlocked || escrow.truckerApproved || isFullyReleased || isRefunded}
              className={`w-full py-2.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition ${
                escrow.truckerApproved
                  ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/50 cursor-default'
                  : isRefunded
                  ? 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                  : !isGeofenceUnlocked
                  ? 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed opacity-60'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white font-bold hover:shadow-lg hover:shadow-emerald-600/25 active:scale-[0.98]'
              }`}
            >
              {escrow.truckerApproved ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Driver Arrival Confirmed</span>
                </>
              ) : isRefunded ? (
                <>
                  <RotateCcw className="w-4 h-4" />
                  <span>Escrow Refunded to Goods Owner</span>
                </>
              ) : !isGeofenceUnlocked ? (
                <>
                  <Lock className="w-4 h-4 text-slate-500" />
                  <span>Locked: Out of Geofence</span>
                </>
              ) : (
                <>
                  <Fuel className="w-4 h-4" />
                  <span>Confirm Arrival &amp; Claim Diesel (Driver)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Mutual Release Status Banner */}
        <div className="mt-4 p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Vault Verification Code:</span>
            <span className="font-mono font-bold text-amber-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
              {escrow.dualSignOffCode}
            </span>
          </div>

          <div className="text-right">
            {isRefunded ? (
              <span className="text-red-400 font-semibold flex items-center gap-1">
                <RotateCcw className="w-4 h-4" />
                Deposit Returned ({formatCurrency(escrow.fuelAmountUsd, currency)})
              </span>
            ) : isFullyReleased ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Escrow Settlement Complete ({formatCurrency(escrow.fuelAmountUsd, currency)})
              </span>
            ) : bothApproved ? (
              <span className="text-blue-400 font-semibold animate-pulse">
                Handshake verified! Disbursing diesel funds...
              </span>
            ) : (
              <span className="text-slate-400">
                Requires <strong className="text-slate-200">2 of 2</strong> signatures (driver must be in pick-up geofence)
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
