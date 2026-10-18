import React from 'react';
import { WifiOff, ShieldCheck } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-2xl bg-amber-500/95 text-slate-950 font-bold px-4 py-2.5 shadow-2xl backdrop-blur-md border border-amber-300 animate-pulse text-xs">
      <WifiOff className="w-4 h-4 text-slate-950" />
      <div>
        <span>Offline Mode Active</span>
        <span className="block font-normal text-[11px] text-slate-900">
          Running from local cache. Cached trips & maps remain accessible.
        </span>
      </div>
    </div>
  );
};
