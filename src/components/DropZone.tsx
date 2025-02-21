import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Server, FileAudio } from 'lucide-react';
import { useApiKeyStore, ApiProvider } from '../store/apiKeyStore';
import { GlassButton } from './ui/GlassButton';

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

// Hook to detect mobile devices
function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

export function DropZone({ onFileSelect, isLoading }: DropZoneProps) {
  const { provider, setProvider } = useApiKeyStore();
  const [validatedProviders, setValidatedProviders] = React.useState<ApiProvider[]>([]);
  const isMobile = useIsMobile();

  React.useEffect(() => {
    // Check which providers have valid keys
    const storedKeys = sessionStorage.getItem('juicer-api-keys');
    if (storedKeys) {
      const keys = JSON.parse(storedKeys);
      setValidatedProviders(Object.keys(keys) as ApiProvider[]);
    }
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.ogg']
    },
    disabled: isLoading,
    multiple: false
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          w-full p-12 rounded-[20px] border-2 border-dashed 
          transition-all duration-300 cursor-pointer
          bg-white/5 backdrop-blur-md
          shadow-[0_8px_32px_rgba(0,0,0,0.1)]
          hover:shadow-[0_8px_32px_rgba(0,0,0,0.15)]
          ${isDragActive 
            ? 'border-[#F96C57]' 
            : 'border-white/20 hover:border-[#E1C94B]'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed filter grayscale' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center text-center">
          {isMobile ? (
            <>
              <FileAudio 
                className={`w-16 h-16 mb-6 ${isDragActive ? 'text-[#F96C57]' : 'text-white/70'}`}
              />
              <p className="text-2xl font-medium text-white mb-3">
                Tap to select audio
              </p>
              <p className="text-base text-white/70">
                MP3, WAV, M4A, OGG supported
              </p>
            </>
          ) : (
            <>
              <Upload 
                className={`w-16 h-16 mb-6 ${isDragActive ? 'text-[#F96C57]' : 'text-white/70'}`}
              />
              <p className="text-2xl font-medium text-white mb-3">
                {isDragActive ? 'Drop your audio file here' : 'Drag & drop your audio file'}
              </p>
              <p className="text-base text-white/70">
                or click to browse (MP3, WAV, M4A, OGG)
              </p>
            </>
          )}
        </div>
      </div>
      
      {validatedProviders.length === 0 ? (
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
      ) : (
        <div className="flex flex-col items-center gap-4 mt-8">
          <div className="flex items-center justify-center gap-4">
            {validatedProviders.includes('huggingface') && (
              <GlassButton
                variant={provider === 'huggingface' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setProvider('huggingface')}
                icon={<Server className="w-4 h-4" />}
                className="w-40"
              >
                Hugging Face
              </GlassButton>
            )}
            {validatedProviders.includes('groq') && (
              <GlassButton
                variant={provider === 'groq' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setProvider('groq')}
                icon={<Server className="w-4 h-4" />}
                className="w-40"
              >
                Groq
              </GlassButton>
            )}
            {validatedProviders.includes('openai') && (
              <GlassButton
                variant={provider === 'openai' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setProvider('openai')}
                icon={<Server className="w-4 h-4" />}
                className="w-40"
              >
                OpenAI
              </GlassButton>
            )}
          </div>
        </div>
      )}
    </div>
  );
}