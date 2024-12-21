# Text Juicer Project Map

## Overview <!-- markmap: fold -->
- Modern web-based audio transcription application
- Built with React, TypeScript, and Vite
- Features glassmorphism UI design

## Technical Architecture <!-- markmap: fold -->
### Frontend
- React with TypeScript
- Vite for build tooling
- PWA support with vite-plugin-pwa
- Service worker for offline functionality
- Tailwind CSS for styling
- Lucide React for icons

### API Integration
- Hugging Face Inference API
- Whisper Large V3 Turbo model
- Environment variable configuration

## Components <!-- markmap: fold -->
### Core Components
- App.tsx (Main application container)
- DropZone (File upload interface)
- TranscriptionViewer (Results display)
- ExportOptions (File export functionality)
- Sidebar (Navigation menu)

### Utilities
- transcription.ts (API integration)
- Environment variable handling

## Features <!-- markmap: fold -->
### Audio Transcription
- Drag and drop file upload
- Multiple audio format support
- Real-time processing feedback

### Export Capabilities
- TXT format export
- SRT format export
- DOCX format export

### User Interface
- Glassmorphism design
- Citrus-inspired color scheme
- Installable PWA capabilities
- Offline support
- Responsive layout
- Loading states and error handling

## Security <!-- markmap: fold -->
- API key protection via environment variables
- Gitignore configuration
- Secure PWA asset caching
- Input validation and error handling
- Session-based API key storage
- Real-time API key validation
- Secure key management using sessionStorage

## PWA Features <!-- markmap: fold -->
### Installation
- App manifest configuration
- Install prompt in settings
- Icon assets for various sizes

### Offline Support
- Service worker registration
- Asset caching strategy
- Model caching for offline use
- Automatic updates

### Performance
- Optimized caching policies
- Efficient asset serving
- Background sync capabilities