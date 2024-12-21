import { create } from 'zustand';
import { TranscriptionResult, Stats } from '../types';
import { dbOps } from '../db';

interface TranscriptionStore {
  transcriptions: TranscriptionResult[];
  exportData: () => void;
  importData: (data: any) => void;
  resetData: () => void;
  addTranscription: (transcription: TranscriptionResult) => void;
  removeTranscription: (id: string) => void;
  getStats: () => Promise<Stats>;
  loadTranscriptions: () => Promise<void>;
}

export const useTranscriptionStore = create<TranscriptionStore>((set, get) => ({
  transcriptions: [],
  
  exportData: () => {
    const state = get();
    const data = {
      transcriptions: state.transcriptions,
      stats: state.getStats()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `juicer-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  importData: async (data) => {
    if (data?.transcriptions) {
      await dbOps.clearTranscriptions();
      for (const transcription of data.transcriptions) {
        await dbOps.addTranscription(transcription);
      }
      set({ transcriptions: data.transcriptions });
    }
  },

  resetData: async () => {
    await dbOps.clearTranscriptions();
    set({ transcriptions: [] });
  },

  addTranscription: async (transcription) => {
    await dbOps.addTranscription(transcription);
    set((state) => ({
      transcriptions: [transcription, ...state.transcriptions]
    }));
  },
    
  removeTranscription: async (id) => {
    await dbOps.removeTranscription(id);
    set((state) => ({
      transcriptions: state.transcriptions.filter((t) => t.id !== id)
    }));
  },
    
  getStats: async () => await dbOps.getStats(),
  
  loadTranscriptions: async () => {
    const transcriptions = await dbOps.getAllTranscriptions();
    set({ transcriptions });
  }
}));