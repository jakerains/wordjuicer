import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock browser APIs
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IndexedDB
const indexedDB = {
  open: vi.fn(),
  deleteDatabase: vi.fn()
};

// Mock Cache API
const caches = {
  open: vi.fn(),
  delete: vi.fn(),
  keys: vi.fn(),
  match: vi.fn()
};

// Mock Service Worker
const serviceWorker = {
  register: vi.fn(),
  ready: Promise.resolve({
    active: {
      postMessage: vi.fn()
    }
  })
};

// Setup global mocks
Object.defineProperty(window, 'indexedDB', {
  value: indexedDB,
  writable: true
});

Object.defineProperty(window, 'caches', {
  value: caches,
  writable: true
});

Object.defineProperty(navigator, 'serviceWorker', {
  value: serviceWorker,
  writable: true
});

// Mock AudioContext
class MockAudioContext {
  constructor() {}
  createMediaStreamSource() {}
  createAnalyser() {}
  close() {}
}

Object.defineProperty(window, 'AudioContext', {
  value: MockAudioContext,
  writable: true
}); 