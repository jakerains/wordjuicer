import React from 'react';
import { Key, Check, X, Server } from 'lucide-react';
import { useApiKeyStore, ApiProvider } from '../store/apiKeyStore';

export function ApiKeyManager() {
  const { 
    apiKey, 
    setApiKey, 
    clearApiKey, 
    isValidated, 
    isValidating,
    provider,
    setProvider
  } = useApiKeyStore();
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

  return (
    <div className="bg-black/40 backdrop-blur-md rounded-[20px] p-6 border border-white/20">
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
          <button
            onClick={handleKeySubmit}
            disabled={isValidating || !inputKey.trim()}
            className="px-4 py-2 rounded-xl bg-[#A2AD1E]/20 text-[#A2AD1E] hover:bg-[#A2AD1E]/30 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isValidating ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
            ) : (
              <Key className="w-5 h-5" />
            )}
            <span className="hidden sm:inline">Validate</span>
          </button>
          {isValidated && inputKey && (
            <button
              onClick={clearApiKey}
              className="px-4 py-2 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
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
  );
} 