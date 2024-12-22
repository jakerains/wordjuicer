import { create } from 'zustand';

export interface ChunkProgress {
  id: number;
  start: number;
  end: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
}

export interface ProgressState {
  fileSize: number;
  fileName: string;
  totalChunks: number;
  completedChunks: number;
  currentChunk: number;
  chunks: ChunkProgress[];
  status: 'idle' | 'preparing' | 'processing' | 'completed' | 'error';
  startTime?: number;
  endTime?: number;
  error?: string;
  provider: string;
}

interface ProgressStore {
  progress: ProgressState;
  initialize: (fileName: string, fileSize: number, totalChunks: number, provider: string) => void;
  updateChunk: (chunkId: number, update: Partial<ChunkProgress>) => void;
  setStatus: (status: ProgressState['status'], error?: string) => void;
  reset: () => void;
  getProgress: () => number;
  getTimeRemaining: () => number | null;
}

const initialState: ProgressState = {
  fileSize: 0,
  fileName: '',
  totalChunks: 0,
  completedChunks: 0,
  currentChunk: 0,
  chunks: [],
  status: 'idle',
  provider: ''
};

export const useProgressStore = create<ProgressStore>((set, get) => ({
  progress: initialState,

  initialize: (fileName, fileSize, totalChunks, provider) => {
    const chunks: ChunkProgress[] = Array.from({ length: totalChunks }, (_, i) => ({
      id: i,
      start: (i * fileSize) / totalChunks,
      end: ((i + 1) * fileSize) / totalChunks,
      status: 'pending',
      progress: 0
    }));

    set({
      progress: {
        ...initialState,
        fileName,
        fileSize,
        totalChunks,
        chunks,
        status: 'preparing',
        startTime: Date.now(),
        provider
      }
    });
  },

  updateChunk: (chunkId, update) => {
    set((state) => {
      const chunks = [...state.progress.chunks];
      const chunkIndex = chunks.findIndex((c) => c.id === chunkId);
      
      if (chunkIndex === -1) return state;

      chunks[chunkIndex] = { ...chunks[chunkIndex], ...update };
      
      const completedChunks = chunks.filter((c) => c.status === 'completed').length;
      const hasError = chunks.some((c) => c.status === 'error');
      
      return {
        progress: {
          ...state.progress,
          chunks,
          completedChunks,
          currentChunk: chunkId,
          status: hasError ? 'error' : completedChunks === state.progress.totalChunks ? 'completed' : 'processing',
          endTime: completedChunks === state.progress.totalChunks ? Date.now() : undefined
        }
      };
    });
  },

  setStatus: (status, error) => {
    set((state) => ({
      progress: {
        ...state.progress,
        status,
        error,
        endTime: ['completed', 'error'].includes(status) ? Date.now() : state.progress.endTime
      }
    }));
  },

  reset: () => {
    set({ progress: initialState });
  },

  getProgress: () => {
    const state = get().progress;
    if (state.status === 'idle' || state.status === 'preparing') return 0;
    if (state.status === 'completed') return 100;
    
    const totalProgress = state.chunks.reduce((acc, chunk) => {
      if (chunk.status === 'completed') return acc + 100;
      if (chunk.status === 'processing') return acc + chunk.progress;
      return acc;
    }, 0);
    
    return Math.round((totalProgress / (state.totalChunks * 100)) * 100);
  },

  getTimeRemaining: () => {
    const state = get().progress;
    if (!state.startTime || state.status !== 'processing') return null;
    
    const elapsedTime = Date.now() - state.startTime;
    const progress = get().getProgress();
    
    if (progress === 0) return null;
    
    const totalEstimatedTime = (elapsedTime * 100) / progress;
    return Math.max(0, totalEstimatedTime - elapsedTime);
  }
})); 