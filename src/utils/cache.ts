import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CacheItem {
  text: string;
  timestamps: Array<{ time: number; text: string }>;
  fileHash: string;
  provider: string;
  createdAt: number;
  fileSize: number;
  duration: number;
}

interface CacheStore {
  items: Record<string, CacheItem>;
  maxItems: number;
  maxAge: number; // milliseconds
  addItem: (key: string, item: Omit<CacheItem, 'createdAt'>) => void;
  getItem: (key: string) => CacheItem | undefined;
  removeItem: (key: string) => void;
  clear: () => void;
  prune: () => void;
}

// Default cache configuration
const MAX_CACHE_ITEMS = 100;
const MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

// Create a hash from file content for cache key
export async function createFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Get audio duration
export async function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const url = URL.createObjectURL(file);
    
    audio.addEventListener('loadedmetadata', () => {
      URL.revokeObjectURL(url);
      resolve(audio.duration);
    });
    
    audio.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load audio file'));
    });
    
    audio.src = url;
  });
}

export const useCacheStore = create<CacheStore>()(
  persist(
    (set, get) => ({
      items: {},
      maxItems: MAX_CACHE_ITEMS,
      maxAge: MAX_CACHE_AGE,

      addItem: (key, item) => {
        set((state) => {
          // Prune cache if needed
          if (Object.keys(state.items).length >= state.maxItems) {
            const items = { ...state.items };
            const oldestKey = Object.entries(items)
              .sort(([, a], [, b]) => a.createdAt - b.createdAt)[0][0];
            delete items[oldestKey];
            return {
              items: {
                ...items,
                [key]: { ...item, createdAt: Date.now() }
              }
            };
          }
          
          return {
            items: {
              ...state.items,
              [key]: { ...item, createdAt: Date.now() }
            }
          };
        });
      },

      getItem: (key) => {
        const state = get();
        const item = state.items[key];
        
        if (!item) return undefined;
        
        // Check if item has expired
        if (Date.now() - item.createdAt > state.maxAge) {
          state.removeItem(key);
          return undefined;
        }
        
        return item;
      },

      removeItem: (key) => {
        set((state) => ({
          items: Object.fromEntries(
            Object.entries(state.items).filter(([k]) => k !== key)
          )
        }));
      },

      clear: () => {
        set({ items: {} });
      },

      prune: () => {
        set((state) => {
          const now = Date.now();
          return {
            items: Object.fromEntries(
              Object.entries(state.items).filter(
                ([, item]) => now - item.createdAt <= state.maxAge
              )
            )
          };
        });
      }
    }),
    {
      name: 'transcription-cache',
      version: 1
    }
  )
); 