import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'juicericons/*.png',
        'juicerbanner-wide.png',
        'Animation - 1733141028806.json',
        'Animation - loading.json'
      ],
      manifest: {
        name: 'Word Juicer',
        short_name: 'Word Juicer',
        description: 'Modern audio transcription app',
        theme_color: '#A2AD1E',
        background_color: '#000000',
        display: 'standalone',
        icons: [
          {
            src: '/juicericons/icon-72x72.png',
            sizes: '72x72',
            type: 'image/png'
          },
          {
            src: '/juicericons/icon-96x96.png',
            sizes: '96x96',
            type: 'image/png'
          },
          {
            src: '/juicericons/icon-128x128.png',
            sizes: '128x128',
            type: 'image/png'
          },
          {
            src: '/juicericons/icon-144x144.png',
            sizes: '144x144',
            type: 'image/png'
          },
          {
            src: '/juicericons/icon-152x152.png',
            sizes: '152x152',
            type: 'image/png'
          },
          {
            src: '/juicericons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/juicericons/icon-384x384.png',
            sizes: '384x384',
            type: 'image/png'
          },
          {
            src: '/juicericons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            urlPattern: ({ url, request }) => {
              return url.pathname.startsWith('/api') || 
                     url.hostname === 'api-inference.huggingface.co' ||
                     url.hostname === 'api.groq.com' ||
                     url.hostname === 'api.openai.com';
            },
            handler: 'NetworkOnly',
            method: 'POST',
            options: {
              backgroundSync: false
            }
          },
          {
            urlPattern: /\.(js|css|ico)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-resources',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 24 * 60 * 60 // 24 hours
              }
            }
          },
          {
            urlPattern: /\.(png|jpg|jpeg|svg|gif)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
              }
            }
          }
        ],
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        directoryIndex: null,
        navigationPreload: true
      },
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      injectRegister: 'auto'
    })
  ],
  server: {
    port: 3000
  },
  preview: {
    port: 3000
  },
  build: {
    sourcemap: true,
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-pwa': ['virtual:pwa-register']
        }
      }
    }
  }
});