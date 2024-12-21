// Transcription related types
export interface Timestamp {
  time: number;
  text: string;
}

export interface TranscriptionResult {
  id: string;
  filename: string;
  text: string;
  timestamps: Timestamp[];
  duration: number;
  size: number;
  date: Date;
  status: 'completed' | 'failed';
}

export interface Stats {
  totalTranscriptions: number;
  totalDuration: number;
  completedToday: number;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  timestamp: Date;
}