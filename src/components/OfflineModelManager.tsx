import React from 'react';
import { Download, HardDrive, Loader2, Trash2, AlertCircle } from 'lucide-react';
import { 
  getModelState, 
  getModelSize, 
  getModelProgress,
  getCurrentModelSize,
  initializeLocalModel, 
  deleteModel,
  ModelState 
} from '../utils/localModel';
import { useOfflineStore } from '../store/offlineStore';

const MODEL_SIZES = [
  { id: 'tiny', name: 'Tiny', size: '75MB', description: 'Fastest, good for simple audio (Quantized)' },
  { id: 'base', name: 'Base', size: '145MB', description: 'Fast, better accuracy (Quantized)' },
  { id: 'small', name: 'Small', size: '484MB', description: 'Good balance of speed and accuracy (Quantized)' },
  { id: 'medium', name: 'Medium', size: '1.5GB', description: 'High accuracy, optimized for CPU/WebGPU (Quantized)' },
  { id: 'large', name: 'Large', size: '3GB', description: 'Best accuracy, recommended with WebGPU (Quantized)' }
];

export function OfflineModelManager() {
  const [selectedSize, setSelectedSize] = React.useState('tiny');
  const [status, setStatus] = React.useState<ModelState>(ModelState.NOT_LOADED);
  const [progress, setProgress] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const { isOfflineModeEnabled } = useOfflineStore();

  React.useEffect(() => {
    const checkStatus = async () => {
      const state = await getModelState();
      setStatus(state);
      setProgress(getModelProgress());
    };
    
    checkStatus();
    const interval = setInterval(checkStatus, 1000);

    const handleProgress = (event: CustomEvent) => {
      setProgress(event.detail.progress);
    };

    window.addEventListener('modelDownloadProgress', handleProgress as EventListener);

    return () => {
      clearInterval(interval);
      window.removeEventListener('modelDownloadProgress', handleProgress as EventListener);
    };
  }, []);

  const handleDownload = async () => {
    setError(null);
    try {
      await initializeLocalModel(selectedSize);
    } catch (error) {
      console.error('Failed to download model:', error);
      setError('Failed to download model. Please check your connection and try again.');
    }
  };

  const handleDelete = async () => {
    setError(null);
    try {
      const success = await deleteModel();
      if (!success) {
        setError('Failed to delete model. Please try again.');
      }
    } catch (error) {
      console.error('Failed to delete model:', error);
      setError('Failed to delete model. Please try again.');
    }
  };

  if (!isOfflineModeEnabled) {
    return null;
  }

  const currentSize = getCurrentModelSize();
  const downloadedModel = MODEL_SIZES.find(size => size.id === currentSize);

  return (
    <div className="bg-black/40 backdrop-blur-md rounded-[20px] p-6 border border-white/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-[#A2AD1E]" />
          <h3 className="text-lg font-semibold text-white">Model Management</h3>
        </div>
        {status === ModelState.READY && downloadedModel && (
          <span className="text-sm text-[#A2AD1E]">
            {downloadedModel.name} model loaded ({downloadedModel.size})
          </span>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {status !== ModelState.READY && (
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Select Model Size
            </label>
            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#A2AD1E]"
              disabled={status === ModelState.DOWNLOADING}
            >
              {MODEL_SIZES.map(size => (
                <option key={size.id} value={size.id}>
                  {size.name} - {size.size}
                </option>
              ))}
            </select>
            <p className="mt-2 text-sm text-white/70">
              {MODEL_SIZES.find(size => size.id === selectedSize)?.description}
            </p>
          </div>
        )}

        {status === ModelState.NOT_LOADED && (
          <button
            onClick={handleDownload}
            disabled={status === ModelState.DOWNLOADING}
            className="w-full px-4 py-3 rounded-xl bg-[#A2AD1E]/20 text-[#A2AD1E] hover:bg-[#A2AD1E]/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-5 h-5" />
            Download Model
          </button>
        )}

        {status === ModelState.DOWNLOADING && (
          <div className="space-y-2">
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#A2AD1E] rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }} 
              />
            </div>
            <div className="flex items-center justify-between text-sm text-white/70">
              <span>Downloading model...</span>
              <span>{progress}%</span>
            </div>
            <p className="text-sm text-white/70 text-center">
              This may take a while depending on your connection speed
            </p>
          </div>
        )}

        {status === ModelState.READY && downloadedModel && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-white/70 text-sm">
              <span>Model Type</span>
              <span>{downloadedModel.name}</span>
            </div>
            <div className="flex items-center justify-between text-white/70 text-sm">
              <span>Size</span>
              <span>{downloadedModel.size}</span>
            </div>
            <div className="flex items-center justify-between text-white/70 text-sm">
              <span>Status</span>
              <span className="text-[#A2AD1E]">Ready for offline use</span>
            </div>
            <button
              onClick={handleDelete}
              className="w-full px-4 py-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-5 h-5" />
              Delete Model
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 
