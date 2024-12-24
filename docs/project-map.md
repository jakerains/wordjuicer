# Project Map <!-- markmap: fold -->

## Core Features
### Audio Transcription
- Live transcription with real-time processing
- File-based transcription with chunking
- Multi-provider support (OpenAI, Groq, Hugging Face)
- Progress tracking and status updates

### Data Management
- Transcription history
- Cache management
- Export/Import functionality
- Dashboard interface

### Settings
- API key management
- Provider selection
- Cache configuration
- PWA installation

## Technical Architecture
### Frontend
- React with TypeScript
- Tailwind CSS for styling
- Glass morphism design system
- Responsive layout

### State Management
- Zustand stores
  - API key store
  - Transcription store
  - Progress store
  - Cache store
  - Notification store

### Audio Processing
- Chunk-based processing (5MB chunks)
- WebAudio API for live recording
- Blob handling for file uploads
- Format validation and conversion

### API Integration
#### Providers
- OpenAI Whisper
  - Endpoint: https://api.openai.com/v1/audio/transcriptions
  - Model: whisper-1
- Groq
  - Endpoint: https://api.groq.com/openai/v1/audio/transcriptions
  - Model: whisper-large-v3-turbo
- Hugging Face
  - Endpoint: https://api-inference.huggingface.co/models/openai/whisper-large-v3-turbo
  - Model: whisper-large-v3-turbo

### Caching System
- IndexedDB storage
- File hash-based caching
- Automatic cache management
- Cache size monitoring

### Error Handling
- Retry mechanism for failed requests
- Graceful error recovery
- User-friendly error messages
- Progress status updates

## User Experience
### Interface
- Modern glass morphism design
- Real-time progress indicators
- Responsive layout
- Dark mode optimized

### Progressive Web App
- Offline capability
- Install prompts
- App-like experience
- Background processing

### Accessibility
- Keyboard navigation
- Screen reader support
- High contrast elements
- Clear visual feedback

## File Structure
### Source Code
- `/src`
  - `/components`: React components
  - `/store`: Zustand stores
  - `/utils`: Utility functions
  - `/styles`: CSS and styling
  - `/types`: TypeScript definitions

### Documentation
- `/docs`
  - `CHANGELOG.md`: Version history
  - `project-map.md`: Project structure
  - Technical documentation

### Configuration
- `vite.config.ts`: Build configuration
- `.env.example`: Environment variables
- `package.json`: Dependencies
- `tsconfig.json`: TypeScript settings