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
      apiUrl = 'https://api-inference.huggingface.co/models/openai/whisper-large-v3';
      headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'audio/wav'
      };

      // Convert audio chunk to binary data
      const arrayBuffer = await chunk.arrayBuffer();
      const binaryData = new Uint8Array(arrayBuffer);
      
      // Make request directly for Hugging Face with retries for cold starts
      let retries = 0;
      const maxRetries = 3;
      
      while (retries < maxRetries) {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers,
          body: binaryData
        });

        if (response.status === 503) {
          // Model is loading (cold start)
          console.log('Model is loading, waiting before retry...');
          await new Promise(resolve => setTimeout(resolve, 2000));  // Wait 2 seconds
          retries++;
          continue;
        }

        if (!response.ok) {
          let errorMessage = `API request failed with status ${response.status}`;
          try {
            const errorData = await response.json();
            if (errorData.error?.includes('token seems invalid')) {
              throw new Error('Invalid Hugging Face API token. Please check your token and ensure you have access to the model.');
            }
            errorMessage = errorData.error || `Hugging Face API error: ${response.status}`;
            console.error('Hugging Face API error details:', errorData);
          } catch (e) {
            console.error('Error parsing Hugging Face error response:', e);
          }
          throw new Error(errorMessage);
        }

        const result = await response.json();
        console.log('Hugging Face response:', result);
        
        // Extract text from the response object
        let transcribedText = '';
        
        // Handle the case where the response has a duplicate text property
        if (typeof result === 'object') {
          // Get all text properties from the object
          const textValues = Object.values(result).filter(value => 
            typeof value === 'string' && value.length > 0
          );
          
          // Use the longest text value (likely the full transcription)
          transcribedText = textValues.reduce((longest, current) => 
            current.length > longest.length ? current : longest
          , '');
        } else if (typeof result === 'string') {
          transcribedText = result;
        }

        console.log('Extracted transcription text:', transcribedText);

        if (!transcribedText) {
          console.error('No valid transcription found in response:', result);
          throw new Error('No valid transcription found in response');
        }

        // Return the processed result
        return {
          text: transcribedText,
          timestamps: []  // Hugging Face doesn't provide timestamps in this format
        };
      }
      
      throw new Error('Model failed to load after maximum retries');
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
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: formData
      });

      if (!response.ok) {
        let errorMessage = `API request failed with status ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error?.message || errorData.error || errorMessage;
          console.error('Groq API error details:', errorData);
        } catch (e) {
          console.error('Error parsing Groq error response:', e);
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

  // This section only runs for OpenAI since Hugging Face and Groq return early
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
  
  // Process response for OpenAI only
  return {
    text: result.text || '',
    timestamps: result.segments?.map((segment: any) => ({
      time: segment.start,
      text: segment.text
    })) || []
  };
}