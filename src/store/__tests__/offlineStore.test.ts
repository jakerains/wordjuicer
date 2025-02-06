import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useOfflineStore } from '../offlineStore';
import { ModelState } from '../../utils/localModel';

// Mock localModel
vi.mock('../../utils/localModel', () => ({
  checkBrowserSupport: vi.fn(() => true),
  getModelState: vi.fn(),
  ModelState: {
    NOT_LOADED: 'not-loaded',
    DOWNLOADING: 'downloading',
    READY: 'ready',
    ERROR: 'error'
  }
}));

describe('offlineStore', () => {
  beforeEach(() => {
    // Clear the store before each test
    const store = useOfflineStore.getState();
    store.setOfflineMode(false);
    store.setPWAInstalled(false);
    store.setModelDownloaded(false);
    store.setDownloadProgress(0);

    // Reset all mocks
    vi.clearAllMocks();

    // Setup window mocks
    global.window = {
      ...global.window,
      matchMedia: vi.fn(),
      navigator: {
        serviceWorker: {
          ready: Promise.resolve({
            active: {
              postMessage: vi.fn()
            }
          })
        }
      }
    } as any;
  });

  describe('setOfflineMode', () => {
    it('should update offline mode state', () => {
      const store = useOfflineStore.getState();
      store.setOfflineMode(true);
      expect(store.isOfflineModeEnabled).toBe(true);
    });

    it('should trigger service worker cache when enabled', async () => {
      const store = useOfflineStore.getState();
      const postMessage = vi.fn();
      
      (global.window.navigator.serviceWorker.ready as any) = Promise.resolve({
        active: { postMessage }
      });

      await store.setOfflineMode(true);
      
      expect(postMessage).toHaveBeenCalledWith({ type: 'CACHE_MODEL' });
    });
  });

  describe('checkPWAStatus', () => {
    it('should detect standalone mode', () => {
      const store = useOfflineStore.getState();
      global.window.matchMedia = vi.fn().mockReturnValue({ matches: true });

      store.checkPWAStatus();
      expect(store.isPWAInstalled).toBe(true);
    });

    it('should detect iOS standalone mode', () => {
      const store = useOfflineStore.getState();
      (global.window.navigator as any).standalone = true;

      store.checkPWAStatus();
      expect(store.isPWAInstalled).toBe(true);
    });

    it('should detect Android app mode', () => {
      const store = useOfflineStore.getState();
      Object.defineProperty(document, 'referrer', {
        value: 'android-app://com.example.app',
        configurable: true
      });

      store.checkPWAStatus();
      expect(store.isPWAInstalled).toBe(true);
    });
  });

  describe('syncModelState', () => {
    it('should sync with ready model state', () => {
      const store = useOfflineStore.getState();
      const { getModelState } = require('../../utils/localModel');
      vi.mocked(getModelState).mockReturnValue(ModelState.READY);

      store.syncModelState();
      
      expect(store.isModelDownloaded).toBe(true);
      expect(store.downloadProgress).toBe(100);
    });

    it('should sync with not loaded model state', () => {
      const store = useOfflineStore.getState();
      const { getModelState } = require('../../utils/localModel');
      vi.mocked(getModelState).mockReturnValue(ModelState.NOT_LOADED);

      store.syncModelState();
      
      expect(store.isModelDownloaded).toBe(false);
      expect(store.downloadProgress).toBe(0);
    });
  });

  describe('persistence', () => {
    it('should persist state changes', () => {
      const store = useOfflineStore.getState();
      store.setOfflineMode(true);
      store.setModelDownloaded(true);
      store.setDownloadProgress(50);

      // Create a new store instance
      const newStore = useOfflineStore.getState();
      
      expect(newStore.isOfflineModeEnabled).toBe(true);
      expect(newStore.isModelDownloaded).toBe(true);
 