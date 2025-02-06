const CACHE_NAME = 'wordjuicer-cache-v1';
const MODEL_CACHE_NAME = 'wordjuicer-model-cache-v1';

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/juicericons/favicon.ico',
  '/juicericons/icon-192.png',
  '/juicericons/icon-512.png',
  '/juicericons/juicerbanner-wide.png',
  // Add all icon sizes for comprehensive offline support
  '/juicericons/icon-29.png',
  '/juicericons/icon-38.png',
  '/juicericons/icon-40.png',
  '/juicericons/icon-48.png',
  '/juicericons/icon-60.png',
  '/juicericons/icon-72.png',
  '/juicericons/icon-76.png',
  '/juicericons/icon-96.png',
  '/juicericons/icon-128.png',
  '/juicericons/icon-144.png',
  '/juicericons/icon-152.png',
  '/juicericons/icon-180.png',
  '/juicericons/icon-256.png',
  '/juicericons/icon-1024.png'
];

// Model files to cache when offline mode is enabled
const MODEL_FILES = [
  'https://huggingface.co/Xenova/whisper-tiny.en/resolve/main/config.json',
  'https://huggingface.co/Xenova/whisper-tiny.en/resolve/main/tokenizer.json',
  'https://huggingface.co/Xenova/whisper-tiny.en/resolve/main/model.onnx',
  'https://huggingface.co/Xenova/whisper-tiny.en/resolve/main/tokenizer_config.json',
  'https://huggingface.co/Xenova/whisper-tiny.en/resolve/main/generation_config.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      // Cache core assets
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(PRECACHE_ASSETS);
      }),
      // Activate immediately
      self.skipWaiting()
    ])
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return (
                cacheName.startsWith('wordjuicer-') &&
                cacheName !== CACHE_NAME &&
                cacheName !== MODEL_CACHE_NAME
              );
            })
            .map((cacheName) => caches.delete(cacheName))
        );
      }),
      // Take control of all pages immediately
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', (event) => {
  // Handle all requests, including cross-origin for model files
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        // Cache successful responses
        if (!response || response.status !== 200) {
          return response;
        }

        // Clone the response since it can only be consumed once
        const responseToCache = response.clone();

        // Determine which cache to use based on the URL
        const cacheName = event.request.url.includes('huggingface.co')
          ? MODEL_CACHE_NAME
          : CACHE_NAME;

        caches.open(cacheName).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch((error) => {
        console.error('Fetch failed:', error);
        throw error;
      });
    })
  );
});

// Handle messages from the client
self.addEventListener('message', (event) => {
  if (event.data.type === 'CACHE_MODEL') {
    event.waitUntil(
      caches.open(MODEL_CACHE_NAME).then((cache) => {
        return Promise.all(
          MODEL_FILES.map(async (url) => {
            try {
              const response = await fetch(url);
              if (response.ok) {
                await cache.put(url, response);
                // Notify client of progress
                event.source.postMessage({
                  type: 'MODEL_CACHE_PROGRESS',
                  url: url
                });
              }
            } catch (error) {
              console.error('Failed to cache model file:', url, error);
            }
          })
        );
      })
    );
  }
}); 