import React, { useState, useEffect } from 'react';
import { CircleCheck as CheckCircle, Clock, DollarSign, FileCheck, ShieldCheck, Lock, CreditCard as Edit3, Check, CircleAlert as AlertCircle, Percent, Fuel, ArrowRight, Sparkles, Tag } from 'lucide-react';
import confetti from 'canvas-confetti';
import { PaymentPlan, AdvanceCalculationMode } from '../types/logistics';
import { CurrencyConfig } from '../types/settings';
import { formatCurrency } from '../services/routing';

interface PaymentPlanCardProps {
  payments: PaymentPlan;
  tripStatus: string;
  currency?: CurrencyConfig;
  currentRole?: 'shipper' | 'trucker' | 'both';
  onReleaseAdvance: () => void;
  onReleaseFinal: () => void;
  isShipper: boolean;
  onUpdateAdvanceTerms?: (terms: {
    mode: AdvanceCalculationMode;
    grossAmount: number;
    netAmount: number;
    percentage: number;
    deductDiesel: boolean;
    dieselDeducted: number;
  }) => void;
  onTruckerAcceptAdvance?: () => void;
}

export const PaymentPlanCard: React.FC<PaymentPlanCardProps> = ({
  payments,
  tripStatus,
  currency,
  currentRole = 'shipper',
  onReleaseAdvance,
  onReleaseFinal,
  isShipper,
  onUpdateAdvanceTerms,
  onTruckerAcceptAdvance,
}) => {
  const isAdvanceReleased = payments.advancePayment.status === 'RELEASED';
  const isFinalReleased = payments.finalPayment.status === 'RELEASED';

  const advance = payments.advancePayment;
  const isAcceptedByTrucker = !!advance.acceptedByTrucker;

  // Editing state for goods owner
  const currencyRate = currency?.rateToUsd || 1.0;
  const totalFreightInCurrency = Math.round(payments.totalFreightCost * currencyRate);

  const [isEditing, setIsEditing] = useState(false);
  const [editMode, setEditMode] = useState<AdvanceCalculationMode>(advance.mode || 'percentage');
  const [editPercentage, setEditPercentage] = useState<number>(advance.percentage || 40);
  // Store custom amount in the active currency as a string (allows empty string so user can clear it!)
  const [editAmountInput, setEditAmountInput] = useState<string>(() => {
    const grossUsd = advance.grossAmount || advance.amount || Math.round(payments.totalFreightCost * 0.4);
    return String(Math.round(grossUsd * (currency?.rateToUsd || 1.0)));
  });
  const [editDeductDiesel, setEditDeductDiesel] = useState<boolean>(
    advance.deductDiesel !== undefined ? advance.deductDiesel : true
  );

  // Sync internal edit state whenever payments prop changes (e.g. trip switches or updates)
  useEffect(() => {
    setEditMode(advance.mode || 'percentage');
    setEditPercentage(advance.percentage || 40);
    const grossUsd = advance.grossAmount || advance.amount || Math.round(payments.totalFreightCost * ((advance.percentage || 40) / 100));
    setEditAmountInput(String(Math.round(grossUsd * currencyRate)));
    setEditDeductDiesel(advance.deductDiesel !== undefined ? advance.deductDiesel : true);
  }, [advance, payments.totalFreightCost, currencyRate]);

  const handleOpenEditor = () => {
    // When opening editor, refresh strictly from current advance prop values
    setEditMode(advance.mode || 'percentage');
    setEditPercentage(advance.percentage || 40);
    const grossUsd = advance.grossAmount || advance.amount || Math.round(payments.totalFreightCost * ((advance.percentage || 40) / 100));
    setEditAmountInput(String(Math.round(grossUsd * currencyRate)));
    setEditDeductDiesel(advance.deductDiesel !== undefined ? advance.deductDiesel : true);
    setIsEditing(!isEditing);
  };

  const firstDieselAmount = payments.fuelEscrowDeposit || 0;

  // Parse custom amount from active currency
  const parsedEditLocal = parseFloat(editAmountInput);
  const editGrossUsd = !isNaN(parsedEditLocal) && parsedEditLocal > 0
    ? Math.min(payments.totalFreightCost, Math.round(parsedEditLocal / currencyRate))
    : 0;

  const handleSwitchToPercentage = () => {
    setEditMode('percentage');
    if (payments.totalFreightCost > 0 && editGrossUsd > 0) {
      const derivedPct = Math.min(90, Math.max(5, Math.round((editGrossUsd / payments.totalFreightCost) * 100)));
      setEditPercentage(derivedPct);
    }
  };

  const handleSwitchToFixedAmount = () => {
    setEditMode('fixed_amount');
    if (!editAmountInput || editAmountInput === '0') {
      const defaultLocal = Math.round(totalFreightInCurrency * (editPercentage / 100));
      setEditAmountInput(String(defaultLocal));
    }
  };

  // Real-time calculation while editing
  const calcGross = editMode === 'percentage'
    ? Math.round(payments.totalFreightCost * (editPercentage / 100))
    : (editGrossUsd > 0 ? editGrossUsd : (editAmountInput === '' ? 0 : Math.round(payments.totalFreightCost * 0.4)));
  const calcDieselDeducted = editDeductDiesel ? firstDieselAmount : 0;
  const calcNet = Math.max(0, calcGross - calcDieselDeducted);
  const calcEffPct = payments.totalFreightCost > 0 && calcGross > 0
    ? Math.round((calcGross / payments.totalFreightCost) * 100)
    : 0;
  const calcFinal = Math.max(0, payments.totalFreightCost - calcGross);

  // Existing display values
  const currentGross = advance.grossAmount || advance.amount || Math.round(payments.totalFreightCost * 0.4);
  const currentDieselDeducted = advance.dieselDeducted !== undefined 
    ? advance.dieselDeducted 
    : (advance.deductDiesel !== false ? firstDieselAmount : 0);
  const currentNet = advance.amount;

  const canReleaseAdvance = 
    isShipper && 
    !isAdvanceReleased && 
    (tripStatus === 'AT_PICKUP' || tripStatus === 'IN_TRANSIT' || tripStatus === 'DELIVERED' || tripStatus === 'COMPLETED');

  const canReleaseFinal = 
    isShipper && 
    isAdvanceReleased && 
    !isFinalReleased && 
    (tripStatus === 'DELIVERED' || tripStatus === 'COMPLETED');

  const handleSaveTerms = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateAdvanceTerms) {
      onUpdateAdvanceTerms({
        mode: editMode,
        grossAmount: calcGross,
        netAmount: calcNet,
        percentage: calcEffPct,
        deductDiesel: editDeductDiesel,
        dieselDeducted: calcDieselDeducted,
      });
    }
    setIsEditing(false);
  };

  const handleTruckerAccept = () => {
    if (onTruckerAcceptAdvance) {
      onTruckerAcceptAdvance();
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#10b981', '#3b82f6', '#f59e0b'],
      });
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg relative overflow-hidden">
      {/* Background glow accents */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-base">Two-Phase Freight Payment Plan</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-950/80 text-blue-300 border border-blue-500/40">
                Customizable Milestone Escrow
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Advance upon verified loading (minus diesel deposit) & Final settlement upon verified delivery
            </p>
          </div>
        </div>

        <div className="flex items-center sm:items-end justify-between sm:justify-start gap-4">
          <div className="text-left sm:text-right">
            <span className="text-xs text-slate-400 block font-medium">Total Freight Value</span>
            <span className="text-xl font-black text-white">
              {formatCurrency(payments.totalFreightCost, currency)}
            </span>
          </div>

          {isShipper && !isAdvanceReleased && (
            <button
              onClick={handleOpenEditor}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 transition shadow-sm"
              title="Edit advance loading amount or percentage"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Close Editor' : 'Adjust Advance'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Inline Editor for Goods Owner */}
      {isEditing && isShipper && (
        <form onSubmit={handleSaveTerms} className="mt-4 p-4 rounded-xl bg-slate-950 border border-amber-500/40 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                Configure Phase 1 Advance Loading Terms (Goods Owner)
              </h4>
            </div>
            <span className="text-[11px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded font-mono">
              {editMode === 'fixed_amount' ? 'Fixed Exact Sum Mode' : 'Percentage Allocation Mode'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Mode Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1.5">
                Calculation Method
              </label>
              <div className="grid grid-cols-2 gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={handleSwitchToPercentage}
                  className={`py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1 ${
                    editMode === 'percentage'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Percent className="w-3 h-3" />
                  <span>By Percentage</span>
                </button>
                <button
                  type="button"
                  onClick={handleSwitchToFixedAmount}
                  className={`py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1 ${
                    editMode === 'fixed_amount'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <DollarSign className="w-3 h-3" />
                  <span>By Exact Amount</span>
                </button>
              </div>
            </div>

            {/* Input Value */}
            <div>
              {editMode === 'percentage' ? (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-semibold text-slate-400 uppercase">
                      Advance Percentage
                    </label>
                    <span className="text-xs font-bold text-white font-mono">{editPercentage}% of Freight</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {[20, 30, 40, 50].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setEditPercentage(pct)}
                        className={`flex-1 py-1 rounded-lg text-xs font-bold transition ${
                          editPercentage === pct
                            ? 'bg-blue-500 text-white shadow-sm'
                            : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                    <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg text-xs">
                      <input
                        type="number"
                        value={editPercentage}
                        onChange={(e) => setEditPercentage(Math.min(90, Math.max(5, Number(e.target.value))))}
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
                    <label className="text-[11px] font-semibold text-slate-300 uppercase">
                      Fixed Gross Advance Sum ({currency?.code || 'USD'})
                    </label>
                    <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                      {editAmountInput ? `~${calcEffPct}% of freight` : 'Fixed Cash Agreement'}
                    </span>
                  </div>

                  {/* Clean Input Group without overlapping prefix */}
                  <div className="flex items-center rounded-xl bg-slate-900 border border-slate-700 overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition">
                    <div className="px-3.5 py-2 bg-slate-800 text-xs font-bold text-amber-400 border-r border-slate-700 select-none flex items-center">
                      {currency?.symbol || '$'}
                    </div>
                    <input
                      type="number"
                      value={editAmountInput}
                      onChange={(e) => setEditAmountInput(e.target.value)}
                      placeholder={`e.g. ${Math.round(totalFreightInCurrency * 0.4)}`}
                      min="0"
                      max={totalFreightInCurrency}
                      className="flex-1 bg-transparent px-3 py-2 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none"
                    />
                    <div className="px-3 py-2 bg-slate-800/60 text-[11px] font-mono font-semibold text-slate-400 border-l border-slate-700 select-none">
                      {currency?.code || 'USD'}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Max Total: <strong className="text-slate-300 font-mono">{formatCurrency(payments.totalFreightCost, currency)}</strong></span>
                    {editAmountInput && (
                      <span>Gross (base): <strong className="text-emerald-400 font-mono">{formatCurrency(calcGross, currency)}</strong></span>
                    )}
                  </div>

                  {/* Quick amount presets */}
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Presets:</span>
                    {[0.25, 0.35, 0.40, 0.50].map((ratio) => {
                      const presetLocal = Math.round(totalFreightInCurrency * ratio);
                      const isSelected = parsedEditLocal === presetLocal;
                      return (
                        <button
                          key={ratio}
                          type="button"
                          onClick={() => setEditAmountInput(String(presetLocal))}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono transition ${
                            isSelected
                              ? 'bg-blue-600 text-white font-bold'
                              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                          }`}
                        >
                          {(currency?.symbol || '$')}{new Intl.NumberFormat('en-US').format(presetLocal)} ({Math.round(ratio * 100)}%)
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Condition: Minus First Diesel Amount */}
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={editDeductDiesel}
                onChange={(e) => setEditDeductDiesel(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 text-blue-500 focus:ring-0"
              />
              <div>
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Fuel className="w-3.5 h-3.5 text-amber-400" />
                  Minus First Diesel Amount ({formatCurrency(firstDieselAmount, currency)})
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  The initial diesel guarantee ({formatCurrency(firstDieselAmount, currency)}) was already deposited into escrow for truck mobilization. Checking this deducts it from the Phase 1 loading advance so the driver receives net funds at the dock.
                </p>
              </div>
            </label>
          </div>

          {/* Calculation Live Preview */}
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">
                {editMode === 'fixed_amount' ? 'Fixed Gross Advance' : 'Gross Advance (% Mode)'}
              </span>
              <span className="font-bold text-white font-mono">
                {formatCurrency(calcGross, currency)} ({calcEffPct}% of freight)
              </span>
            </div>
            <div>
              <span className="text-[10px] text-amber-400 uppercase block">First Diesel Offset</span>
              <span className="font-bold text-amber-300 font-mono">
                {editDeductDiesel ? `-${formatCurrency(firstDieselAmount, currency)}` : `None (${formatCurrency(0, currency)})`}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-emerald-400 uppercase block">Net Phase 1 Loading Payout</span>
              <span className="font-black text-emerald-300 font-mono text-sm">{formatCurrency(calcNet, currency)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-[11px] text-amber-300 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Saving will propose these {editMode === 'fixed_amount' ? 'fixed sum' : 'percentage'} terms to the carrier.</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/30 transition active:scale-95"
              >
                Propose Advance Terms
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Trucker Acceptance Action Banner */}
      {!isAdvanceReleased && (
        <div className={`mt-4 p-4 rounded-xl border transition-all ${
          isAcceptedByTrucker 
            ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300' 
            : 'bg-amber-950/30 border-amber-500/50 text-amber-200'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start md:items-center gap-3">
              <div className={`p-2 rounded-xl shrink-0 ${
                isAcceptedByTrucker ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
              }`}>
                {isAcceptedByTrucker ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Phase 1 Advance Agreement Status
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    isAcceptedByTrucker
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}>
                    {isAcceptedByTrucker ? 'Accepted by Trucker' : 'Awaiting Trucker Acceptance'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  {isAcceptedByTrucker ? (
                    <>
                      Carrier accepted the Phase 1 Advance terms ({formatCurrency(advance.amount, currency)} net, minus {formatCurrency(currentDieselDeducted, currency)} first diesel). Release active upon loading verification.
                    </>
                  ) : advance.mode === 'fixed_amount' ? (
                    <>
                      Goods owner proposed: <strong className="text-white">{formatCurrency(currentGross, currency)} fixed gross sum</strong> (~{advance.percentage}% equivalent){' '}
                      {currentDieselDeducted > 0 && (
                        <span>minus <strong className="text-amber-300">{formatCurrency(currentDieselDeducted, currency)} first diesel</strong></span>
                      )}{' '}
                      = <strong className="text-emerald-400">{formatCurrency(advance.amount, currency)} net</strong> loading payment.
                    </>
                  ) : (
                    <>
                      Goods owner proposed: <strong className="text-white">{advance.percentage}% advance</strong> ({formatCurrency(currentGross, currency)} gross){' '}
                      {currentDieselDeducted > 0 && (
                        <span>minus <strong className="text-amber-300">{formatCurrency(currentDieselDeducted, currency)} first diesel</strong></span>
                      )}{' '}
                      = <strong className="text-emerald-400">{formatCurrency(advance.amount, currency)} net</strong> loading payment.
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Accept Button for Trucker */}
            {!isAcceptedByTrucker && (!isShipper || currentRole === 'both') && (
              <button
                type="button"
                onClick={handleTruckerAccept}
                className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Accept Phase 1 Advance Terms</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Two Phases Cards */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Phase 1: Advance Loading Payment */}
        <div className={`p-4 rounded-xl border transition-all ${
          isAdvanceReleased 
            ? 'bg-emerald-950/20 border-emerald-500/30' 
            : 'bg-slate-950/60 border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase">
                Phase 1
              </span>
              <span className="text-sm font-bold text-white">Advance Loading Payment</span>
            </div>
            {isAdvanceReleased ? (
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
                <CheckCircle className="w-3.5 h-3.5" /> Disbursed
              </span>
            ) : isAcceptedByTrucker ? (
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
                <Check className="w-3.5 h-3.5" /> Accepted & In Escrow
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-semibold text-amber-400">
                <Clock className="w-3.5 h-3.5" /> Pending Acceptance
              </span>
            )}
          </div>

          {/* Amount Display with Breakdown */}
          <div className="my-2 p-3 rounded-lg bg-slate-900/90 border border-slate-800/80">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-black text-white">
                  {formatCurrency(payments.advancePayment.amount, currency)}
                </span>
                <span className="text-xs text-emerald-400 font-semibold ml-2">Net at Loading</span>
              </div>
              <div className="text-right">
                {advance.mode === 'fixed_amount' ? (
                  <>
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">
                      Fixed Sum
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
                      ~{payments.advancePayment.percentage}% of freight
                    </span>
                  </>
                ) : (
                  <>
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                      {payments.advancePayment.percentage}% Allocation
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>Gross Advance: <strong className="text-slate-300">{formatCurrency(currentGross, currency)}</strong> {advance.mode === 'fixed_amount' ? '(Fixed)' : ''}</span>
              <span>Less First Diesel: <strong className="text-amber-400">-{formatCurrency(currentDieselDeducted, currency)}</strong></span>
            </div>
          </div>

          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            Triggered once cargo is inspected, securely loaded onto the trailer at dock, and the Bill of Lading is countersigned.
          </p>

          {isShipper && (
            <button
              onClick={onReleaseAdvance}
              disabled={!canReleaseAdvance}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                isAdvanceReleased
                  ? 'bg-emerald-900/30 text-emerald-300 border border-emerald-800 cursor-default'
                  : canReleaseAdvance
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 active:scale-[0.98]'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isAdvanceReleased ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Phase 1 Disbursed ({formatCurrency(payments.advancePayment.amount, currency)})</span>
                </>
              ) : (
                <>
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>Release Advance Payment (Loading Verified)</span>
                </>
              )}
            </button>
          )}

          {!isShipper && (
            <div className="text-xs text-slate-400 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
              <span>Driver Payout Status:</span>
              <strong className={isAdvanceReleased ? 'text-emerald-400' : isAcceptedByTrucker ? 'text-blue-300' : 'text-amber-400'}>
                {isAdvanceReleased 
                  ? 'Credited to driver balance' 
                  : isAcceptedByTrucker 
                  ? 'Ready for release once loaded at dock' 
                  : 'Awaiting your acceptance'}
              </strong>
            </div>
          )}
        </div>

        {/* Phase 2: Final Payment */}
        <div className={`p-4 rounded-xl border transition-all ${
          isFinalReleased 
            ? 'bg-emerald-950/20 border-emerald-500/30' 
            : 'bg-slate-950/60 border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                Phase 2
              </span>
              <span className="text-sm font-bold text-white">Final Settlement Payment</span>
            </div>
            {isFinalReleased ? (
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
                <CheckCircle className="w-3.5 h-3.5" /> Settled
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-semibold text-slate-400">
                <Lock className="w-3.5 h-3.5" /> Delivery Lock
              </span>
            )}
          </div>

          <div className="my-2 p-3 rounded-lg bg-slate-900/90 border border-slate-800/80">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-black text-white">
                  {formatCurrency(payments.finalPayment.amount, currency)}
                </span>
                <span className="text-xs text-amber-400 font-semibold ml-2">Final Balance</span>
              </div>
              <div className="text-right">
                {advance.mode === 'fixed_amount' ? (
                  <>
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      Fixed Balance
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
                      {payments.finalPayment.percentage}% of freight
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-slate-400 font-mono">
                    {payments.finalPayment.percentage}% balance
                  </span>
                )}
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
              Total Freight ({formatCurrency(payments.totalFreightCost, currency)}) minus Gross Advance ({formatCurrency(currentGross, currency)})
            </div>
          </div>

          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            Released to the trucker only after cargo arrives safely at destination and recipient signs Proof of Delivery.
          </p>

          {isShipper && (
            <button
              onClick={onReleaseFinal}
              disabled={!canReleaseFinal}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                isFinalReleased
                  ? 'bg-emerald-900/30 text-emerald-300 border border-emerald-800 cursor-default'
                  : canReleaseFinal
                  ? 'bg-amber-500 hover:bg-amber-450 text-slate-950 shadow-lg shadow-amber-500/20 active:scale-[0.98]'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isFinalReleased ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Phase 2 Settled ({formatCurrency(payments.finalPayment.amount, currency)})</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Inspect Goods & Release Final Balance</span>
                </>
              )}
            </button>
          )}

          {!isShipper && (
            <div className="text-xs text-slate-400 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
              <span>Final Settlement Status:</span>
              <strong className={isFinalReleased ? 'text-emerald-400' : 'text-slate-300'}>
                {isFinalReleased ? 'Paid out in full' : 'Releases upon receiver signature'}
              </strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
