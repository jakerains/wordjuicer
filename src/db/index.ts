import { TranscriptionResult, Stats } from '../types';

// Interface for storage operations
interface StorageAdapter {
  addTranscription(transcription: TranscriptionResult): Promise<void>;
  removeTranscription(id: string): Promise<void>;
  getAllTranscriptions(): Promise<TranscriptionResult[]>;
  clearTranscriptions(): Promise<void>;
  getStats(): Promise<Stats>;
}

// IndexedDB implementation for browser
class BrowserStorage implements StorageAdapter {
  private dbName = 'juicer';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('transcriptions')) {
          db.createObjectStore('transcriptions', { keyPath: 'id' });
        }
      };
    });
  }

  async addTranscription(transcription: TranscriptionResult): Promise<void> {
    return this.performTransaction('transcriptions', 'readwrite', (store) => {
      store.add(transcription);
    });
  }

  async removeTranscription(id: string): Promise<void> {
    return this.performTransaction('transcriptions', 'readwrite', (store) => {
      store.delete(id);
    });
  }

  async getAllTranscriptions(): Promise<TranscriptionResult[]> {
    return this.performTransaction('transcriptions', 'readonly', (store) => {
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    });
  }

  async clearTranscriptions(): Promise<void> {
    return this.performTransaction('transcriptions', 'readwrite', (store) => {
      store.clear();
    });
  }

  async getStats(): Promise<Stats> {
    const transcriptions = await this.getAllTranscriptions();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    return {
      totalTranscriptions: transcriptions.length,
      totalDuration: transcriptions.reduce((acc, t) => acc + t.duration, 0),
      completedToday: transcriptions.filter(
        t => t.status === 'completed' && t.date >= startOfDay
      ).length
    };
  }

  private async performTransaction<T>(
    storeName: string,
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => void | Promise<T>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);

      const result = operation(store);
      if (result instanceof Promise) {
        result.then(resolve).catch(reject);
      }
    });
  }
}

// Create and export storage instance
const storage = new BrowserStorage();

export const initializeDatabase = () => storage.init();
export const dbOps = storage;