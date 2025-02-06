import React, { useState } from 'react';
import { Key, Save, Upload, Server, Check, X, Download } from 'lucide-react';
import { GlassButton } from './ui/GlassButton';
import { useTranscriptionStore } from '../store/transcriptionStore';
import { useApiKeyStore, ApiProvider } from '../store/apiKeyStore';
import { useNotificationStore } from '../store/notificationStore';
import { CacheManager } from './CacheManager';
import { useNavigate } from 'react-router-dom';

interface SettingsProps {
  setActiveView: (view: string) => void;
}

export function Settings({ setActiveView }: SettingsProps) {
  const navigate = useNavigate();
  const [isPWAInstalled, setIsPWAInstalled] = React.useState(false);
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);
  const [selectedModelSize, setSelectedModelSize] = React.useState('large');
  const [downloadStatus, setDownloadStatus] = React.useState('');

  React.useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsPWAInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsPWAInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  const { exportData, importData, resetData } = useTranscriptionStore();
  const { 
    apiKey, 
    setApiKey, 
    clearApiKey, 
    isValidated, 
    isValidating: storeIsValidating,
    provider, 
    setProvider 
  } = useApiKeyStore();
  const addNotification = useNotificationStore((state) => state.addNotification);
  const [inputKey, setInputKey] = React.useState('');

  React.useEffect(() => {
    if (apiKey) {
      setInputKey(apiKey);
    }
  }, [apiKey]);

  const handleKeySubmit = async () => {
    if (!inputKey.trim()) return;
    
    // Clear any existing validation state
    clearApiKey();
    
    try {
      await setApiKey(inputKey.trim());
    } catch (error) {
      console.error('API key validation error:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleKeySubmit();
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          importData(data);
        } catch (err) {
          console.error('Failed to import data:', err);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleProviderChange = async (newProvider: string) => {
    setProvider(newProvider);
    if (newProvider === 'groq' && !inputKey && import.meta.env.VITE_GROQ_API_KEY) {
      addNotification({
        type: 'success',
        message: 'Using trial key for Groq'
      });
      setActiveView('transcribe');
      navigate('/');
    }
  };

  const handleModelDownload = async () => {
    setDownloadStatus('Downloading...');
    try {
      // Simulate model download
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setDownloadStatus('Download complete!');
    } catch (error) {
      setDownloadStatus('Download failed.');
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-gray-900/75 backdrop-blur-md rounded-[20px] p-6 border border-gray-700/30 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-[#A2AD1E]/30 rounded-full">
            <Server className="w-6 h-6 text-[#A2AD1E]" />
          </div>
          <h2 className="text-xl font-semibold text-gray-100">API Configuration</h2>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              API Provider
              <span className="ml-2 text-xs text-gray-500">
                (All providers use Whisper for transcription)
              </span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <GlassButton
                variant={provider === 'huggingface' ? 'primary' : 'secondary'}
                size="md"
                onClick={() => handleProviderChange('huggingface')}
                className="flex-1"
                icon={<Server className="w-4 h-4" />}
              >
                Hugging Face
              </GlassButton>
              <GlassButton
                variant={provider === 'groq' ? 'primary' : 'secondary'}
                size="md"
                onClick={() => handleProviderChange('groq')}
                className="flex-1 relative"
                icon={<Server className="w-4 h-4" />}
              >
                Groq
                {provider === 'groq' && !inputKey && import.meta.env.VITE_GROQ_API_KEY && (
                  <span className="absolute -top-2 -right-2 bg-[#A2AD1E] text-black text-xs px-2 py-0.5 rounded-full">
                    Trial
                  </span>
                )}
              </GlassButton>
              <GlassButton
                variant={provider === 'openai' ? 'primary' : 'secondary'}
                size="md"
                onClick={() => handleProviderChange('openai')}
                className="flex-1"
                icon={<Server className="w-4 h-4" />}
              >
                OpenAI
              </GlassButton>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              {provider === 'huggingface' ? 'Hugging Face' : 
               provider === 'groq' ? 'Groq' : 'OpenAI'} API Key
              {isValidated && (
                <span className="inline-flex items-center gap-1 ml-2 text-[#A2AD1E]">
                  <Check className="w-4 h-4" />
                  Validated
                </span>
              )}
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-[#A2AD1E]"
                placeholder={
                  provider === 'groq' && !inputKey && import.meta.env.VITE_GROQ_API_KEY
                    ? 'Using trial API key - Enter your own key for expanded limits'
                    : 'Enter your API key'
                }
              />
              <GlassButton
                variant="primary"
                size="md"
                onClick={handleKeySubmit}
                disabled={storeIsValidating || !inputKey.trim()}
                icon={storeIsValidating ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
                ) : (
                  <Key className="w-5 h-5" />
                )}
              >
                <span className="hidden sm:inline">Validate</span>
              </GlassButton>
              {isValidated && inputKey && (
                <GlassButton
                  variant="secondary"
                  size="md"
                  onClick={clearApiKey}
                  icon={<X className="w-5 h-5" />}
                >
                </GlassButton>
              )}
            </div>
            <div className="mt-2 space-y-2">
              {provider === 'groq' && !inputKey && import.meta.env.VITE_GROQ_API_KEY ? (
                <p className="text-sm text-white/70">
                  Using trial API key with rate limits. For expanded limits,{' '}
                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#E1C94B] hover:text-[#F96C57] transition-colors"
                  >
                    get your own Groq API key
                  </a>
                </p>
              ) : (
                <p className="text-sm text-white/70">
                  Get your API key from{' '}
                  <a
                    href={provider === 'huggingface' 
                      ? 'https://huggingface.co/settings/tokens'
                      : provider === 'groq'
                      ? 'https://console.groq.com/keys'
                      : 'https://platform.openai.com/api-keys'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#E1C94B] hover:text-[#F96C57] transition-colors"
                  >
                    {provider === 'huggingface' ? 'Hugging Face' : 
                     provider === 'groq' ? 'Groq' : 'OpenAI'}
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-900/75 backdrop-blur-md rounded-[20px] p-6 border border-gray-700/30 shadow-xl">
        <CacheManager />
      </div>

      <div className="bg-gray-900/75 backdrop-blur-md rounded-[20px] p-6 border border-gray-700/30 shadow-xl">
        <h2 className="text-xl font-semibold text-gray-100 mb-6">App Installation</h2>
        {isPWAInstalled ? (
          <div className="flex items-center gap-3 text-[#A2AD1E]">
            <Check className="w-5 h-5" />
            <span>Text Juicer is installed on your device</span>
          </div>
        ) : deferredPrompt ? (
          <div className="space-y-4">
            <GlassButton
              variant="primary"
              size="lg"
              onClick={handleInstall}
              className="w-full"
              icon={<Download className="w-5 h-5" />}
            >
              Install Text Juicer
            </GlassButton>
            <p className="text-white/70 text-sm">
              Install the app for a better experience and offline access
            </p>
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            <p className="text-white/70">
              Your browser doesn't support installation or Text Juicer is already installed.
            </p>
          </div>
        )}
        
        <h2 className="text-xl font-semibold text-white mb-6">Dashboard Management</h2>
        <div className="space-y-6">
          <GlassButton
            variant="primary"
            size="md"
            onClick={exportData}
            className="w-full"
            icon={<Download className="w-5 h-5" />}
          >
            Export Dashboard Data
          </GlassButton>
          
          <label className="block w-full">
            <GlassButton
              variant="secondary"
              size="md"
              className="w-full"
              icon={<Upload className="w-5 h-5" />}
            >
              Import Dashboard Data
            </GlassButton>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
          
          <GlassButton
            variant="danger"
            size="md"
            onClick={resetData}
            className="w-full"
          >
            Reset Dashboard Data
          </GlassButton>
        </div>
      </div>

      <div className="bg-gray-900/75 backdrop-blur-md rounded-[20px] p-6 border border-gray-700/30 shadow-xl">
        <h2>Offline Model Management</h2>
        <div>
          <label htmlFor="modelSize">Select Model Size:</label>
          <select
            id="modelSize"
            value={selectedModelSize}
            onChange={(e) => setSelectedModelSize(e.target.value)}
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
          <button onClick={handleModelDownload}>Download Model</button>
          <p>{downloadStatus}</p>
        </div>
      </div>

      <div className="flex justify-end">
        <GlassButton
          variant="primary"
          size="md"
          onClick={() => {
            setActiveView('transcribe');
            addNotification({
              type: 'success',
              message: 'Settings saved successfully'
            });
          }}
          icon={<Save className="w-5 h-5" />}
        >
          Save Settings
        </GlassButton>
      </div>
    </div>
  );
}