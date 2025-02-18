import { create } from 'zustand';

// Define possible statuses for a chunk
export type ChunkStatus = 'idle' | 'processing' | 'completed' | 'error';

// Define the interface for a progress chunk
export interface ProgressChunk {
  status: ChunkStatus;
  progress: number;
  message?: string;
  error?: string;
}

// Define the progress store interface
export interface ProgressStore {
  currentChunk: ProgressChunk;
  status: string;
  initialize: (filename: string, size: number, chunkCount: number, provider: string) => void;
  reset: () => void;
  updateCurrentChunk: (update: Partial<ProgressChunk>) => void;
  updateChunk: (index: number, update: Partial<ProgressChunk>) => void;
  setStatus: (status: string, error?: string) => void;
}

export const useProgressStore = create<ProgressStore>((set) => ({
  currentChunk: { status: 'idle', progress: 0 },
  status: 'idle',
  
  // Initialize progress tracking for a new transcription process
  initialize: (filename, size, chunkCount, provider) => {
    set({
      currentChunk: {
        status: 'processing',
        progress: 0,
        message: `${filename} - initializing transcription process`
      },
      status: 'processing'
    });
  },

  // Reset progress to idle
  reset: () => {
    set({
      currentChunk: { status: 'idle', progress: 0 },
      status: 'idle'
    });
  },

  // Update the current chunk by merging the provided update
  updateCurrentChunk: (update) => {
    set((state) => ({
      currentChunk: { ...state.currentChunk, ...update }
    }));
  },

  // Update a specific chunk (if managing multiple chunks). Here we treat it the same as updating the current chunk.
  updateChunk: (index, update) => {
    set((state) => ({
      currentChunk: { ...state.currentChunk, ...update }
    }));
  },

  // Set the overall status and optionally record an error message
  setStatus: (status, error) => {
    set((state) => ({
      status,
      currentChunk: { ...state.currentChunk, status, error }
    }));
  }
})); 