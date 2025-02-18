import { create } from 'zustand';

interface ModelStore {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
}

export const useModelStore = create<ModelStore>((set) => ({
  selectedModel: 'whisper-large-v3-turbo',
  setSelectedModel: (model) => set({ selectedModel: model }),
}));