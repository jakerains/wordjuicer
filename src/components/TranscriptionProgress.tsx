import React from 'react';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { useProgressStore } from '../utils/progress';
import lottie from 'lottie-web';

export function TranscriptionProgress() {
  const { progress, getProgress, getTimeRemaining } = useProgressStore();
  const [timeRemaining, setTimeRemaining] = React.useState<number | null>(null);
  const lottieContainer = React.useRef<HTMLDivElement>(null);
  const lottieInstance = React.useRef<any>(null);

  // Initialize Lottie animation
  React.useEffect(() => {
    if (!lottieContainer.current || progress.status !== 'processing') return;

    lottieInstance.current = lottie.loadAnimation({
      container: lottieContainer.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: '/Animation - 1733141028806.json'
    });

    return () => {
      if (lottieInstance.current) {
        lottieInstance.current.destroy();
        lottieInstance.current = null;
      }
    };
  }, [progress.status]);

  // Update time remaining every second during processing
  React.useEffect(() => {
    if (progress.status !== 'processing') return;
    
    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining());
    }, 1000);
    
    return () => clearInterval(interval);
  }, [progress.status, getTimeRemaining]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    switch (progress.status) {
      case 'completed':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      case 'processing':
        return 'text-[#A2AD1E]';
      default:
        return 'text-white/50';
    }
  };

  if (progress.status === 'idle') return null;

  return (
    <div className="min-h-[60vh] flex flex-col">
      {/* Header info */}
      <div className="bg-black/20 backdrop-blur-sm p-4 rounded-lg mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {progress.status === 'completed' ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : progress.status === 'error' ? (
              <AlertCircle className="w-5 h-5 text-red-500" />
            ) : (
              <Clock className="w-5 h-5 text-[#A2AD1E]" />
            )}
            <div>
              <h3 className="text-sm font-medium text-white/90">
                {progress.fileName}
              </h3>
              <p className="text-xs text-white/50">
                {progress.status === 'completed'
                  ? 'Transcription completed'
                  : progress.status === 'error'
                  ? 'Transcription failed'
                  : progress.status === 'processing'
                  ? `Processing chunk ${progress.currentChunk + 1} of ${progress.totalChunks}`
                  : 'Preparing transcription...'}
              </p>
            </div>
          </div>
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {getProgress()}%
          </span>
        </div>
      </div>

      {/* Main content with centered animation */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {progress.status === 'processing' && (
          <div className="flex flex-col items-center justify-center">
            <div 
              ref={lottieContainer} 
              className="w-[600px] h-[600px] mb-8"
            />
            {timeRemaining !== null && (
              <div className="flex items-center gap-3 text-xl text-white/70">
                <Clock className="w-6 h-6" />
                <span>Estimated time remaining: {formatTime(timeRemaining)}</span>
              </div>
            )}
          </div>
        )}

        {/* Progress bar */}
        <div className="w-full max-w-3xl relative h-3 bg-white/5 rounded-full overflow-hidden mt-8">
          <div
            className={`absolute left-0 top-0 h-full transition-all duration-300 ${
              progress.status === 'completed'
                ? 'bg-green-500'
                : progress.status === 'error'
                ? 'bg-red-500'
                : 'bg-[#A2AD1E]'
            }`}
            style={{ width: `${getProgress()}%` }}
          />
        </div>

        {progress.error && (
          <div className="w-full max-w-3xl p-4 rounded-lg bg-red-500/10 border border-red-500/20 mt-4">
            <p className="text-sm text-red-500">{progress.error}</p>
          </div>
        )}
      </div>

      {/* Chunk grid at bottom */}
      <div className="bg-black/20 backdrop-blur-sm p-4 rounded-lg mt-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {progress.chunks.map((chunk) => (
            <div
              key={chunk.id}
              className={`p-2 rounded-lg text-xs ${
                chunk.status === 'completed'
                  ? 'bg-green-500/10 text-green-500'
                  : chunk.status === 'error'
                  ? 'bg-red-500/10 text-red-500'
                  : chunk.status === 'processing'
                  ? 'bg-[#A2AD1E]/10 text-[#A2AD1E]'
                  : 'bg-white/5 text-white/50'
              }`}
            >
              Chunk {chunk.id + 1}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}