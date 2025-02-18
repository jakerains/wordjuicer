import React from 'react';
import { Loader2 } from 'lucide-react';
import { useProgressStore } from '../utils/progress';

export function TranscriptionProgress() {
  const currentChunk = useProgressStore((state) => state.currentChunk);
  const status = useProgressStore((state) => state.status);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Loader2 className="w-5 h-5 text-[#A2AD1E] animate-spin" />
        <h3 className="text-lg font-medium text-white">
          {currentChunk.message || 'Processing audio...'}
        </h3>
      </div>

      <div className="w-full bg-gray-700/30 rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-[#A2AD1E] transition-all duration-300 ease-out"
          style={{ width: `${currentChunk.progress}%` }}
        />
      </div>

      {currentChunk.error && (
        <div className="text-red-400 text-sm mt-2">
          {currentChunk.error}
        </div>
      )}
    </div>
  );
}