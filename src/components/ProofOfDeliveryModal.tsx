import React, { useRef, useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  PenTool, 
  RotateCcw, 
  ShieldCheck, 
  DollarSign, 
  PackageCheck,
  Camera
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ProofOfDelivery } from '../types/logistics';
import { CurrencyConfig } from '../types/settings';
import { formatCurrency } from '../services/routing';

interface ProofOfDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  finalAmount: number;
  driverName: string;
  currency?: CurrencyConfig;
  onConfirmDelivery: (pod: ProofOfDelivery) => void;
}

export const ProofOfDeliveryModal: React.FC<ProofOfDeliveryModalProps> = ({
  isOpen,
  onClose,
  finalAmount,
  driverName,
  currency,
  onConfirmDelivery,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [recipientName, setRecipientName] = useState('Amanda Chen (Receiving Clerk)');
  const [condition, setCondition] = useState<'EXCELLENT' | 'GOOD' | 'MINOR_ISSUES'>('EXCELLENT');
  const [notes, setNotes] = useState('All seal tags intact. CNC milling station offloaded and inspected without scratches.');

  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#f59e0b';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasSignature(true);
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSubmit = () => {
    const canvas = canvasRef.current;
    const signatureData = canvas ? canvas.toDataURL() : '';

    const pod: ProofOfDelivery = {
      recipientName,
      signatureDataUrl: signatureData,
      photoUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80',
      notes,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      cargoCondition: condition,
    };

    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.5 },
      colors: ['#10b981', '#f59e0b', '#3b82f6'],
    });

    onConfirmDelivery(pod);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <PackageCheck className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-white text-base">Proof of Delivery (POD) & Final Settlement</h3>
              <p className="text-xs text-slate-400">Inspect cargo and release final phase payment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Final Payout Banner */}
          <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <div>
                <span className="text-xs font-bold text-emerald-300">Phase 2 Final Payout</span>
                <p className="text-[11px] text-slate-400">Releases remaining 60% balance to {driverName}</p>
              </div>
            </div>
            <span className="text-xl font-black text-white">{formatCurrency(finalAmount, currency)}</span>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
              Receiving Signer Name
            </label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
              Cargo Condition Inspection
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['EXCELLENT', 'GOOD', 'MINOR_ISSUES'] as const).map((cond) => (
                <button
                  key={cond}
                  type="button"
                  onClick={() => setCondition(cond)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition text-center ${
                    condition === cond
                      ? cond === 'EXCELLENT'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500'
                        : cond === 'GOOD'
                        ? 'bg-blue-500/20 text-blue-400 border-blue-500'
                        : 'bg-amber-500/20 text-amber-400 border-amber-500'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {cond.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Digital Signature Pad */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase text-slate-400 flex items-center gap-1.5">
                <PenTool className="w-3.5 h-3.5 text-amber-400" />
                <span>Recipient Digital Signature</span>
              </label>
              <button
                type="button"
                onClick={clearCanvas}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Clear
              </button>
            </div>
            <div className="border border-slate-700 rounded-xl overflow-hidden bg-slate-950 relative">
              <canvas
                ref={canvasRef}
                width={460}
                height={140}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full cursor-crosshair touch-none"
              />
              {!hasSignature && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-xs text-slate-600">
                  Draw signature with finger or mouse here
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
              Delivery Notes & Bill of Lading Reference
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="p-5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Sign POD & Release {formatCurrency(finalAmount, currency)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
