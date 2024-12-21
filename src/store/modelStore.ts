import { create } from 'zustand';
import { ApiProvider } from './apiKeyStore';
import { useApiKeyStore } from './apiKeyStore';
import { useNotificationStore } from './notificationStore';

interface WhisperModel {
  id: string;
  name: string;
  provider: ApiProvider;
  isDefault?: boolean;
}

interface ModelStore {
  selectedModel: string;
  setSelectedModel: (modelId: string) => void;
  availableModels: WhisperModel[];
  getModelsForProvider: (provider: ApiProvider) => Promise<WhisperModel[]>;
  setAvailableModels: (models: WhisperModel[]) => void;
}

const defaultModels: WhisperModel[] = [
  {
    id: 'openai/whisper-large-v3',
    name: 'Whisper Large V3 (Best Quality)',
    provider: 'huggingface',
    isDefault: true
  },
  {
    id: 'openai/whisper-medium',
    name: 'Whisper Medium (Balanced)',
    provider: 'huggingface',
    isDefault: true
  },
  {
    id: 'openai/whisper-small',
    name: 'Whisper Small (Fast)',
    provider: 'huggingface',
    isDefault: true
  }
];

const groqDefaultModels: WhisperModel[] = [
  {
    id: 'whisper-large-v3',
    name: 'Whisper Large V3',
    provider: 'groq',
    isDefault: true
  }
];
export const useModelStore = create<ModelStore>((set, get) => ({
  selectedModel: 'openai/whisper-large-v3',
  setSelectedModel: (modelId) => set({ selectedModel: modelId }),
  availableModels: defaultModels,
  setAvailableModels: (models) => set({ availableModels: models }),
  
  getModelsForProvider: async (provider: ApiProvider) => {
    if (provider === 'groq') {
      try {
        const { apiKey } = useApiKeyStore.getState();
        if (!apiKey) {
          set({ availableModels: groqDefaultModels });
          return groqDefaultModels;
        }

        const response = await fetch('https://api.groq.com/openai/v1/models', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch Groq models: ${response.status}`);
        }
        
        const data = await response.json();
        if (!data.data || !Array.isArray(data.data)) {
          throw new Error('Invalid response format from Groq API');
        }
        
        const whisperModels = data.data
          .filter((model: any) => model.id.toLowerCase().includes('whisper'))
          .map((model: any) => ({
            id: model.id,
            name: model.id.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
            provider: 'groq' as ApiProvider
          }));
        
        if (whisperModels.length === 0) {
          set({ availableModels: groqDefaultModels });
          return groqDefaultModels;
        }
        
        // If no Whisper models found, use defaults
        const models = whisperModels.length > 0 ? whisperModels : groqDefaultModels;
        set({ availableModels: models });
        return models;
      } catch (error) {
        console.error('Failed to fetch Groq models:', error);
        useNotificationStore.getState().addNotification({
          type: 'error',
          message: 'Failed to fetch Groq models, using defaults'
        });
        set({ availableModels: groqDefaultModels });
        return groqDefaultModels;
      }
    } else {
      // For Hugging Face, return default models
      const hfModels = defaultModels;
      set({ availableModels: hfModels });
      return hfModels;
    }
  }
}));