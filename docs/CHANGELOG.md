# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.6] - 2024-03-21

### Added
- Built-in Groq trial key for instant transcription
- Trial key status display in UI
- Made Groq the default transcription provider
- Enhanced Quick Start guide with clearer instructions

### Changed
- Streamlined transcription workflow with trial key
- Updated FAQs with trial key information
- Enhanced Settings UI for API key management
- Improved visibility of trial key status in main UI

## [1.0.0] - 2024-03-19

### Added
- Initial production release
- Multi-provider support for audio transcription (OpenAI, Groq, Hugging Face)
- Live transcription feature with real-time audio processing
- Audio file transcription with chunking support
- Caching system for transcribed audio
- Progress tracking and status updates
- PWA support for offline access
- Dashboard for managing transcriptions
- Settings management for API keys and providers
- Modern, responsive UI with glass morphism design
- Export/Import functionality for dashboard data

### Changed
- Removed service health monitoring in favor of simplified provider management
- Optimized transcription processing with improved error handling
- Streamlined API provider configuration

### Technical Details
- Using whisper-large-v3-turbo model across all providers
- 5MB chunk size for audio processing
- Retry mechanism for failed transcription attempts
- Efficient caching system for transcribed content
- Real-time progress tracking and status updates

## [1.0.4] - 2024-03-19

### Fixed
- Corrected Groq implementation with proper endpoint and model name
- Removed unsupported parameters from Groq API requests
- Improved error handling for Groq API responses
- Updated API documentation to reflect correct Groq configuration

## [1.0.5] - 2024-03-19

### Fixed
- Improved sidebar layout for iOS devices
  - Fixed bottom menu items being cut off
  - Added proper viewport height handling
  - Improved scrolling behavior
  - Enhanced menu item spacing and alignment
  - Better text overflow handling

## [1.0.7] - 2024-03-21

### Fixed
- Fixed DOCX and PDF export functionality in transcription history
- Fixed Delete All button functionality in history view
- Enhanced transcription animation display
- Added proper error handling and notifications for exports
- Improved state management for transcription history

### Changed
- Made transcription animation larger and more prominent
- Enhanced export error handling with user notifications
- Improved history view UI with empty state message