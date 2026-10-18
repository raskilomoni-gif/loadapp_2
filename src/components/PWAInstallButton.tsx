import React from 'react';
import { Download, Smartphone, Monitor, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  onOpenModal: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ onOpenModal }) => {
  const { isInstalled, isInstallable, install } = usePWAInstall();

  const handleClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      onOpenModal();
    }
  };

  if (isInstalled) {
    return (
      <button
        onClick={onOpenModal}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-900/40 transition"
        title="App Installed & Offline Ready"
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Installed &amp; Offline</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/40 transition shadow-sm hover:border-amber-500 active:scale-[0.98]"
      title="Install on Desktop or Android"
    >
      <Download className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">Install App</span>
      <span className="sm:hidden">Install</span>
    </button>
  );
};
