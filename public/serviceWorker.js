const CACHE_NAME = 'word-juicer-v1';

// Add event listener for install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll([
          '/',
          '/index.html',
          '/manifest.json'
        ]).catch(error => {
          console.warn('Some assets failed to cache:', error);
          // Continue installing despite errors
          return Promise.resolve();
        });
      })
  );
});

// Add event listener for fetch
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    (async () => {
      // Don't cache API calls or POST requests
      if (event.request.method === 'POST' || 
          event.request.url.includes('api.groq.com') ||
          event.request.url.includes('api-inference.huggingface.co') ||
          event.request.url.includes('api.openai.com')) {
        return fetch(event.request);
      }

      // For other requests, try the cache first
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(event.request);
      
      if (cachedResponse) {
        return cachedResponse;
      }

      try {
        const response = await fetch(event.request);
        
        // Only cache successful GET responses
        if (response.ok && event.request.method === 'GET') {
          const clonedResponse = response.clone();
          cache.put(event.request, clonedResponse).catch(error => {
            console.warn('Failed to cache response:', error);
          });
        }
        
        return response;
      } catch (error) {
        console.error('Service worker fetch error:', error);
        throw error;
      }
    })()
  );
}); 