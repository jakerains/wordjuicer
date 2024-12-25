import { useModelStore } from '../store/modelStore';
import { useApiKeyStore } from '../store/apiKeyStore';
import { useNotificationStore } from '../store/notificationStore';
import { createRetryWrapper, SERVICE_RETRY_CONFIGS } from './retry';
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
  const { apiKey, isValidated, provider } = useApiKeyStore.getState();
  const addNotification = useNotificationStore.getState().addNotification;
  const { getItem, addItem } = useCacheStore.getState();
  const progressStore = useProgressStore.getState();
  
  let allResults: { text: string; timestamps: Array<{ time: number; text: string }> }[] = [];

  if (!apiKey || !isValidated) {
    throw new Error(`Please add a valid ${provider === 'huggingface' ? 'Hugging Face' : provider === 'groq' ? 'Groq' : 'OpenAI'} API key in settings`);
  }

  // Reset progress tracking
  progressStore.reset();

  // Check cache first
  try {
    const fileHash = await createFileHash(file);
    const cachedResult = getItem(fileHash);
    
    if (cachedResult) {
      progressStore.initialize(file.name, file.size, 1, provider);
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
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      // Convert audio chunk to base64
      const audioBase64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          resolve(base64.split(',')[1]); // Remove data URL prefix
        };
        reader.readAsDataURL(chunk);
      });

      // Send as JSON payload instead of FormData
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          inputs: audioBase64,
          parameters: {
            wait_for_model: true,
            return_timestamps: true,
            chunk_length_s: 30,
            stride_length_s: 5,
            language: 'en',
            task: 'transcribe',
            return_segments: true,
            batch_size: 1,
            num_beams: 1,
            temperature: 0,
            compression_ratio_threshold: 2.4,
            logprob_threshold: -1,
            no_speech_threshold: 0.6,
            condition_on_previous_text: false
          }
        })
      });

      if (!response.ok) {
        let errorMessage = `API request failed with status ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If parsing error response fails, use default message
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      return {
        text: result.text || '',
        timestamps: result.chunks?.map((chunk: any) => ({
          time: chunk.timestamp[0],
          text: chunk.text
        })) || []
      };
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
      formData.append('model', 'whisper-large-v3');
      formData.append('response_format', 'verbose_json');
      formData.append('language', 'en');
      formData.append('temperature', '0');
      formData.append('timestamp_granularities', 'word');
      formData.append('prompt', 'This is an audio transcription.');
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: formData
      });

      if (!response.ok) {
        let errorMessage = `API request failed with status ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If parsing error response fails, use default message
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      if (!result.text) {
        throw new Error('No transcription data available from Groq');
      }

      return {
        text: result.text,
        timestamps: result.segments?.map((segment: any) => ({
          time: segment.start,
          text: segment.text.trim()
        })) || []
      };
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
    body: formData
  });

  if (!response.ok) {
    let errorMessage = `API request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      // If parsing error response fails, use default message
    }
    throw new Error(errorMessage);
  }

  const result = await response.json();
  
  // Process response based on provider
  switch (provider) {
    case 'huggingface': {
      return {
        text: result.text || '',
        timestamps: result.chunks?.map((chunk: any) => ({
          time: chunk.timestamp[0],
          text: chunk.text
        })) || []
      };
    }
      
    case 'groq':
    case 'openai': {
      return {
        text: result.text || '',
        timestamps: result.segments?.map((segment: any) => ({
          time: segment.start,
          text: segment.text
        })) || []
      };
    }
      
    default:
      throw new Error('Invalid provider');
  }
}