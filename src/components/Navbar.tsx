import React from 'react';
import { 
  Truck, 
  ShieldCheck, 
  Package, 
  Fuel, 
  Wallet, 
  Plus, 
  Layers, 
  User, 
  Radio,
  ExternalLink,
  Laptop,
  Settings
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { formatCurrency } from '../services/routing';
import { CurrencyConfig } from '../types/settings';

interface NavbarProps {
  currentRole: 'shipper' | 'trucker';
  onSelectRole: (role: 'shipper' | 'trucker') => void;
  onOpenCreateModal: () => void;
  onOpenInstallModal: () => void;
  onOpenSettings: () => void;
  currency: CurrencyConfig;
  activeTripsCount: number;
  driverWalletBalance: number;
  driverFuelBalance: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onSelectRole,
  onOpenCreateModal,
  onOpenInstallModal,
  onOpenSettings,
  currency,
  activeTripsCount,
  driverWalletBalance,
  driverFuelBalance,
}) => {
  const devUrl = 'https://ais-dev-lampjblsh25bjdxm5zthk2-63179741681.europe-west2.run.app';
  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-450 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Truck className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-tight text-white">HaulFlow</span>
              <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                ESCROW SECURED
              </span>
            </div>
            <p className="text-[10px] text-slate-400 -mt-0.5 hidden sm:block">
              On-Demand Freight Matching & Dual-Authorization Fuel Escrow
            </p>
          </div>
        </div>

        {/* Center: Role Switcher */}
        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => onSelectRole('shipper')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              currentRole === 'shipper'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cargo Owner</span>
            <span className="sm:hidden">Shipper</span>
          </button>
          <button
            onClick={() => onSelectRole('trucker')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              currentRole === 'trucker'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Truck Driver</span>
            <span className="sm:hidden">Driver</span>
          </button>
        </div>

        {/* Right side items */}
        <div className="flex items-center gap-2">
          {/* Direct Open in New Tab Button if in preview frame */}
          {isInIframe && (
            <a
              href={devUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 transition active:scale-[0.98]"
              title="Open full application in a new browser tab to install on your laptop"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Open in Tab</span>
              <span className="md:hidden">Tab</span>
            </a>
          )}

          {/* PWA Desktop & Android Install Button */}
          <PWAInstallButton onOpenModal={onOpenInstallModal} />

          {/* Driver balances indicator if in driver mode */}
          {currentRole === 'trucker' ? (
            <div className="hidden lg:flex items-center gap-2 text-xs">
              <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-2">
                <Fuel className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-slate-400 text-[11px]">Fuel:</span>
                <span className="font-bold text-white">{formatCurrency(driverFuelBalance, currency)}</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-2">
                <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-400 text-[11px]">Earned:</span>
                <span className="font-bold text-white">{formatCurrency(driverWalletBalance, currency)}</span>
              </div>
            </div>
          ) : (
            <button
              onClick={onOpenCreateModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 transition"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Book Haul</span>
            </button>
          )}

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 transition active:scale-95 cursor-pointer"
            title="Settings: Company, Tax (TIN/VAT), Banking & Currency"
          >
            <Settings className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </div>
    </header>
  );
};
