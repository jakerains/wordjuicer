import React from 'react';
import { Server, Laptop, Cloud } from 'lucide-react';
import { useApiKeyStore, ApiProvider } from '../store/apiKeyStore';
import { useOfflineStore } from '../store/offlineStore';

export function ProviderSelector() {
  const { provider, setProvider } = useApiKeyStore();
  const { 
    isOfflineModeEnabled, 
    setOfflineModeEnabled,
    browserSupported,
    isPWAInstalled
  } = useOfflineStore();

  const handleProviderChange = (newProvider: ApiProvider | 'offline') => {
    if (newProvider === 'offline') {
      setOfflineModeEnabled(true);
    } else {
      setOfflineModeEnabled(false);
      setProvider(newProvider as ApiProvider);
    }
  };

  const getProviderIcon = (providerName: string) => {
    switch (providerName) {
      case 'huggingface':
        return <Server className="w-5 h-5" />;
      case 'groq':
        return <Cloud className="w-5 h-5" />;
      case 'openai':
        return <Server className="w-5 h-5" />;
      case 'offline':
        return <Laptop className="w-5 h-5" />;
      default:
        return <Server className="w-5 h-5" />;
    }
  };

  return (
    <div className="bg-black/40 backdrop-blur-md rounded-[20px] p-6 border border-white/20">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => handleProviderChange('huggingface')}
          className={`px-4 py-3 rounded-xl ${
            provider === 'huggingface' && !isOfflineModeEnabled
              ? 'bg-[#A2AD1E]/20 text-[#A2AD1E]'
              : 'bg-white/5 text-white/70'
          } hover:bg-[#A2AD1E]/30 transition-colors flex items-center justify-center gap-2`}
        >
          {getProviderIcon('huggingface')}
          Hugging Face
        </button>

        <button
          onClick={() => handleProviderChange('groq')}
          className={`px-4 py-3 rounded-xl ${
            provider === 'groq' && !isOfflineModeEnabled
              ? 'bg-[#A2AD1E]/20 text-[#A2AD1E]'
              : 'bg-white/5 text-white/70'
          } hover:bg-[#A2AD1E]/30 transition-colors flex items-center justify-center gap-2`}
        >
          {getProviderIcon('groq')}
          Groq
          {provider === 'groq' && !isOfflineModeEnabled && import.meta.env.VITE_GROQ_API_KEY && (
            <span className="bg-[#A2AD1E] text-black text-xs px-2 py-0.5 rounded-full">
              Trial
            </span>
          )}
        </button>

        <button
          onClick={() => handleProviderChange('openai')}
          className={`px-4 py-3 rounded-xl ${
            provider === 'openai' && !isOfflineModeEnabled
              ? 'bg-[#A2AD1E]/20 text-[#A2AD1E]'
              : 'bg-white/5 text-white/70'
          } hover:bg-[#A2AD1E]/30 transition-colors flex items-center justify-center gap-2`}
        >
          {getProviderIcon('openai')}
          OpenAI
        </button>

        <button
          onClick={() => handleProviderChange('offline')}
          disabled={!browserSupported || !isPWAInstalled}
          className={`px-4 py-3 rounded-xl ${
            isOfflineModeEnabled
              ? 'bg-[#A2AD1E]/20 text-[#A2AD1E]'
              : 'bg-white/5 text-white/70'
          } hover:bg-[#A2AD1E]/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {getProviderIcon('offline')}
          Offline
        </button>
      </div>

      {!browserSupported && (
        <p className="mt-4 text-sm text-white/70 text-center">
          Your browser doesn't support offline mode
        </p>
      )}
      {browserSupported && !isPWAInstalled && (
        <p className="mt-4 text-sm text-white/70 text-center">
          Install WordJuicer as an app to enable offline mode
        </p>
      )}
    </div>
  );
} 