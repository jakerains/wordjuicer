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

    // If any environment variables exist, use them
    if (envKeys.huggingface || envKeys.groq || envKeys.openai) {
      return envKeys;
    }

    // Otherwise fall back to session storage
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function storeKeys(keys: StoredKeys) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
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
      provider: 'huggingface',
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
          
          // Store the validated key
          const storedKeys = getStoredKeys();
          storedKeys[provider] = key;
          storeKeys(storedKeys);
          
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
          isValidated: false 
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
        
        // Remove the key for the current provider
        const storedKeys = getStoredKeys();
        delete storedKeys[provider];
        storeKeys(storedKeys);
        
        set({ apiKey: null, isValidated: false });
        
        useNotificationStore.getState().addNotification({
          type: 'info',
          message: `${provider === 'huggingface' ? 'Hugging Face' : provider === 'groq' ? 'Groq' : 'OpenAI'} API key cleared`
        });
      },

      initializeFromStorage: () => {
        const storedKeys = {
          huggingface: import.meta.env.VITE_HUGGINGFACE_API_KEY || '',
          groq: import.meta.env.VITE_GROQ_API_KEY || '',
          openai: import.meta.env.VITE_OPENAI_API_KEY || ''
        };
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