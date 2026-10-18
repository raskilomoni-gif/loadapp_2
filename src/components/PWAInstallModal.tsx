import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Monitor, 
  Smartphone, 
  CheckCircle2, 
  Sparkles, 
  Terminal, 
  Copy, 
  Check, 
  WifiOff, 
  ShieldCheck, 
  ExternalLink,
  Laptop,
  ArrowRight,
  Code2,
  CornerDownRight,
  MousePointerClick
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'desktop' | 'android' | 'local_dev'>('desktop');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { isInstallable, isInstalled, install } = usePWAInstall();

  if (!isOpen) return null;

  // Check if current page is inside an iframe
  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;
  const devUrl = 'https://ais-dev-lampjblsh25bjdxm5zthk2-63179741681.europe-west2.run.app';

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      onClose();
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const localDevCommands = `# 1. Clone or download your project folder to your laptop
git clone <your-repository-url>
cd haulflow

# 2. Install all dependencies
npm install

# 3. Start local development server on your laptop
npm run dev

# 4. Open http://localhost:3000 in your browser!`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-450 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
              <Laptop className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Install HaulFlow on Your Laptop</h3>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                  OFFLINE CAPABLE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Installs as a native desktop application with full offline support
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Platform Selector Tabs */}
        <div className="px-6 pt-4 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('desktop')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold transition ${
              activeTab === 'desktop'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>Laptop Install (PWA App)</span>
          </button>

          <button
            onClick={() => setActiveTab('android')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold transition ${
              activeTab === 'android'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Android Phone</span>
          </button>

          <button
            onClick={() => setActiveTab('local_dev')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold transition ${
              activeTab === 'local_dev'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Source Code (Local Dev)</span>
          </button>
        </div>

        {/* Tab 1: Laptop Installation Guide */}
        {activeTab === 'desktop' && (
          <div className="p-6 space-y-5">
            {/* If inside iframe hint */}
            {isInIframe && (
              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <span className="font-bold text-amber-300 block">Notice: You are in the Preview Frame</span>
                  <p className="text-slate-300 text-[11px]">
                    Web browsers block app installation from inside nested preview boxes. Open this app in a full browser tab to install it with 1 click!
                  </p>
                </div>
                <a
                  href={devUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-450 text-slate-950 font-bold whitespace-nowrap transition flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  <span>Open in Full Tab</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {/* Direct Trigger Button */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-950 to-slate-950 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-white text-sm">Install HaulFlow on This Laptop</h4>
                  {isInstalled && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                      ALREADY INSTALLED
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  Adds HaulFlow to your Windows Start Menu, macOS Launchpad, and Desktop.
                </p>
              </div>

              <button
                onClick={handleInstallClick}
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-black text-xs bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-xl shadow-amber-500/25 active:scale-[0.98] transition flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>{isInstallable ? 'Install on Laptop Now' : 'Click to Trigger Install'}</span>
              </button>
            </div>

            {/* Visual Browser Address Bar Diagram */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MousePointerClick className="w-4 h-4" />
                  Where to Click in Google Chrome or Microsoft Edge:
                </span>
              </div>

              {/* Mock Address Bar */}
              <div className="bg-slate-900 rounded-xl p-2.5 border border-slate-700/80 flex items-center justify-between text-xs font-mono text-slate-400">
                <div className="flex items-center gap-2 truncate">
                  <span className="text-emerald-400 text-xs">🔒</span>
                  <span className="truncate text-slate-300 text-[11px]">ais-dev-...run.app</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Highlighted Install Icon */}
                  <div className="flex items-center gap-1 bg-amber-500/20 border-2 border-amber-400 text-amber-300 px-2 py-1 rounded-lg font-bold text-[11px] animate-pulse">
                    <span>⊕</span>
                    <span className="font-sans font-black">Install</span>
                  </div>
                  <span className="text-slate-500">★</span>
                  <span className="text-slate-300 font-bold px-1">⋮</span>
                </div>
              </div>

              {/* Instructions explaining the 2 easy ways */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                  <strong className="text-white block font-semibold flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold flex items-center justify-center">A</span>
                    Address Bar Install Icon:
                  </strong>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Look at the right side of your browser's address bar (where you type URLs) and click the <strong>⊕ (Install)</strong> icon.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                  <strong className="text-white block font-semibold flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold flex items-center justify-center">B</span>
                    Chrome / Edge 3-Dot Menu:
                  </strong>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Click the <strong>3 dots (⋮)</strong> in the top-right corner of Chrome &gt; select <strong>"Install HaulFlow..."</strong> (or "Save and share" &gt; "Install").
                  </p>
                </div>
              </div>
            </div>

            {/* Offline highlights */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-3 text-xs text-slate-400">
              <WifiOff className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>
                <strong>Offline Persistence:</strong> Once installed, HaulFlow launches in its own dedicated desktop window and works completely offline without an active internet connection.
              </span>
            </div>
          </div>
        )}

        {/* Tab 2: Android Phone */}
        {activeTab === 'android' && (
          <div className="p-6 space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-center gap-3">
              <Smartphone className="w-6 h-6 text-emerald-400" />
              <div>
                <h4 className="text-xs font-bold text-emerald-300">
                  Instant Android Installation (No Play Store needed)
                </h4>
                <p className="text-[11px] text-slate-400">
                  Android Chrome compiles this into a native WebAPK with full screen and offline capability.
                </p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                <span className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 font-bold flex items-center justify-center shrink-0">1</span>
                <div>
                  <h5 className="font-bold text-white">Open in Chrome on Android</h5>
                  <p className="text-slate-400 mt-0.5 text-[11px]">Visit <span className="text-amber-400 font-mono">{devUrl}</span> on your Android phone's Google Chrome or Samsung Internet.</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                <span className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 font-bold flex items-center justify-center shrink-0">2</span>
                <div>
                  <h5 className="font-bold text-white">Tap Chrome Menu (Three Dots ⋮)</h5>
                  <p className="text-slate-400 mt-0.5 text-[11px]">Select <strong>"Install App"</strong> (or "Add to Home screen").</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                <span className="w-6 h-6 rounded-lg bg-emerald-500 text-slate-950 font-bold flex items-center justify-center shrink-0">3</span>
                <div>
                  <h5 className="font-bold text-white">Tap "Install"</h5>
                  <p className="text-slate-400 mt-0.5 text-[11px]">Android will install the HaulFlow icon to your home screen and app drawer.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Local Dev with Node.js */}
        {activeTab === 'local_dev' && (
          <div className="p-6 space-y-4">
            <div>
              <h4 className="text-sm font-bold text-white">Run Full Source Code on Laptop with VS Code / Node.js</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                If you prefer to download the codebase to develop locally on your laptop:
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Terminal Commands</span>
                <button
                  onClick={() => copyToClipboard(localDevCommands, 'localdev')}
                  className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-bold"
                >
                  {copiedCode === 'localdev' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode === 'localdev' ? 'Copied!' : 'Copy Commands'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                {localDevCommands}
              </pre>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>PWA Protocol Active: Service Worker, Offline Cache, Manifest V2</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
