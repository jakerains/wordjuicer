import React from 'react';
import { List, AlignLeft, Clock } from 'lucide-react';
import { GlassButton } from './ui/GlassButton';

export type TranscriptionView = 'segments' | 'transcript' | 'compact';

interface TranscriptionViewSelectorProps {
  currentView: TranscriptionView;
  onViewChange: (view: TranscriptionView) => void;
}

export function TranscriptionViewSelector({ currentView, onViewChange }: TranscriptionViewSelectorProps) {
  return (
    <div className="flex gap-2 bg-white/10 backdrop-blur-md rounded-[16px] p-2">
      <GlassButton
        variant={currentView === 'segments' ? 'primary' : 'dark'}
        size="sm"
        onClick={() => onViewChange('segments')}
        icon={<Clock className="w-4 h-4" />}
      >
        Segments
      </GlassButton>
      
      <GlassButton
        variant={currentView === 'transcript' ? 'primary' : 'dark'}
        size="sm"
        onClick={() => onViewChange('transcript')}
        icon={<AlignLeft className="w-4 h-4" />}
      >
        Transcript
      </GlassButton>
      
      <GlassButton
        variant={currentView === 'compact' ? 'primary' : 'dark'}
        size="sm"
        onClick={() => onViewChange('compact')}
        icon={<List className="w-4 h-4" />}
      >
        Compact
      </GlassButton>
    </div>
  );
}