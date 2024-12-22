import { create } from 'zustand';
import { transcribeAudio } from './transcription';
import { useNotificationStore } from '../store/notificationStore';
import { useTranscriptionStore } from '../store/transcriptionStore';

export interface QueueItem {
  id: string;
  file: File;
  status: 'queued' | 'processing' | 'completed' | 'error';
  error?: string;
  addedAt: number;
  startedAt?: number;
  completedAt?: number;
  result?: {
    text: string;
    timestamps: Array<{ time: number; text: string }>;
  };
}

interface QueueStore {
  items: QueueItem[];
  isProcessing: boolean;
  maxConcurrent: number;
  addItem: (file: File) => void;
  removeItem: (id: string) => void;
  clearQueue: () => void;
  processQueue: () => Promise<void>;
  getQueueStatus: () => {
    total: number;
    queued: number;
    processing: number;
    completed: number;
    error: number;
  };
}

// Create a unique ID for queue items
const createId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useQueueStore = create<QueueStore>((set, get) => ({
  items: [],
  isProcessing: false,
  maxConcurrent: 1, // Process one file at a time

  addItem: (file: File) => {
    const newItem: QueueItem = {
      id: createId(),
      file,
      status: 'queued',
      addedAt: Date.now()
    };

    set((state) => ({
      items: [...state.items, newItem]
    }));

    // Start processing if not already processing
    if (!get().isProcessing) {
      get().processQueue();
    }
  },

  removeItem: (id: string) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== id)
    }));
  },

  clearQueue: () => {
    set((state) => ({
      items: state.items.filter((item) => item.status === 'processing')
    }));
  },

  processQueue: async () => {
    const state = get();
    if (state.isProcessing) return;

    set({ isProcessing: true });
    const addNotification = useNotificationStore.getState().addNotification;
    const { addTranscription } = useTranscriptionStore.getState();

    try {
      while (true) {
        // Get next queued item
        const nextItem = state.items.find((item) => item.status === 'queued');
        if (!nextItem) break;

        // Update item status to processing
        set((state) => ({
          items: state.items.map((item) =>
            item.id === nextItem.id
              ? { ...item, status: 'processing', startedAt: Date.now() }
              : item
          )
        }));

        try {
          // Process the item
          const result = await transcribeAudio(nextItem.file);

          // Add to history
          addTranscription({
            id: nextItem.id,
            fileName: nextItem.file.name,
            fileSize: nextItem.file.size,
            text: result.text,
            timestamps: result.timestamps,
            createdAt: new Date().toISOString()
          });

          // Update item with result
          set((state) => ({
            items: state.items.map((item) =>
              item.id === nextItem.id
                ? {
                    ...item,
                    status: 'completed',
                    completedAt: Date.now(),
                    result
                  }
                : item
            )
          }));

          addNotification({
            type: 'success',
            message: `Transcription completed: ${nextItem.file.name}`
          });

          // Clean up completed items after 5 minutes
          setTimeout(() => {
            set((state) => ({
              items: state.items.filter((item) => item.id !== nextItem.id)
            }));
          }, 5 * 60 * 1000);
        } catch (error) {
          // Update item with error
          set((state) => ({
            items: state.items.map((item) =>
              item.id === nextItem.id
                ? {
                    ...item,
                    status: 'error',
                    completedAt: Date.now(),
                    error: error instanceof Error ? error.message : 'Unknown error'
                  }
                : item
            )
          }));

          addNotification({
            type: 'error',
            message: `Failed to transcribe ${nextItem.file.name}: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`
          });
        }
      }
    } finally {
      set({ isProcessing: false });
    }
  },

  getQueueStatus: () => {
    const items = get().items;
    return {
      total: items.length,
      queued: items.filter((item) => item.status === 'queued').length,
      processing: items.filter((item) => item.status === 'processing').length,
      completed: items.filter((item) => item.status === 'completed').length,
      error: items.filter((item) => item.status === 'error').length
    };
  }
})); 