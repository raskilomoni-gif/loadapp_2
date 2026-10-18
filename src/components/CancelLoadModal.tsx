import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, ArrowRight, DollarSign, X, Check, Lock, RotateCcw } from 'lucide-react';
import { Trip } from '../types/logistics';
import { CurrencyConfig } from '../types/settings';
import { formatCurrency } from '../services/routing';

interface CancelLoadModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
  cancelledBy: 'shipper' | 'driver';
  currency?: CurrencyConfig;
  onConfirmCancel: (reason: string) => void;
}

export const CancelLoadModal: React.FC<CancelLoadModalProps> = ({
  isOpen,
  onClose,
  trip,
  cancelledBy,
  currency,
  onConfirmCancel,
}) => {
  const isShipper = cancelledBy === 'shipper';
  const fuelDeposit = trip.escrow.fuelAmountUsd;
  const driverBond = trip.escrow.driverBondAmountUsd || fuelDeposit;
  const totalEscrowPool = trip.escrow.totalEscrowLockedUsd || fuelDeposit + driverBond;

  const recipient = isShipper ? 'Truck Driver' : 'Goods Owner (Shipper)';
  const sender = isShipper ? 'Goods Owner (Shipper)' : 'Truck Driver';

  const defaultReasons = isShipper
    ? [
        'Cargo delayed at loading warehouse dock',
        'Customer changed delivery terms or cancelled purchase order',
        'Found alternative internal company fleet carrier',
        'Warehouse equipment breakdown / power outage',
        'Other emergency cancellation',
      ]
    : [
        'Truck mechanical failure / engine malfunction on deadhead run',
        'Tire blowout / steer axle road emergency',
        'Delayed at prior regional weighbridge / border customs',
        'Driver medical emergency / unable to reach depot on time',
        'Other carrier emergency',
      ];

  const [selectedReason, setSelectedReason] = useState<string>(defaultReasons[0]);
  const [customNote, setCustomNote] = useState<string>('');
  const [hasAcknowledgedPenalty, setHasAcknowledgedPenalty] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAcknowledgedPenalty) return;
    const finalReason = customNote.trim() ? `${selectedReason} - ${customNote.trim()}` : selectedReason;
    onConfirmCancel(finalReason);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-red-500/40 p-6 shadow-2xl shadow-red-950/40 text-slate-100 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3 pb-4 border-b border-slate-800">
          <div className="p-3 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-white">Cancel Load Before Pick-up</h3>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                isShipper 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}>
                Cancelling as {isShipper ? 'Goods Owner' : 'Driver'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Dual-escrow penalty rule: Cancelling parties forfeit the entire escrow balance to the counterparty.
            </p>
          </div>
        </div>

        {/* High-Stakes Penalty Card */}
        <div className="mt-4 p-4 rounded-xl bg-red-950/40 border border-red-500/40 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-red-300 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              Escrow Penalty Enforcement
            </span>
            <span className="font-mono font-black text-amber-400 text-sm">
              {formatCurrency(totalEscrowPool, currency)}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {isShipper ? (
              <>
                Under the smart escrow rules, because you (<strong className="text-white">Goods Owner</strong>) are cancelling before pickup, the entire escrow balance of{' '}
                <strong className="text-emerald-400 font-mono">{formatCurrency(totalEscrowPool, currency)}</strong> (your {formatCurrency(fuelDeposit, currency)} fuel guarantee deposit + driver's {formatCurrency(driverBond, currency)} commitment bond) will be{' '}
                <strong className="text-emerald-300">transferred directly to the Truck Driver</strong> as guaranteed deadhead &amp; mobilization compensation.
              </>
            ) : (
              <>
                Under the smart escrow rules, because you (<strong className="text-white">Truck Driver</strong>) are cancelling your accepted load before pickup, you forfeit your{' '}
                <strong className="text-amber-300 font-mono">{formatCurrency(driverBond, currency)} commitment bond</strong>, and the entire escrow pool of{' '}
                <strong className="text-emerald-400 font-mono">{formatCurrency(totalEscrowPool, currency)}</strong> will be{' '}
                <strong className="text-emerald-300">transferred directly to the Goods Owner</strong> as compensation for breach of load commitment and cargo delay.
              </>
            )}
          </p>

          {/* Breakdown Pills */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-center">
            <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Shipper Diesel</span>
              <span className="text-xs font-bold text-white font-mono">{formatCurrency(fuelDeposit, currency)}</span>
            </div>
            <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Driver Bond</span>
              <span className="text-xs font-bold text-white font-mono">{formatCurrency(driverBond, currency)}</span>
            </div>
            <div className="bg-emerald-950/60 p-2 rounded-lg border border-emerald-500/40">
              <span className="text-[10px] text-emerald-400 block uppercase font-bold">Payout to {recipient}</span>
              <span className="text-xs font-black text-emerald-300 font-mono">{formatCurrency(totalEscrowPool, currency)}</span>
            </div>
          </div>
        </div>

        {/* Cancellation Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Reason for Cancellation
            </label>
            <div className="space-y-1.5">
              {defaultReasons.map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                    selectedReason === reason
                      ? 'bg-slate-800 border-blue-500 text-white'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="cancel_reason"
                    checked={selectedReason === reason}
                    onChange={() => setSelectedReason(reason)}
                    className="text-blue-500 focus:ring-0"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Additional Details / Incident Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="e.g. Broke down at Mile 14 on highway A109; tow truck en route..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Acknowledgement Checkbox */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={hasAcknowledgedPenalty}
                onChange={(e) => setHasAcknowledgedPenalty(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 text-red-500 focus:ring-0"
              />
              <div>
                <span className="font-bold text-white">
                  I understand this action is irreversible and the escrow funds will transfer to {recipient}.
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  The {formatCurrency(totalEscrowPool, currency)} balance will be immediately disbursed to {recipient}'s account wallet as guaranteed settlement.
                </p>
              </div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
            >
              Keep Load (Nevermind)
            </button>
            <button
              type="submit"
              disabled={!hasAcknowledgedPenalty}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                hasAcknowledgedPenalty
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 active:scale-[0.98]'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>Confirm Cancellation &amp; Transfer {formatCurrency(totalEscrowPool, currency)}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
