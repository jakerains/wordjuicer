import React from 'react';
import { Upload, FileAudio } from 'lucide-react';
import { GlassButton } from './ui/GlassButton';
import { useTranscriptionStore } from '../store/transcriptionStore';
import { useNotificationStore } from '../store/notificationStore';
import { TranscriptionProgress } from './TranscriptionProgress';
import { TranscriptionQueue } from './TranscriptionQueue';
import { useProgressStore } from '../utils/progress';
import { useQueueStore } from '../utils/queue';
import { transcribeAudio } from '../utils/transcription';
import { Button } from './ui/button';

interface TranscribeProps {
  setActiveView: (view: 'dashboard' | 'transcribe' | 'history' | 'settings' | 'help') => void;
}

export function Transcribe({ setActiveView }: TranscribeProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { addTranscription } = useTranscriptionStore();
  const addNotification = useNotificationStore((state) => state.addNotification);
  const { addItem } = useQueueStore();

  // Subscribe to progress store changes
  const currentChunk = useProgressStore((state) => state.currentChunk);
  const status = useProgressStore((state) => state.status);
  const isProcessing = status === 'processing' || currentChunk.status === 'processing';

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    // Log the file information for debugging
    console.log('File details:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Map of file extensions to MIME types
    const mimeTypeMap: Record<string, string[]> = {
      'm4a': ['audio/mp4', 'audio/x-m4a', 'audio/m4a'],
      'mp3': ['audio/mpeg', 'audio/mp3', 'audio/x-mpeg3', 'audio/mpeg3'],
      'mp4': ['audio/mp4'],
      'wav': ['audio/wav', 'audio/x-wav', 'audio/wave'],
      'flac': ['audio/flac', 'audio/x-flac'],
      'ogg': ['audio/ogg', 'audio/x-ogg'],
      'opus': ['audio/opus'],
      'webm': ['audio/webm']
    };

    // Get file extension
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    
    // Check if the extension is supported
    if (!mimeTypeMap[extension]) {
      addNotification({
        type: 'error',
        message: 'Unsupported file format. Please use FLAC, MP3, MP4, M4A, WAV, OGG, OPUS, or WEBM'
      });
      return;
    }

    try {
      await transcribeAudio(file);
    } catch (error) {
      console.error('Transcription failed:', error);
      addNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Transcription failed'
      });
    }
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
    
    Array.from(e.dataTransfer.files).forEach((file) => {
      handleFileSelect(file);
    });
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files || []).forEach((file) => {
      handleFileSelect(file);
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {isProcessing ? (
        <div className="bg-gray-900/75 backdrop-blur-md rounded-[20px] p-6 border border-gray-700/30 shadow-xl">
          <TranscriptionProgress />
        </div>
      ) : (
        <>
          <div className="bg-gray-900/75 backdrop-blur-md rounded-[20px] p-6 border border-[#A2AD1E]/30 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#A2AD1E]/10 rounded-full">
                <FileAudio className="w-6 h-6 text-[#A2AD1E]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-medium text-[#A2AD1E]">Ready to Transcribe</h3>
                  <span className="px-2 py-0.5 text-xs font-medium bg-[#A2AD1E] text-black rounded-full">
                    Trial Key Active
                  </span>
                </div>
                <p className="text-sm text-white/70 mt-1">
                  Using Groq trial key - Get your own key from{' '}
                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#E1C94B] hover:text-[#F96C57] transition-colors"
                  >
                    Groq Console
                  </a>
                  {' '}for expanded limits
                </p>
              </div>
            </div>
          </div>

          <div
            className={`relative bg-gray-900/75 backdrop-blur-md rounded-[20px] p-8 border-2 border-dashed transition-colors
              ${isDragging ? 'border-[#A2AD1E] bg-[#A2AD1E]/5' : 'border-gray-700/30'}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileInput}
              className="hidden"
              multiple
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
              >
                Select Audio Files
              </GlassButton>

              <p className="text-xs text-white/30">
                Supports FLAC, MP3, MP4, M4A, WAV, OGG, OPUS, and WEBM • Max file size 100MB
              </p>
            </div>
          </div>

          {/* New rate limit info section */}
          <div className="mt-6 text-center">
            <p className="text-sm text-white/50">
              Using trial key (rate limited) - For unlimited transcriptions, add your own key from:
            </p>
            <div className="mt-2 flex items-center justify-center gap-3">
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-[#A2AD1E] hover:text-[#F96C57] transition-colors"
              >
                Groq
              </a>
              <span className="text-white/30">•</span>
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-[#A2AD1E] hover:text-[#F96C57] transition-colors"
              >
                OpenAI
              </a>
              <span className="text-white/30">•</span>
              <a
                href="https://huggingface.co/settings/tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-[#A2AD1E] hover:text-[#F96C57] transition-colors"
              >
                Hugging Face
              </a>
            </div>
          </div>
        </>
      )}

      <div className="bg-gray-900/75 backdrop-blur-md rounded-[20px] p-6 border border-gray-700/30 shadow-xl">
        <TranscriptionQueue />
      </div>
    </div>
  );
} 