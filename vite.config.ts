import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// PWA Configuration
const pwaConfig = {
  registerType: 'prompt',
  manifest: {
    name: 'Text Juicer',
    short_name: 'Text Juicer',
    description: 'Modern audio transcription app with offline support',
    theme_color: '#F96C57',
    background_color: '#1a1a1a',
    display: 'standalone',
    start_url: '/',
    icons: [
      {
        src: '/juicericons/icon-48.png',
        sizes: '48x48',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/juicericons/icon-72.png',
        sizes: '72x72',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/juicericons/icon-96.png',
        sizes: '96x96',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/juicericons/icon-128.png',
        sizes: '128x128',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/juicericons/icon-144.png',
        sizes: '144x144',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/juicericons/icon-152.png',
        sizes: '152x152',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/juicericons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/juicericons/icon-256.png',
        sizes: '256x256',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/juicericons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/juicericons/icon-1024.png',
        sizes: '1024x1024',
        type: 'image/png',
        purpose: 'maskable'
      }
    ]
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,json,webmanifest}'],
    globIgnores: ['**/node_modules/**/*'],
    maximumFileSizeToCacheInBytes: 50 * 1024 * 1024, // 50MB for model files
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/api-inference\.huggingface\.co\/.*/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          networkTimeoutSeconds: 10,
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 24 * 60 * 60 // 24 hours
          }
        }
      }
    ]
  },
  devOptions: {
    enabled: true
  },
  includeAssets: ['juicericons/*.png', 'Animation - *.json']
};

// Configure build to handle favicon
export default defineConfig({
  plugins: [
    react(),
    VitePWA(pwaConfig)
  ],
  publicDir: 'public',
  base: '/',
  build: {
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'favicon.ico') {
            return 'favicon.ico';
          }
          return 'assets/[name]-[hash][extname]';
        },
        inlineDynamicImports: false,
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-pwa': ['virtual:pwa-register'],
          'vendor-transformers': ['@xenova/transformers'],
          'vendor-utils': [
            'file-saver',
            'framer-motion',
            'jspdf',
            'lucide-react',
            'react-dropzone',
            'zustand'
          ]
        }
      },
      treeshake: true
    }
  },
  // Safari-specific optimizations
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: [
      'react',
      'react-dom',
      '@xenova/transformers',
      'zustand'
    ]
  },
  server: {
    port: 5173,
    host: true
  }
});