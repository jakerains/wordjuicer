import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useNotificationStore } from './notificationStore';

export type ApiProvider = 'huggingface' | 'groq' | 'openai';

interface StoredKeys {
  huggingface?: string;
  groq?: string;
  openai?: string;
}

interface ApiKeyStore {
  apiKey: string | null;
  provider: ApiProvider;
  isValidated: boolean;
  isValidating: boolean;
  setApiKey: (key: string) => Promise<void>;
  setProvider: (provider: ApiProvider) => void;
  clearApiKey: () => void;
  initializeFromStorage: () => void;
}

const STORAGE_KEY = 'juicer-api-keys';

function getStoredKeys(): StoredKeys {
  try {
    // First check environment variables
    const envKeys = {
      huggingface: import.meta.env.VITE_HUGGINGFACE_API_KEY,
      groq: import.meta.env.VITE_GROQ_API_KEY,
      openai: import.meta.env.VITE_OPENAI_API_KEY
    };

    // Get user-stored keys
    const stored = sessionStorage.getItem(STORAGE_KEY);
    const userKeys = stored ? JSON.parse(stored) : {};

    // Merge keys, preferring user-stored keys over env keys
    return {
      ...envKeys,
      ...userKeys
    };
  } catch {
    return {};
  }
}

function storeKeys(keys: StoredKeys) {
  // Only store user-provided keys, not env keys
  const storedKeys = Object.entries(keys).reduce((acc, [key, value]) => {
    const envKey = import.meta.env[`VITE_${key.toUpperCase()}_API_KEY`];
    if (value && value !== envKey) {
      acc[key as keyof StoredKeys] = value;
    }
    return acc;
  }, {} as StoredKeys);
  
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(storedKeys));
}

async function validateApiKey(key: string, provider: ApiProvider): Promise<boolean> {
  try {
    if (provider === 'huggingface') {
      const response = await fetch('https://api-inference.huggingface.co/models/openai/whisper-large-v3', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${key}`
        }
      });
      return response.status === 200 || response.status === 401;
    }
    
    if (provider === 'groq') {
      const response = await fetch('https://api.groq.com/openai/v1/models', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json'
        }
      });
      return response.ok;
    }
    
    if (provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json'
        }
      });
      return response.ok;
    }
    
    return false;
  } catch (error) {
    console.error(`Failed to validate ${provider} API key:`, error);
    return false;
  }
}

export const useApiKeyStore = create<ApiKeyStore>()(
  persist(
    (set, get) => ({
      apiKey: null,
      provider: 'groq', // Set Groq as default provider
      isValidated: false,
      isValidating: false,
      
      setApiKey: async (key: string) => {
        const provider = get().provider;
        
        set({ isValidating: true });
        
        useNotificationStore.getState().addNotification({
          type: 'info',
          message: `Validating ${provider === 'huggingface' ? 'Hugging Face' : provider === 'groq' ? 'Groq' : 'OpenAI'} API key...`
        });
        
        const isValid = await validateApiKey(key, provider);
        
        if (isValid) {
          set({ 
            apiKey: key, 
            isValidated: true,
            isValidating: false 
          });
          
          // Only store if it's different from the env key
          const envKey = import.meta.env[`VITE_${provider.toUpperCase()}_API_KEY`];
          if (key !== envKey) {
            const storedKeys = getStoredKeys();
            storedKeys[provider] = key;
            storeKeys(storedKeys);
          }
          
          useNotificationStore.getState().addNotification({
            type: 'success',
            message: `${provider === 'huggingface' ? 'Hugging Face' : provider === 'groq' ? 'Groq' : 'OpenAI'} API key validated successfully`
          });
        } else {
          set({ 
            apiKey: null, 
            isValidated: false,
            isValidating: false 
          });
          
          useNotificationStore.getState().addNotification({
            type: 'error',
            message: `Invalid ${provider === 'huggingface' ? 'Hugging Face' : provider === 'groq' ? 'Groq' : 'OpenAI'} API key`
          });
        }
      },
      
      setProvider: (provider: ApiProvider) => {
        // When switching providers, try to restore the saved key
        const storedKeys = getStoredKeys();
        const savedKey = storedKeys[provider];
        
        set({ 
          provider,
          apiKey: savedKey || null,
          isValidated: Boolean(savedKey) 
        });
        
        // If we have a saved key, validate it
        if (savedKey) {
          get().setApiKey(savedKey);
        }
        
        useNotificationStore.getState().addNotification({
          type: 'info',
          message: `Switched to ${provider === 'huggingface' ? 'Hugging Face' : provider === 'groq' ? 'Groq' : 'OpenAI'} API`
        });
      },
      
      clearApiKey: () => {
        const provider = get().provider;
        
        // Only clear if it's not the env key
        const envKey = import.meta.env[`VITE_${provider.toUpperCase()}_API_KEY`];
        const currentKey = get().apiKey;
        
        if (currentKey && currentKey !== envKey) {
          const storedKeys = getStoredKeys();
          delete storedKeys[provider];
          storeKeys(storedKeys);
          
          set({ apiKey: envKey || null, isValidated: Boolean(envKey) });
          
          useNotificationStore.getState().addNotification({
            type: 'info',
            message: `${provider === 'huggingface' ? 'Hugging Face' : provider === 'groq' ? 'Groq' : 'OpenAI'} API key cleared`
          });
        }
      },

      initializeFromStorage: () => {
        const storedKeys = getStoredKeys();
        const provider = get().provider;
        const savedKey = storedKeys[provider];
        
        if (savedKey) {
          set({ apiKey: savedKey });
          get().setApiKey(savedKey);
        }
      }
    }),
    {
      name: 'juicer-api-provider',
      partialize: (state) => ({
        provider: state.provider,
        apiKey: state.apiKey,
        isValidated: state.isValidated
      }),
      storage: createJSONStorage(() => sessionStorage)
    }
  )
);