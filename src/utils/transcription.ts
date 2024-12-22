import { useModelStore } from '../store/modelStore';
import { useApiKeyStore } from '../store/apiKeyStore';
import { useNotificationStore } from '../store/notificationStore';

// Maximum chunk size (5MB)
const MAX_CHUNK_SIZE = 5 * 1024 * 1024;
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 5000; // 5 seconds

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
  let allResults: { text: string; timestamps: Array<{ time: number; text: string }> }[] = [];

  if (!apiKey || !isValidated) {
    throw new Error(`Please add a valid ${provider === 'huggingface' ? 'Hugging Face' : provider === 'groq' ? 'Groq' : 'OpenAI'} API key in settings`);
  }

  // Process file in chunks
  for await (const chunk of createChunks(file)) {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
          addNotification({
            type: 'info',
            message: `Model busy, retrying in ${delay / 1000} seconds (Attempt ${attempt + 1}/${MAX_RETRIES})`
          });
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        const result = await performTranscription(chunk, apiKey, provider);
        allResults.push(result);
        break;
      } catch (error) {
        lastError = error as Error;
        console.error('Transcription error:', error);

        if (!error.toString().includes('Model too busy') || attempt === MAX_RETRIES - 1) {
          throw error;
        }
      }
    }
  }

  // Combine results
  return {
    text: allResults.map(r => r.text).join(' '),
    timestamps: allResults.flatMap((r, i) => {
      const timeOffset = i * (MAX_CHUNK_SIZE / file.size) * file.size;
      return r.timestamps.map(t => ({
        time: t.time + timeOffset,
        text: t.text
      }));
    })
  };
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
      // Create a new File with proper name and MIME type
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
      
      // Create a new File with proper name and MIME type
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
      // Create a new File with proper name and MIME type
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
  console.log('FormData contents:', Array.from(formData.entries()));
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: formData,
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-store',
      // Add signal to abort request if it takes too long
      signal: AbortSignal.timeout(60000), // 60 second timeout for larger files
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      
      // Handle specific Hugging Face errors
      if (provider === 'huggingface') {
        try {
          const error = JSON.parse(errorText);
          if (response.status === 503 && error.error?.includes('currently loading')) {
            const estimatedTime = error.estimated_time || 20;
            const waitTime = Math.ceil(estimatedTime * 1000); // Convert to milliseconds
            console.log(`Model loading, waiting for ${waitTime}ms`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            throw new Error('Model too busy'); // This will trigger a retry
          } else if (response.status === 404) {
            throw new Error('Model not found. Please check your settings.');
          }
        } catch (e) {
          if (e.message === 'Model too busy') throw e;
          // If JSON parsing fails, fall through to generic error
        }
      }
      
      try {
        const error = JSON.parse(errorText);
        throw new Error(error.error?.message || error.error || `Failed to transcribe audio (${response.status})`);
      } catch (e) {
        if (e.message === 'Model too busy') throw e;
        throw new Error(`Failed to transcribe audio (${response.status}): ${errorText}`);
      }
    }
    
    const result = await response.json();
    console.log('API Response:', result);
    
    let timestamps = [];
    let text = '';
    
    switch (provider) {
      case 'huggingface': {
        // Handle both new and old response formats
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
    
    // If no timestamps but we have text, create a simple timestamp
    if (timestamps.length === 0 && text) {
      timestamps = [{
        time: 0,
        text: text
      }];
    }
    
    // If no text but we have timestamps, concatenate them
    if (!text && timestamps.length > 0) {
      text = timestamps.map(t => t.text).join(' ');
    }
    
    return {
      text,
      timestamps
    };
  } catch (error) {
    console.error('Transcription error:', error);
    throw error;
  }
}