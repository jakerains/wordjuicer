import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { 
  initializeLocalModel, 
  deleteModel, 
  getModelState, 
  getModelProgress,
  getCurrentModelSize,
  checkBrowserSupport,
  ModelState
} from '../localModel';

// Mock the transformers pipeline
vi.mock('@xenova/transformers', () => ({
  pipeline: vi.fn(),
  env: {
    useBrowserCache: true,
    allowLocalModels: true,
    cacheDir: 'transformers-cache',
    backends: {
      onnx: {
        wasm: {
          numThreads: 1,
          proxy: false,
          wasmPaths: '/transformers.js/'
        }
      }
    }
  }
}));

// Mock IndexedDB
const indexedDB = {
  open: vi.fn(),
  deleteDatabase: vi.fn()
};

// Mock Cache API
const caches = {
  delete: vi.fn()
};

describe('localModel', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    
    // Setup window mocks
    global.window = {
      ...global.window,
      indexedDB,
      caches,
      AudioContext: class {},
      dispatchEvent: vi.fn()
    } as any;
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('initializeLocalModel', () => {
    it('should initialize model successfully', async () => {
      const mockTranscriber = {
        setOptions: vi.fn()
      };

      const { pipeline } = await import('@xenova/transformers');
      vi.mocked(pipeline).mockResolvedValueOnce(mockTranscriber);

      await initializeLocalModel('tiny');

      expect(pipeline).toHaveBeenCalledWith(
        'automatic-speech-recognition',
        'Xenova/whisper-tiny.en',
        expect.objectContaining({
          quantized: true,
          cache_dir: 'transformers-cache',
          local_files_only: false
        })
      );

      expect(getModelState()).toBe(ModelState.READY);
      expect(getCurrentModelSize()).toBe('tiny');
      expect(getModelProgress()).toBe(100);
    });

    it('should handle initialization failure', async () => {
      const { pipeline } = await import('@xenova/transformers');
      vi.mocked(pipeline).mockRejectedValueOnce(new Error('Failed to load'));

      await expect(initializeLocalModel('tiny')).rejects.toThrow();
      expect(getModelState()).toBe(ModelState.ERROR);
      expect(getModelProgress()).toBe(0);
    });

    it('should reuse existing model if already initialized', async () => {
      const mockTranscriber = {
        setOptions: vi.fn()
      };

      const { pipeline } = await import('@xenova/transformers');
      vi.mocked(pipeline).mockResolvedValueOnce(mockTranscriber);

      await initializeLocalModel('tiny');
      const firstCall = vi.mocked(pipeline).mock.calls.length;

      await initializeLocalModel('tiny');
      expect(vi.mocked(pipeline).mock.calls.length).toBe(firstCall);
    });
  });

  describe('deleteModel', () => {
    it('should delete model and clear caches', async () => {
      // Setup IndexedDB mock
      const mockDB = {
        close: vi.fn(),
      };
      indexedDB.open.mockImplementation(() => ({
        onsuccess: (fn: any) => fn({ target: { result: mockDB } }),
      }));

      const success = await deleteModel();

      expect(success).toBe(true);
      expect(indexedDB.open).toHaveBeenCalledWith('transformers');
      expect(caches.delete).toHaveBeenCalledWith('wordjuicer-model-cache-v1');
      expect(getModelState()).toBe(ModelState.NOT_LOADED);
      expect(getCurrentModelSize()).toBeNull();
      expect(getModelProgress()).toBe(0);
    });

    it('should handle deletion failure', async () => {
      indexedDB.open.mockRejectedValue(new Error('Failed to open DB'));

      const success = await deleteModel();

      expect(success).toBe(false);
    });
  });

  describe('checkBrowserSupport', () => {
    it('should return true when all required features are available', () => {
      expect(checkBrowserSupport()).toBe(true);
    });

    it('should return false when required features are missing', () => {
      delete (global.window as any).indexedDB;
      expect(checkBrowserSupport()).toBe(false);
    });
  });
}); 