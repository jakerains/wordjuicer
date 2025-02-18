import { useModelStore } from '../store/modelStore';
import { useApiKeyStore } from '../store/apiKeyStore';
import { useNotificationStore } from '../store/notificationStore';
import { createRetryWrapper, SERVICE_RETRY_CONFIGS } from './retry';
import { useCacheStore, createFileHash, getAudioDuration } from './cache';
import { useProgressStore } from './progress';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

// Maximum chunk size (25MB - Groq's limit)
const MAX_CHUNK_SIZE = 25 * 1024 * 1024;

// Initialize FFmpeg
let ffmpeg: FFmpeg | null = null;

// Initialize FFmpeg with progress tracking
async function initFFmpeg() {
  if (!ffmpeg) {
    ffmpeg = new FFmpeg();
    
    // Log FFmpeg messages
    ffmpeg.on('log', ({ message }) => {
      console.log('FFmpeg log:', message);
    });
    
    // Track progress
    ffmpeg.on('progress', ({ progress, time }) => {
      const percent = Math.round(progress * 100);
      console.log(`Converting: ${percent}%`);
      // Update progress store
      useProgressStore.getState().updateCurrentChunk({ 
        status: 'processing',
        progress: percent,
        message: `Converting audio: ${percent}%`
      });
    });

    try {
      // Load FFmpeg
      await ffmpeg.load();
      console.log('FFmpeg loaded successfully');
    } catch (error) {
      console.error('Failed to load FFmpeg:', error);
      throw new Error(`Failed to initialize audio converter: ${error.message}`);
    }
  }
  return ffmpeg;
}

// Audio conversion utility optimized for Groq
async function convertAudioToMp3(audioFile: File): Promise<File> {
  console.log('Starting audio conversion to MP3...', {
    originalSize: audioFile.size,
    originalType: audioFile.type
  });
  
  try {
    // Initialize FFmpeg if needed
    const ffmpeg = await initFFmpeg();
    
    // Get progress store instance
    const progressStore = useProgressStore.getState();
    
    // Update progress
    progressStore.updateCurrentChunk({ 
      status: 'processing',
      progress: 0,
      message: 'Preparing audio conversion...'
    });
    
    // Generate unique input and output filenames
    const inputFileName = `input_${Date.now()}.${audioFile.name.split('.').pop()}`;
    const outputFileName = `output_${Date.now()}.mp3`;
    
    // Write the file to FFmpeg's virtual filesystem
    await ffmpeg.writeFile(inputFileName, await fetchFile(audioFile));
    
    // Run FFmpeg command with optimized settings for Groq
    // -ar 16000: Set sample rate to 16kHz (optimal for Whisper)
    // -ac 1: Convert to mono
    // -b:a 32k: Set bitrate to 32kbps (good for speech)
    // -movflags +faststart: Optimize for streaming
    // -compression_level 8: Higher compression
    await ffmpeg.exec([
      '-i', inputFileName,
      '-ar', '16000',
      '-ac', '1',
      '-b:a', '32k',
      '-c:a', 'libmp3lame',
      '-compression_level', '8',
      '-movflags', '+faststart',
      outputFileName
    ]);
    
    // Read the result
    const data = await ffmpeg.readFile(outputFileName);
    
    // Create a new File from the converted data
    const convertedFile = new File([data.buffer], 
      audioFile.name.replace(/\.[^/.]+$/, '.mp3'),
      { type: 'audio/mpeg' }
    );
    
    // Log compression results
    console.log('Audio conversion completed:', {
      originalSize: audioFile.size,
      convertedSize: convertedFile.size,
      compressionRatio: (convertedFile.size / audioFile.size * 100).toFixed(2) + '%',
      type: convertedFile.type
    });
    
    // Clean up
    await ffmpeg.deleteFile(inputFileName);
    await ffmpeg.deleteFile(outputFileName);
    
    // Update progress
    progressStore.updateCurrentChunk({ 
      status: 'processing',
      progress: 100,
      message: 'Audio conversion completed'
    });
    
    return convertedFile;
  } catch (error) {
    console.error('Audio conversion failed:', error);
    // Update progress with error
    const progressStore = useProgressStore.getState();
    progressStore.updateCurrentChunk({ 
      status: 'error',
      error: `Audio conversion failed: ${error.message}`
    });
    throw new Error(`Failed to convert audio: ${error.message}`);
  }
}

async function* createChunks(file: File) {
  const totalSize = file.size;
  let start = 0;
  
  // Normalize MIME type
  let mimeType = file.type;
  if (!mimeType || mimeType === 'audio/m4a' || mimeType === 'audio/x-m4a') {
    mimeType = 'audio/mp4';
  } else if (mimeType === 'audio/mpeg3' || mimeType === 'audio/x-mpeg3') {
    mimeType = 'audio/mpeg';
  }
  
  console.log('Normalized MIME type:', mimeType);
  
  while (start < totalSize) {
    const end = Math.min(start + MAX_CHUNK_SIZE, totalSize);
    const chunk = file.slice(start, end);
    const chunkFile = new File([chunk], file.name, { type: mimeType });
    yield chunkFile;
    start = end;
  }
}

export async function transcribeAudio(
  file: File
): Promise<{ text: string; timestamps: Array<{ time: number; text: string }> }> {
  const { apiKey } = useApiKeyStore.getState();
  const addNotification = useNotificationStore.getState().addNotification;
  const { getItem, addItem } = useCacheStore.getState();
  const progressStore = useProgressStore.getState();

  if (!apiKey && !import.meta.env.VITE_GROQ_API_KEY) {
    throw new Error('No API key available. Please add a Groq API key in settings.');
  }

  // Reset progress tracking
  progressStore.reset();

  // Check cache first
  try {
    const fileHash = await createFileHash(file);
    const cachedResult = getItem(fileHash);
    
    if (cachedResult) {
      progressStore.initialize(file.name, file.size, 1, 'groq');
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
  }

  // Initialize progress tracking
  progressStore.initialize(file.name, file.size, 1, 'groq');

  try {
    // Convert audio to optimized MP3 format
    console.log('Converting audio to optimized MP3 format...');
    const processedFile = await convertAudioToMp3(file);
    
    if (processedFile.size > MAX_CHUNK_SIZE) {
      throw new Error('Audio file too large. Maximum size is 25MB after compression.');
    }

    progressStore.updateCurrentChunk({ 
      status: 'processing', 
      progress: 50,
      message: 'Sending to Groq API...'
    });

    // Perform transcription
    const result = await performTranscription(processedFile, apiKey);

    // Cache the result
    try {
      const fileHash = await createFileHash(file);
      const duration = await getAudioDuration(file);
      
      addItem(fileHash, {
        ...result,
        fileHash,
        provider: 'groq',
        fileSize: file.size,
        duration
      });
    } catch (error) {
      console.error('Failed to cache result:', error);
    }

    // Mark transcription as completed
    progressStore.updateCurrentChunk({ 
      status: 'completed', 
      progress: 100,
      message: 'Transcription completed'
    });

    return result;
  } catch (error) {
    progressStore.setStatus('error', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

async function performTranscription(
  file: File,
  apiKey: string
): Promise<{ text: string; timestamps: Array<{ time: number; text: string }> }> {
  const apiUrl = 'https://api.groq.com/openai/v1/audio/transcriptions';
  const key = apiKey || import.meta.env.VITE_GROQ_API_KEY;
  
  try {
    // Create FormData with the processed MP3 file
    const formData = new FormData();
    formData.append('file', file);
    formData.append('model', 'whisper-large-v3-turbo');
    formData.append('response_format', 'verbose_json');
    formData.append('language', 'en');
    formData.append('temperature', '0');
    
    console.log('Sending request to Groq API...', {
      fileSize: file.size,
      fileType: file.type
    });

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`
      },
      body: formData
    });

    if (!response.ok) {
      let errorMessage = `API request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error?.message || errorData.error || errorMessage;
        
        if (response.status === 400) {
          throw new Error('Invalid request format. Please ensure the audio file is in a supported format.');
        }
        if (response.status === 401) {
          throw new Error('Invalid API key. Please check your Groq API key.');
        }
        if (response.status === 413) {
          throw new Error('Audio file too large. Maximum size is 25MB.');
        }
      } catch (e) {
        console.error('Error parsing Groq error response:', e);
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    
    if (!result.text) {
      throw new Error('No transcription data received from Groq');
    }

    // Process the text to ensure proper formatting
    const processedText = result.text
      .replace(/\s+/g, ' ')
      .replace(/([.!?])\s*/g, '$1 ')
      .replace(/([.!?])\s+(?=[A-Z])/g, '$1\n\n')
      .trim();

    // Create timestamps from segments if available, or estimate based on word count
    let timestamps = [];
    if (result.segments) {
      timestamps = result.segments.map((segment: any) => ({
        time: segment.start,
        text: segment.text.trim()
      }));
    } else {
      const words = processedText.split(' ');
      const avgTimePerWord = 0.3;
      timestamps = words.map((word: string, index: number) => ({
        time: Math.round(index * avgTimePerWord * 100) / 100,
        text: word
      }));
    }

    return {
      text: processedText,
      timestamps
    };
  } catch (error) {
    console.error('Transcription error:', error);
    throw new Error(`Transcription failed: ${error.message}`);
  }
}