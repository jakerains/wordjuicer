# Project Map <!-- markmap: fold -->

## Core Features
### Offline Support
- **PWA Enhancements**
  - Service worker configuration for asset caching
  - Offline installation capabilities
- **Model Caching**
  - IndexedDB storage for model files
  - Local model initialization and management

### Model Management
- **Model States**
  - Tracking download and initialization states
- **UI Components**
  - `ModelStatus.tsx` for displaying model download progress

### Transcription
- **Offline Transcription**
  - Use local Whisper model when offline
- **Online Transcription**
  - Use remote APIs when online
- **Error Handling**
  - Graceful handling of model download and transcription errors

## Technical Architecture
### Libraries and Tools
- **Workbox**
  - Service worker and caching strategies
- **@xenova/transformers**
  - In-browser model inference with ONNX

### File Structure
- `/src`
  - `/components`
    - `ModelStatus.tsx`: Displays model download status
  - `/utils`
    - `localModel.ts`: Manages local model initialization and transcription
- `/public`
  - `manifest.webmanifest`: Updated manifest for PWA
  - `sw.js`: Service worker with caching strategies

## Documentation
- **Changelog**
  - `docs/CHANGELOG.md`
- **Installation Guide**
  - `docs/INSTALLATION.md`
- **Project Map**
  - `docs/project-map.md`