import React from 'react';
import { Copy, Clock, AlignLeft } from 'lucide-react';
import { GlassButton } from './ui/GlassButton';
import { cn } from '../utils/cn';
import { TranscriptionViewSelector, TranscriptionView } from './TranscriptionViewSelector';

interface TranscriptionViewerProps {
  transcription: string;
  timestamps: Array<{ time: number; text: string }>;
}

function formatTimestamp(seconds: number): string {
  const date = new Date(seconds * 1000);
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  const secs = date.getUTCSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${secs}`;
}

export function TranscriptionViewer({ transcription, timestamps }: TranscriptionViewerProps) {
  const [currentView, setCurrentView] = React.useState<TranscriptionView>('segments');
  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(transcription);
      // Could add a notification here for feedback
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case 'segments':
        return timestamps.map((item, index) => (
          <div 
            key={index} 
            className={cn(
              "group relative rounded-lg p-4 transition-all duration-300",
              "bg-gray-800/40 hover:bg-gray-800/60",
              "shadow-sm hover:shadow-md border border-gray-700/30"
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-[#A2AD1E]" />
              <span className="text-sm font-medium text-[#A2AD1E]">
                {formatTimestamp(item.time)}
              </span>
            </div>
            <p className="text-gray-200 leading-relaxed tracking-wide">
              {item.text}
            </p>
          </div>
        ));

      case 'transcript':
        return (
          <div className="space-y-4">
            <p className="text-gray-200 leading-relaxed tracking-wide whitespace-pre-wrap">
              {timestamps.map(t => t.text).join('\n\n')}
            </p>
          </div>
        );

      case 'compact':
        return timestamps.map((item, index) => (
          <div 
            key={index}
            className="flex items-start gap-4 py-2 border-b border-gray-700/30 last:border-0"
          >
            <span className="text-sm font-medium text-[#A2AD1E] whitespace-nowrap">
              {formatTimestamp(item.time)}
            </span>
            <p className="text-gray-200">
              {item.text}
            </p>
          </div>
        ));
    }
  };

  return timestamps.length > 0 ? (
    <div className="w-full max-w-4xl bg-gray-900/75 backdrop-blur-md rounded-[20px] border border-gray-700/30 shadow-xl p-4 lg:p-8">
      <div className="flex justify-between items-center gap-4 mb-6">
        <h2 className="text-lg lg:text-xl font-semibold text-gray-100">
          Transcription Result
        </h2>
        <div className="flex items-center gap-4">
          <TranscriptionViewSelector
            currentView={currentView}
            onViewChange={setCurrentView}
          />
          <GlassButton
            variant="secondary"
            size="sm"
            onClick={handleCopyToClipboard}
            icon={<Copy className="w-4 h-4" />}
          >
            <span className="hidden sm:inline">Copy</span>
          </GlassButton>
        </div>
      </div>
      
      <div className="h-[500px] overflow-y-auto rounded-[16px] bg-gray-800/60 backdrop-blur-sm p-6 border border-gray-700/30 space-y-6">
        {renderContent()}
      </div>
    </div>
  ) : (
    <div className="w-full max-w-4xl bg-gray-900/75 backdrop-blur-md rounded-[20px] border border-gray-700/30 shadow-xl p-8">
      <div className="flex items-center justify-center h-[200px]">
        <p className="text-gray-400 text-lg">No transcription data available</p>
      </div>
    </div>
  );
}