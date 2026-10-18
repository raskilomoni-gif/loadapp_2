import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register PWA service worker immediately for offline capability & installability
if ('serviceWorker' in navigator) {
  registerSW({
    immediate: true,
    onNeedRefresh() {
      console.log('HaulFlow updated in background.');
    },
    onOfflineReady() {
      console.log('HaulFlow is offline-ready.');
    },
  });
}

createRoot(document.getElementById('root')!).render(<App />);
