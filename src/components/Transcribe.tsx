import React from 'react';
import { Upload, FileAudio } from 'lucide-react';
import { GlassButton } from './ui/GlassButton';
import { useTranscriptionStore } from '../store/transcriptionStore';
import { useNotificationStore } from '../store/notificationStore';
import { TranscriptionProgress } from './TranscriptionProgress';
import { TranscriptionQueue } from './TranscriptionQueue';
import { useProgressStore } from '../utils/progress';
import { useQueueStore } from '../utils/queue';

interface TranscribeProps {
  setActiveView: (view: 'dashboard' | 'transcribe' | 'history' | 'settings' | 'help') => void;
}

export function Transcribe({ setActiveView }: TranscribeProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { addTranscription } = useTranscriptionStore();
  const addNotification = useNotificationStore((state) => state.addNotification);
  const { progress } = useProgressStore();
  const { addItem } = useQueueStore();

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      addNotification({
        type: 'error',
        message: 'Please select an audio file'
      });
      return;
    }

    // Validate file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      addNotification({
        type: 'error',
        message: 'File size must be less than 100MB'
      });
      return;
    }

    // Add file to queue
    addItem(file);
    
    addNotification({
      type: 'info',
      message: 'File added to transcription queue'
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    // Handle multiple files
    Array.from(e.dataTransfer.files).forEach((file) => {
      handleFileSelect(file);
    });
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Handle multiple files
    Array.from(e.target.files || []).forEach((file) => {
      handleFileSelect(file);
    });
  };

  return (
    <div className="max-w-2xl space-y-6">
      {progress.status !== 'idle' ? (
        <div className="bg-gray-900/75 backdrop-blur-md rounded-[20px] p-6 border border-gray-700/30 shadow-xl">
          <TranscriptionProgress />
        </div>
      ) : (
        <div
          className={`relative bg-gray-900/75 backdrop-blur-md rounded-[20px] p-8 border-2 border-dashed transition-colors
            ${isDragging ? 'border-[#A2AD1E] bg-[#A2AD1E]/5' : 'border-gray-700/30'}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <label htmlFor="audio-file-input" className="sr-only">
            Choose an audio file to transcribe
          </label>
          <input
            id="audio-file-input"
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileInput}
            className="hidden"
            title="Audio file input"
            aria-label="Choose an audio file to transcribe"
            multiple // Allow multiple file selection
          />

          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-3 bg-[#A2AD1E]/10 rounded-full">
              <FileAudio className="w-8 h-8 text-[#A2AD1E]" />
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-white">
                Drop your audio files here
              </h3>
              <p className="text-sm text-white/50 mt-1">
                or click to select files
              </p>
            </div>

            <GlassButton
              variant="primary"
              size="lg"
              onClick={() => fileInputRef.current?.click()}
              icon={<Upload className="w-5 h-5" />}
              aria-controls="audio-file-input"
            >
              Select Audio Files
            </GlassButton>

            <p className="text-xs text-white/30">
              Supports MP3, WAV, M4A, FLAC, and more • Max file size 100MB
            </p>
          </div>
        </div>
      )}

      <div className="bg-gray-900/75 backdrop-blur-md rounded-[20px] p-6 border border-gray-700/30 shadow-xl">
        <TranscriptionQueue />
      </div>
    </div>
  );
} 