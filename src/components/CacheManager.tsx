import React from 'react';
import { Trash2, Database, RefreshCw } from 'lucide-react';
import { GlassButton } from './ui/GlassButton';
import { useCacheStore } from '../utils/cache';

export function CacheManager() {
  const { items, clear, prune } = useCacheStore();
  const [isClearing, setIsClearing] = React.useState(false);
  const [isPruning, setIsPruning] = React.useState(false);

  const totalSize = Object.values(items).reduce((acc, item) => acc + item.fileSize, 0);
  const itemCount = Object.keys(items).length;

  const handleClear = async () => {
    setIsClearing(true);
    try {
      clear();
    } finally {
      setIsClearing(false);
    }
  };

  const handlePrune = async () => {
    setIsPruning(true);
    try {
      prune();
    } finally {
      setIsPruning(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white/90">Cache Management</h3>
        <div className="flex gap-2">
          <GlassButton
            variant="secondary"
            size="sm"
            onClick={handlePrune}
            disabled={isPruning || itemCount === 0}
            icon={<RefreshCw className={`w-4 h-4 ${isPruning ? 'animate-spin' : ''}`} />}
          >
            Prune
          </GlassButton>
          <GlassButton
            variant="danger"
            size="sm"
            onClick={handleClear}
            disabled={isClearing || itemCount === 0}
            icon={<Trash2 className="w-4 h-4" />}
          >
            Clear
          </GlassButton>
        </div>
      </div>

      <div className="grid gap-3">
        <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
          <div className="flex items-center gap-3">
            <Database className="w-4 h-4 text-[#A2AD1E]" />
            <span className="text-sm text-white/80">Cached Items</span>
          </div>
          <span className="text-sm text-white/70">{itemCount}</span>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
          <div className="flex items-center gap-3">
            <Database className="w-4 h-4 text-[#A2AD1E]" />
            <span className="text-sm text-white/80">Total Size</span>
          </div>
          <span className="text-sm text-white/70">{formatBytes(totalSize)}</span>
        </div>

        {itemCount > 0 && (
          <div className="mt-4 space-y-3">
            <h4 className="text-sm font-medium text-white/70">Recent Transcriptions</h4>
            {Object.entries(items)
              .sort(([, a], [, b]) => b.createdAt - a.createdAt)
              .slice(0, 5)
              .map(([key, item]) => (
                <div
                  key={key}
                  className="p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-white/90">
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                    <span className="text-xs text-white/50">
                      {item.provider}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-white/70">
                    <span>{formatBytes(item.fileSize)}</span>
                    <span>{formatDuration(item.duration)}</span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
} 