import React from 'react';
import { Download, X } from 'lucide-react';

interface InstallPWAProps {
  deferredPrompt: any;
  onInstall: () => Promise<void>;
  onDismiss: () => void;
}

export function InstallPWA({ deferredPrompt, onInstall, onDismiss }: InstallPWAProps) {
  const [isInstalling, setIsInstalling] = React.useState(false);

  const handleInstall = async () => {
    setIsInstalling(true);
    await onInstall();
    setIsInstalling(false);
  };

  if (!deferredPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:w-96 bg-[#F96C57] backdrop-blur-md rounded-[20px] p-6 border border-white/20 shadow-xl z-50 animate-slide-up">
      <button
        onClick={onDismiss}
        className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
      >
        <X className="w-5 h-5 text-white/70" />
      </button>

      <div className="flex items-start gap-4">
        <div className="p-3 bg-white/20 rounded-full">
          <Download className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-2">
            Install Text Juicer
          </h3>
          <p className="text-white/90 text-sm mb-4">
            Add to your home screen for offline access and a native app experience
          </p>
          <button
            onClick={handleInstall}
            disabled={isInstalling}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-[#F96C57] rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {isInstalling ? (
              <>
                <div className="w-5 h-5 border-2 border-[#F96C57]/20 border-t-[#F96C57] rounded-full animate-spin" />
                Installing...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Install App
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}