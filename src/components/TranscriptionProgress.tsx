import React from 'react';
import Lottie from 'lottie-web';
import { useApiKeyStore } from '../store/apiKeyStore';
import { useNotificationStore } from '../store/notificationStore';

interface TranscriptionProgressProps {
  progress: number;
}

export function TranscriptionProgress({ progress }: TranscriptionProgressProps) {
  const lemonContainer = React.useRef<HTMLDivElement>(null);
  const { provider } = useApiKeyStore();
  
  // Initialize animation with the transcription animation
  React.useEffect(() => {
    if (lemonContainer.current) {
      const animation = Lottie.loadAnimation({
        container: lemonContainer.current,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: '/Animation - 1733141028806.json'
      });

      return () => animation.destroy();
    }
  }, []);

  return (
    <div className="w-full space-y-8">
      <div className="flex justify-center">
        <div ref={lemonContainer} className="w-48 h-48" />
      </div>
      
      <div className="w-full max-w-xl mx-auto">
        <div className="h-4 bg-white/10 backdrop-blur-sm rounded-full overflow-hidden shadow-lg">
          <div 
            className="h-full bg-gradient-to-r from-[#E1C94B] via-[#F98128] to-[#A2AD1E] 
                     transition-all duration-300 animate-pulse shadow-inner"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-center mt-4 text-lg text-white/80">
          {progress < 100 
            ? `Transcribing your audio... ${progress.toFixed(0)}%`
            : 'Processing complete! Preparing results...'}
        </p>
      </div>
    </div>
  );
}