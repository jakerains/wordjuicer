import { useModelStore } from '../store/modelStore';
import { useApiKeyStore } from '../store/apiKeyStore';
import { useNotificationStore } from '../store/notificationStore';
import { createRetryWrapper, SERVICE_RETRY_CONFIGS } from './retry';
import { useHealthStore, shouldAvoidService, type ServiceProvider } from './healthCheck';
import { useCacheStore, createFileHash, getAudioDuration, type CacheItem } from './cache';
import { useProgressStore } from './progress';

// Maximum chunk size (5MB)
const MAX_CHUNK_SIZE = 5 * 1024 * 1024;

async function* createChunks(file: File) {
  const totalSize = file.size;
  let start = 0;
  
  while (start < totalSize) {
    const end = Math.min(start + MAX_CHUNK_SIZE, totalSize);
    const chunk = file.slice(start, end);
    yield chunk;
    start = end;
  }
}

export async function transcribeAudio(
  file: File
): Promise<{ text: string; timestamps: Array<{ time: number; text: string }> }> {
  const { selectedModel } = useModelStore.getState();
  const { apiKey, isValidated, provider: initialProvider } = useApiKeyStore.getState();
  const addNotification = useNotificationStore.getState().addNotification;
  const healthStore = useHealthStore.getState();
  const { getItem, addItem } = useCacheStore.getState();
  const progressStore = useProgressStore.getState();
  
  let allResults: { text: string; timestamps: Array<{ time: number; text: string }> }[] = [];

  if (!apiKey || !isValidated) {
    throw new Error(`Please add a valid ${initialProvider === 'huggingface' ? 'Hugging Face' : initialProvider === 'groq' ? 'Groq' : 'OpenAI'} API key in settings`);
  }

  // Reset progress tracking
  progressStore.reset();

  // Check cache first
  try {
    const fileHash = await createFileHash(file);
    const cachedResult = getItem(fileHash);
    
    if (cachedResult) {
      progressStore.initialize(file.name, file.size, 1, cachedResult.provider);
      progressStore.updateChunk(0, { status: 'completed', progress: 100 });
      progressStore.setStatus('completed');
      
      addNotification({
        type: 'info',
        message: 'Using cached transcription'
      });
      return {
        text: cachedResult.text,
        timestamps: cachedResult.timestamps
      };
    }
  } catch (error) {
    console.error('Cache lookup failed:', error);
    // Continue with transcription if cache fails
  }

  // Check service health before starting
  await healthStore.checkHealth();
  
  // Get the best available service
  let provider = healthStore.getPreferredService();
  
  // If the initial provider is down, notify about switching
  if (provider !== initialProvider) {
    addNotification({
      type: 'warning',
      message: `${initialProvider} service is unavailable. Switching to ${provider}.`
    });
  }

  // Initialize progress tracking
  const totalChunks = Math.ceil(file.size / MAX_CHUNK_SIZE);
  progressStore.initialize(file.name, file.size, totalChunks, provider);

  // Create a retry-wrapped version of performTranscription
  const transcribeWithRetry = createRetryWrapper(
    async (chunk: Blob, chunkId: number) => {
      try {
        progressStore.updateChunk(chunkId, { status: 'processing', progress: 0 });
        const result = await performTranscription(chunk, apiKey, provider);
        progressStore.updateChunk(chunkId, { status: 'completed', progress: 100 });
        return result;
      } catch (error) {
        // If the service fails, check health and potentially switch providers
        await healthStore.checkHealth(provider);
        
        if (shouldAvoidService(provider)) {
          const newProvider = healthStore.getPreferredService();
          if (newProvider !== provider) {
            provider = newProvider;
            progressStore.setStatus('processing', `Switching to ${provider} service...`);
            // Retry with new provider
            return performTranscription(chunk, apiKey, provider);
          }
        }
        
        progressStore.updateChunk(chunkId, { 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        throw error;
      }
    },
    SERVICE_RETRY_CONFIGS[provider]
  );

  // Process file in chunks
  let chunkId = 0;
  for await (const chunk of createChunks(file)) {
    try {
      const result = await transcribeWithRetry(chunk, chunkId);
      allResults.push(result);
      chunkId++;
    } catch (error) {
      console.error('Transcription error:', error);
      progressStore.setStatus('error', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  // Combine results
  const combinedResult = {
    text: allResults.map(r => r.text).join(' '),
    timestamps: allResults.flatMap((r, i) => {
      const timeOffset = i * (MAX_CHUNK_SIZE / file.size) * file.size;
      return r.timestamps.map(t => ({
        time: t.time + timeOffset,
        text: t.text
      }));
    })
  };

  // Cache the result
  try {
    const fileHash = await createFileHash(file);
    const duration = await getAudioDuration(file);
    
    addItem(fileHash, {
      ...combinedResult,
      fileHash,
      provider,
      fileSize: file.size,
      duration
    });
  } catch (error) {
    console.error('Failed to cache result:', error);
    // Continue even if caching fails
  }

  // Mark transcription as completed
  progressStore.setStatus('completed');

  return combinedResult;
}

async function performTranscription(
  chunk: Blob,
  apiKey: string,
  provider: string
): Promise<{ text: string; timestamps: Array<{ time: number; text: string }> }> {
  const formData = new FormData();
  
  let apiUrl: string;
  let headers: Record<string, string> = {};
  
  switch (provider) {
    case 'huggingface': {
      apiUrl = 'https://api-inference.huggingface.co/models/openai/whisper-large-v3-turbo';
      headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      };
      const audioFile = new File([chunk], 'audio.wav', { 
        type: chunk.type || 'audio/wav'
      });
      formData.append('file', audioFile);
      
      // Required parameters for long-form audio
      formData.append('wait_for_model', 'true');
      formData.append('return_timestamps', 'true');
      
      // Optional parameters for better transcription
      formData.append('chunk_length_s', '30');
      formData.append('stride_length_s', '5');
      formData.append('language', 'en');
      formData.append('task', 'transcribe');
      formData.append('return_segments', 'true');
      
      // Performance parameters
      formData.append('batch_size', '1');
      formData.append('num_beams', '1');
      formData.append('temperature', '0');
      formData.append('compression_ratio_threshold', '2.4');
      formData.append('logprob_threshold', '-1');
      formData.append('no_speech_threshold', '0.6');
      formData.append('condition_on_previous_text', 'false');
      break;
    }
      
    case 'groq': {
      apiUrl = 'https://api.groq.com/openai/v1/audio/transcriptions';
      headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      };
      
      const audioFile = new File([chunk], 'audio.wav', { 
        type: chunk.type || 'audio/wav'
      });
      formData.append('file', audioFile);
      formData.append('model', 'whisper-large-v3-turbo');
      formData.append('response_format', 'verbose_json');
      formData.append('language', 'en');
      formData.append('temperature', '0');
      break;
    }
      
    case 'openai': {
      apiUrl = 'https://api.openai.com/v1/audio/transcriptions';
      headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      };
      const audioFile = new File([chunk], 'audio.wav', { 
        type: chunk.type || 'audio/wav'
      });
      formData.append('file', audioFile);
      formData.append('model', 'whisper-1');
      formData.append('response_format', 'verbose_json');
      break;
    }
      
    default:
      throw new Error('Invalid provider');
  }

  console.log(`Making request to ${apiUrl} with provider ${provider}`);
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers,
    body: formData,
    mode: 'cors',
    credentials: 'omit',
    cache: 'no-store',
    signal: AbortSignal.timeout(60000), // 60 second timeout for larger files
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('API Error Response:', errorText);
    
    try {
      const error = JSON.parse(errorText);
      throw new Error(error.error?.message || error.error || `Failed to transcribe audio (${response.status})`);
    } catch (e) {
      throw new Error(`Failed to transcribe audio (${response.status}): ${errorText}`);
    }
  }
  
  const result = await response.json();
  console.log('API Response:', result);
  
  let timestamps = [];
  let text = '';
  
  switch (provider) {
    case 'huggingface': {
      if (typeof result === 'string') {
        text = result;
        timestamps = [{
          time: 0,
          text: result.trim()
        }];
      } else {
        text = result.text || '';
        if (result.chunks) {
          timestamps = result.chunks.map((chunk: any) => ({
            time: chunk.timestamp?.[0] || 0,
            text: chunk.text?.trim() || ''
          }));
        } else if (result.segments) {
          timestamps = result.segments.map((segment: any) => ({
            time: segment.start || 0,
            text: segment.text?.trim() || ''
          }));
        } else {
          timestamps = [{
            time: 0,
            text: text.trim()
          }];
        }
      }
      break;
    }
    
    case 'groq':
    case 'openai': {
      text = result.text || '';
      timestamps = result.segments?.map((segment: any) => ({
        time: segment.start,
        text: segment.text
      })) || [];
      break;
    }
  }
  
  return { text, timestamps };
}