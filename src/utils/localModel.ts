import { pipeline, env } from '@xenova/transformers';

/**
 * Configure transformers.js to use persistent storage (IndexedDB)
 */
env.cacheDir = 'indexeddb://transformers';
env.useBrowserCache = true;

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

/**
 * Get the current model state
 */
export function getModelState(): string {
  return currentModelState;
}

/**
 * Update the model state and dispatch an event
 */
function updateModelState(state: string) {
  currentModelState = state;
  window.dispatchEvent(new CustomEvent('modelStateChange', { detail: { state } }));
}

interface TranscriptionResult {
  text: string;
  timestamps: Array<{ time: number; text: string }>;
}

/**
 * Initialize the local Whisper model
 * Downloads the model if not already cached
 */
export async function initializeLocalModel(modelId: string): Promise<void> {
  try {
    updateModelState(ModelState.DOWNLOADING);

    if (!modelCache.has(modelId)) {
      // Load the pre-trained model
      const pipe = await pipeline('automatic-speech-recognition', modelId, {
        progress_callback: (progress) => {
          if (progress.status === 'progress') {
            const percentage = Math.round(progress.progress * 100);
            console.log(`Downloading model: ${percentage}%`);
            window.dispatchEvent(new CustomEvent('modelDownloadProgress', {
              detail: { progress: percentage }
            }));
          }
        },
      });

      modelCache.set(modelId, pipe);
    }

    updateModelState(ModelState.READY);
  } catch (error) {
    console.error('Failed to initialize model:', error);
    updateModelState(ModelState.ERROR);
    throw new Error('Failed to initialize local model');
  }
}

/**
 * Run local transcription using the initialized model
 */
export async function runLocalTranscription(
  audioFile: File,
  modelId: string
): Promise<TranscriptionResult> {
  try {
    const pipeline = modelCache.get(modelId);
    if (!pipeline) {
      throw new Error('Model not initialized');
    }

    const result = await pipeline(audioFile, {
      chunk_length_s: 30,
      return_timestamps: true,
    });

    return {
      text: result.text,
      timestamps: result.chunks.map((chunk: any) => ({
        time: chunk.timestamp[0],
        text: chunk.text,
      })),
    };
  } catch (error) {
    console.error('Transcription failed:', error);
    throw new Error('Failed to transcribe audio using local model');
  }
}