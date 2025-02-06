import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { checkBrowserSupport, getModelState, ModelState } from '../utils/localModel';

interface OfflineState {
  isOfflineModeEnabled: boolean;
  isPWAInstalled: boolean;
  isModelDownloaded: boolean;
  downloadProgress: number;
  browserSupported: boolean;
  setOfflineMode: (enabled: boolean) => void;
  setPWAInstalled: (installed: boolean) => void;
  setModelDownloaded: (downloaded: boolean) => void;
  setDownloadProgress: (progress: number) => void;
  checkPWAStatus: () => void;
  syncModelState: () => void;
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set, get) => ({
      isOfflineModeEnabled: false,
      isPWAInstalled: false,
      isModelDownloaded: false,
      downloadProgress: 0,
      browserSupported: checkBrowserSupport(),
      
      setOfflineMode: (enabled) => {
        set({ isOfflineModeEnabled: enabled });
        // Sync with service worker
        if (enabled && 'serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((registration) => {
            registration.active?.postMessage({ type: 'CACHE_MODEL' });
          });
        }
      },
      
      setPWAInstalled: (installed) => set({ isPWAInstalled: installed }),
      
      setModelDownloaded: (downloaded) => set({ isModelDownloaded: downloaded }),
      
      setDownloadProgress: (progress) => set({ downloadProgress: progress }),
      
      checkPWAStatus: () => {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                           (window.navigator as any).standalone ||
                           document.referrer.includes('android-app://');
        set({ isPWAInstalled: isStandalone });
      },
      
      syncModelState: () => {
        const modelState = getModelState();
        set({ 
          isModelDownloaded: modelState === ModelState.READY,
          downloadProgress: modelState === ModelState.READY ? 100 : 0
        });
      }
    }),
    {
      name: 'wordjuicer-offline-store',
      partialize: (state) => ({
        isOfflineModeEnabled: state.isOfflineModeEnabled,
        isPWAInstalled: state.isPWAInstalled,
        isModelDownloaded: state.isModelDownloaded,
        downloadProgress: state.downloadProgress,
      }),
      onRehydrateStorage: () => (state) => {
        // Recheck status after rehydration
        if (state) {
          state.checkPWAStatus();
          state.syncModelState();
        }
      }
    }
  )
); 