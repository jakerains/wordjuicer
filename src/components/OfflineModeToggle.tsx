import React, { useEffect } from 'react';
import { Shield, ShieldAlert, Download, Wifi, WifiOff } from 'lucide-react';
import { useOfflineStore } from '../store/offlineStore';
import { initializeLocalModel, getModelState, getModelSize } from '../utils/localModel';

export function OfflineModeToggle() {
  const {
    isOfflineModeEnabled,
    isPWAInstalled,
    isModelDownloaded,
    downloadProgress,
    browserSupported,
    setOfflineMode,
    setModelDownloaded,
    setDownloadProgress,
  } = useOfflineStore();

  const [isDownloading, setIsDownloading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    // Check if we're installed as PWA
    const checkPWAStatus = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      useOfflineStore.getState().setPWAInstalled(isStandalone);
    };

    checkPWAStatus();
    window.addEventListener('appinstalled', checkPWAStatus);

    return () => window.removeEventListener('appinstalled', checkPWAStatus);
  }, []);

  const handleToggle = async () => {
    if (!browserSupported) {
      setError('Your browser does not support offline mode');
      return;
    }

    if (!isPWAInstalled) {
      setError('Please install the app to use offline mode');
      return;
    }

    if (!isOfflineModeEnabled) {
      setIsDownloading(true);
      setError(null);
      try {
        // Start model download
        const modelSize = getModelSize('openai/whisper-tiny');
        setDownloadProgress(0);
        
        await initializeLocalModel('openai/whisper-tiny');
        
        setModelDownloaded(true);
        setOfflineMode(true);
        setDownloadProgress(100);
      } catch (error) {
        console.error('Failed to initialize offline mode:', error);
        setError('Failed to enable offline mode. Please try again.');
      }
      setIsDownloading(false);
    } else {
      setOfflineMode(false);
    }
  };

  return (
    <div className="bg-black/40 backdrop-blur-md rounded-[20px] p-6 border border-white/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isOfflineModeEnabled ? (
            <Shield className="w-5 h-5 text-green-500" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-yellow-500" />
          )}
          <div>
            <h3 className="text-lg font-semibold text-white">Offline Mode</h3>
            <p className="text-sm text-white/70">
              {!browserSupported
                ? 'Your browser does not support offline mode'
                : !isPWAInstalled
                ? 'Install app to enable offline mode'
                : isOfflineModeEnabled
                ? 'Transcriptions are processed locally'
                : 'Enable to process transcriptions offline'}
            </p>
            {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {isDownloading && (
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 animate-pulse text-blue-500" />
              <span className="text-sm text-blue-500">{downloadProgress}%</span>
            </div>
          )}
          
          <button
            onClick={handleToggle}
            disabled={!browserSupported || (!isPWAInstalled && !isOfflineModeEnabled)}
            className={`
              px-4 py-2 rounded-full text-sm font-medium
              flex items-center gap-2
              ${
                isOfflineModeEnabled
                  ? 'bg-green-500/20 text-green-500'
                  : 'bg-yellow-500/20 text-yellow-500'
              }
              ${
                (!browserSupported || (!isPWAInstalled && !isOfflineModeEnabled)) &&
                'opacity-50 cursor-not-allowed'
              }
            `}
          >
            {isOfflineModeEnabled ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
            {isOfflineModeEnabled ? 'Disable' : 'Enable'}
          </button>
        </div>
      </div>
      
      {isModelDownloaded && (
        <div className="mt-4 text-sm text-white/70">
          <p>Local model is ready for offline use</p>
        </div>
      )}
    </div>
  );
} 