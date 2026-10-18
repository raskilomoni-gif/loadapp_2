import { useEffect, useState } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

declare global {
  interface Window {
    __pwaPrompt?: BeforeInstallPromptEvent | null;
  }
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    typeof window !== 'undefined' ? window.__pwaPrompt || null : null
  );
  const [isInstalled, setIsInstalled] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    // Detect standalone mode (already installed app)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const ua = window.navigator.userAgent.toLowerCase();
    const isAndroidDevice = /android/.test(ua);
    const isIOSDevice = /iphone|ipad|ipod/.test(ua);
    const isDesktopDevice = !isAndroidDevice && !isIOSDevice;

    setIsAndroid(isAndroidDevice);
    setIsIOS(isIOSDevice);
    setIsDesktop(isDesktopDevice);

    // If already captured globally
    if (window.__pwaPrompt) {
      setDeferredPrompt(window.__pwaPrompt);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      window.__pwaPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
      console.log('PWA beforeinstallprompt captured!');
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      window.__pwaPrompt = null;
      setDeferredPrompt(null);
      console.log('PWA app installed!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async (): Promise<boolean> => {
    const promptEvent = deferredPrompt || window.__pwaPrompt;
    if (!promptEvent) {
      console.warn('Install prompt not available yet');
      return false;
    }

    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        window.__pwaPrompt = null;
        setDeferredPrompt(null);
        return true;
      }
    } catch (err) {
      console.error('Install error:', err);
    }
    return false;
  };

  return {
    isInstallable: !!(deferredPrompt || (typeof window !== 'undefined' && window.__pwaPrompt)),
    isInstalled,
    isAndroid,
    isIOS,
    isDesktop,
    install,
    deferredPrompt: deferredPrompt || (typeof window !== 'undefined' ? window.__pwaPrompt : null),
  };
}
