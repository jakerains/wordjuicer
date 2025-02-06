# WordJuicer Offline Mode Documentation

## Overview

WordJuicer provides robust offline functionality through Progressive Web App (PWA) technology and local model processing. This document explains how the offline mode works, how to set it up, and best practices for development and usage.

## Features

- Complete offline transcription processing
- Local model caching
- Automatic PWA installation detection
- Progress tracking for model downloads
- Persistent state management
- Browser compatibility checks

## Technical Implementation

### 1. Service Worker

The service worker (`public/sw.js`) handles:
- Caching of static assets
- Caching of model files
- Network request interception
- Cache management and cleanup

Cache Structure:
```
wordjuicer-cache-v1/     # Static assets and app files
wordjuicer-model-cache-v1/   # Model files and configurations
```

### 2. Model Management

The local model system (`src/utils/localModel.ts`) provides:
- Model initialization and loading
- Transcription processing
- Progress tracking
- Error handling

Supported Models:
- whisper-tiny (152MB)
- whisper-base (290MB)
- whisper-small (967MB)

### 3. State Management

Offline state (`src/store/offlineStore.ts`) tracks:
- Offline mode status
- PWA installation status
- Model download progress
- Browser compatibility

## Setup Instructions

### For Users

1. Install WordJuicer as a PWA:
   - Open the app in a modern browser
   - Look for the install prompt or use the browser's install option
   - Follow the installation prompts

2. Enable Offline Mode:
   - Navigate to Settings
   - Find the Offline Mode toggle
   - Click "Enable"
   - Wait for the model to download (progress will be shown)

3. Using Offline Mode:
   - Once enabled, the app will work without internet
   - Transcriptions will be processed locally
   - Data will sync when connection is restored

### For Developers

1. Service Worker Registration:
   ```typescript
   if ('serviceWorker' in navigator) {
     window.addEventListener('load', () => {
       navigator.serviceWorker.register('/sw.js');
     });
   }
   ```

2. Model Integration:
   ```typescript
   import { initializeLocalModel } from '../utils/localModel';
   
   // Initialize the model
   await initializeLocalModel('openai/whisper-tiny');
   
   // Run transcription
   const result = await runLocalTranscription(audioFile);
   ```

3. State Management:
   ```typescript
   import { useOfflineStore } from '../store/offlineStore';
   
   const { isOfflineModeEnabled } = useOfflineStore();
   ```

## Browser Support

Required Features:
- IndexedDB
- Cache API
- Service Workers
- Web Audio API

Minimum Browser Versions:
- Chrome 64+
- Firefox 63+
- Safari 14.1+
- Edge 79+

## Best Practices

1. Model Management:
   - Use the smallest model that meets your needs
   - Implement proper error handling
   - Show clear progress indicators

2. User Experience:
   - Clearly indicate offline status
   - Provide feedback during model download
   - Handle errors gracefully

3. Performance:
   - Use quantized models when possible
   - Implement proper chunking for large files
   - Cache strategically

## Troubleshooting

Common Issues:

1. Model Download Fails
   - Check internet connection
   - Verify browser compatibility
   - Clear browser cache and try again

2. Transcription Errors
   - Verify audio format compatibility
   - Check model initialization
   - Review browser console for errors

3. PWA Installation Issues
   - Ensure HTTPS connection
   - Check browser support
   - Verify manifest.json configuration

## Security Considerations

1. Data Privacy:
   - All processing happens locally
   - No data is sent to external servers
   - Models are downloaded from trusted sources

2. Storage:
   - Models are stored in browser cache
   - User data is stored in IndexedDB
   - Clear cache to remove stored data

## Future Improvements

Planned enhancements:
- Support for larger models
- Improved caching strategies
- Better progress tracking
- Multiple language support
- Model version management

## Contributing

To contribute to offline mode development:

1. Review the technical implementation
2. Test thoroughly in various conditions
3. Follow security best practices
4. Update documentation as needed

## Support

For issues or questions:
- Check the troubleshooting guide
- Review browser console logs
- Submit detailed bug reports
- Contact support with specifics 