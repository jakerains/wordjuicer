import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// PWA Configuration
const pwaConfig = {
  registerType: 'autoUpdate',
  strategies: 'generateSW',
  manifest: {
    name: 'Word Juicer',
    short_name: 'Word Juicer',
    description: 'Modern audio transcription app with offline support',
    theme_color: '#F96C57',
    background_color: '#1a1a1a',
    display: 'standalone',
    start_url: '/',
    icons: [
      {
        src: '/juicericons/icon-29.png',
        sizes: '29x29',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/juicericons/icon-40.png',
        sizes: '40x40',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/juicericons/icon-60.png',
        sizes: '60x60',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/juicericons/icon-76.png',
        sizes: '76x76',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/juicericons/icon-29@2x.png',
        sizes: '58x58',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/juicericons/icon-40@2x.png',
        sizes: '80x80',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/juicericons/icon-60@2x.png',
        sizes: '120x120',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/juicericons/icon-76@2x.png',
        sizes: '152x152',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/juicericons/icon-83.5@2x.png',
        sizes: '167x167',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/juicericons/icon-1024.png',
        sizes: '1024x1024',
        type: 'image/png',
        purpose: 'maskable'
      }
    ],
    meta: {
      'mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'black-translucent',
      'theme-color': '#F96C57'
    }
  },
  workbox: {
    globPatterns: [
      '**/*.{js,css,html,ico,png,svg,json,webmanifest}'
    ],
    globIgnores: [
      '**/node_modules/**/*',
      'dev-dist/**/*'
    ],
    maximumFileSizeToCacheInBytes: 50 * 1024 * 1024,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/api-inference\.huggingface\.co\/.*/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          networkTimeoutSeconds: 10,
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 24 * 60 * 60
          }
        }
      },
      {
        urlPattern: /\.(?:js|css)$/,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'static-resources'
        }
      },
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'images',
          expiration: {
            maxEntries: 60,
            maxAgeSeconds: 30 * 24 * 60 * 60
          }
        }
      }
    ],
    cleanupOutdatedCaches: true,
    skipWaiting: true,
    clientsClaim: true
  },
  devOptions: {
    enabled: true,
    type: 'module',
    navigateFallback: 'index.html'
  },
  includeAssets: [
    'juicericons/*.png',
    'Animation - *.json',
    'favicon.ico'
  ],
  injectRegister: 'auto',
  // Increase chunk size warning limit
  build: {
    chunkSizeWarningLimit: 1000
  }
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
    port: 5174,
    host: 'localhost'
  }
});