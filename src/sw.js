import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkOnly, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

// Precache assets generated by the build process
precacheAndRoute(self.__WB_MANIFEST);

/**
 * Cache API responses when online
 * Use NetworkOnly strategy for API calls
 */
registerRoute(
  ({ url, request }) => {
    return request.method === 'POST' && (
      url.pathname.startsWith('/api') || 
      url.hostname === 'api-inference.huggingface.co' ||
      url.hostname === 'api.groq.com' ||
      url.hostname === 'api.openai.com'
    );
  },
  new NetworkOnly()
);

/**
 * Cache static assets using CacheFirst strategy
 * Cache styles, scripts, and images
 */
registerRoute(
  ({ request }) => request.destination === 'style' || 
                   request.destination === 'script' || 
                   request.destination === 'image',
  new CacheFirst({
    cacheName: 'static-resources',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60, // Maximum number of entries
        maxAgeSeconds: 30 * 24 * 60 * 60, // Cache for 30 days
      }),
    ],
  })
);

// Handle navigation requests
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkOnly()
);

// Activate service worker immediately after installation
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Claim clients immediately after activation
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
}); 