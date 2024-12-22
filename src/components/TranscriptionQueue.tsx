import React from 'react';
import { Clock, Loader2, CheckCircle2, XCircle, Trash2, List } from 'lucide-react';
import { useQueueStore, type QueueItem } from '../utils/queue';
import { GlassButton } from './ui/GlassButton';

export function TranscriptionQueue() {
  const { items, removeItem, clearQueue, getQueueStatus } = useQueueStore();
  const queueStatus = getQueueStatus();

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatDuration = (start: number, end: number) => {
    const duration = end - start;
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
  };

  const getStatusIcon = (status: QueueItem['status']) => {
    switch (status) {
      case 'queued':
        return <Clock className="w-4 h-4 text-white/50" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-[#A2AD1E] animate-spin" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#A2AD1E]/10 rounded-full">
            <List className="w-5 h-5 text-[#A2AD1E]" />
          </div>
          <h3 className="text-lg font-medium text-white/90">Transcription Queue</h3>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex gap-2 text-sm">
            <span className="text-white/50">
              {queueStatus.processing} processing
            </span>
            <span className="text-white/30">•</span>
            <span className="text-white/50">
              {queueStatus.queued} queued
            </span>
          </div>

          {queueStatus.queued > 0 && (
            <GlassButton
              variant="danger"
              size="sm"
              onClick={clearQueue}
              icon={<Trash2 className="w-4 h-4" />}
            >
              Clear Queue
            </GlassButton>
          )}
        </div>
      </div>

      <div className="grid gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            className={`p-4 rounded-xl backdrop-blur-sm border transition-colors ${
              item.status === 'processing'
                ? 'bg-[#A2AD1E]/5 border-[#A2AD1E]/30'
                : item.status === 'completed'
                ? 'bg-green-500/5 border-green-500/30'
                : item.status === 'error'
                ? 'bg-red-500/5 border-red-500/30'
                : 'bg-white/5 border-white/10'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {getStatusIcon(item.status)}
                  <span className="text-sm font-medium text-white/90">
                    {item.file.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/50">
                  <span>{formatFileSize(item.file.size)}</span>
                  <span>•</span>
                  <span>Added at {formatTime(item.addedAt)}</span>
                  {item.startedAt && item.completedAt && (
                    <>
                      <span>•</span>
                      <span>
                        Took {formatDuration(item.startedAt, item.completedAt)}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {(item.status === 'queued' || item.status === 'error') && (
                <GlassButton
                  variant="secondary"
                  size="sm"
                  onClick={() => removeItem(item.id)}
                  icon={<Trash2 className="w-4 h-4" />}
                />
              )}
            </div>

            {item.error && (
              <div className="mt-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-xs text-red-500">{item.error}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 