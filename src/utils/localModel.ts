import { pipeline, env } from '@xenova/transformers';

// Configure transformers.js to use persistent storage
env.localModelPath = 'indexeddb://text-juicer-models';
env.allowLocalModels = true;
env.useBrowserCache = true;
env.cachePrefix = 'text-juicer-v1';

// Model download states
export const ModelState = {
  IDLE: 'idle',
  DOWNLOADING: 'downloading',
  INITIALIZING: 'initializing',
  READY: 'ready',
  ERROR: 'error'
};

const modelCache = new Map();
let currentModelState = ModelState.IDLE;

// Default offline model configuration
export const OFFLINE_MODEL = {
  id: 'openai/whisper-tiny',
  name: 'Tiny (Multilingual)',
  size: '39MB',
  parameters: '39M'
};

export function getModelState(): string {
  return currentModelState;
}

function updateModelState(state: string) {
  currentModelState = state;
  window.dispatchEvent(new CustomEvent('modelStateChange', { detail: { state } }));
}

interface WhisperPipeline {
  transcribe: (audio: File) => Promise<{
    text: string;
    chunks: Array<{ timestamp: [number, number]; text: string }>;
  }>;
}

export async function initializeLocalModel(modelId: string): Promise<void> {
  try {
    updateModelState(ModelState.DOWNLOADING);
    
    if (!modelCache.has(modelId)) {
      // First, check if model exists in IndexedDB
      const modelExists = await checkModelInStorage(modelId);
      
      if (!modelExists) {
        console.log('Model not found in storage, downloading...');
      } else {
        console.log('Model found in storage, initializing...');
      }
      
      updateModelState(ModelState.INITIALIZING);
      
      const pipe = await pipeline('automatic-speech-recognition', modelId, {
        quantized: true,
        progress_callback: (progress) => {
          if (progress.status === 'progress') {
            if (!modelExists) {
              console.log(`Downloading model: ${Math.round(progress.progress * 100)}%`);
            }
            window.dispatchEvent(new CustomEvent('modelDownloadProgress', {
              detail: { progress: progress.progress * 100 }
            }));
          }
        },
        cache_dir: 'indexeddb://models'
      });
      modelCache.set(modelId, pipe);
      updateModelState(ModelState.READY);
    }
  } catch (error) {
    console.error('Failed to initialize model:', error);
    updateModelState(ModelState.ERROR);
    modelCache.delete(modelId);
    throw new Error('Failed to initialize local model');
  }
}

export async function runLocalTranscription(
  audioFile: File, 
  modelId: string
): Promise<{ text: string; timestamps: Array<{ time: number; text: string }> }> {
  updateModelState(ModelState.INITIALIZING);
  if (!modelCache.has(modelId)) {
    await initializeLocalModel(modelId);
  }

  try {
    const whisperPipeline = modelCache.get(modelId);
    const result = await whisperPipeline(audioFile, {
      chunk_length_s: 15,
      stride_length_s: 2.5,
      return_timestamps: true,
      max_new_tokens: 128
    });
    updateModelState(ModelState.READY);

    return {
      text: result.text,
      timestamps: result.chunks.map((chunk: any) => ({
        time: chunk.timestamp[0],
        text: chunk.text
      }))
    };
  } catch (error) {
    updateModelState(ModelState.ERROR);
    console.error('Transcription failed:', error);
    throw new Error('Failed to transcribe audio using local model');
  }
}

async function checkModelInStorage(modelId: string): Promise<boolean> {
  try {
    const db = await openDB();
    const store = db.transaction('models', 'readonly').objectStore('models');
    const modelFiles = await store.getAllKeys();
    return modelFiles.some(key => key.toString().includes(modelId));
  } catch (error) {
    console.error('Error checking model storage:', error);
    return false;
  }
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('text-juicer-models', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}