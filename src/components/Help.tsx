import React from 'react';
import { HelpCircle, FileQuestion, Keyboard, Zap, Server, Download, Settings, Bell, FileAudio } from 'lucide-react';
import { APP_VERSION } from '../utils/version';

interface FAQItem {
  question: string;
  answer: string;
}

interface ShortcutItem {
  key: string;
  action: string;
}

const faqs: FAQItem[] = [
  {
    question: 'Do I need an API key to start?',
    answer: 'No! You can start transcribing immediately with our built-in Groq trial key. For expanded limits and better performance, you can add your own API key from Groq, OpenAI, or Hugging Face in Settings.',
  },
  {
    question: 'Which transcription providers are available?',
    answer: 'We support Groq (recommended), OpenAI, and Hugging Face. All providers use the Whisper model for high-quality transcription.',
  },
  {
    question: 'How do I get started with transcription?',
    answer: 'Simply go to the Transcribe page and drag & drop your audio file. We\'ll use the built-in Groq trial key by default, or you can add your own API key in Settings for expanded limits.',
  },
  {
    question: 'What audio formats are supported?',
    answer: 'Text Juicer supports MP3, WAV, M4A, and OGG audio formats.',
  },
  {
    question: 'How secure is my data?',
    answer: 'Your API keys and transcription history are stored locally in your browser using secure storage. We never transmit or store your data on any servers - everything stays on your device.',
  },
  {
    question: 'Where are my API keys stored?',
    answer: 'API keys are stored in your browser\'s session storage and are automatically cleared when you close your browser. They\'re never transmitted to any server except directly to your chosen provider (Hugging Face, Groq, or OpenAI) for authentication.',
  },
  {
    question: 'Is my audio data private?',
    answer: 'Yes! Your audio files are processed directly through your chosen provider\'s API. We never store or transmit your audio files through our own servers. All transcription results are stored locally on your device.',
  },
  {
    question: 'What export formats are available?',
    answer: 'You can export transcriptions in TXT, SRT (for subtitles), DOCX, and PDF formats. Each format supports both Professional and Tropical themes.',
  },
  {
    question: 'Is there a file size limit?',
    answer: 'Yes, the maximum file size varies by provider. We recommend files under 25MB for optimal performance.',
  },
  {
    question: 'Can I use multiple API providers?',
    answer: 'Yes! You can add API keys for multiple providers and switch between them when transcribing.',
  },
  {
    question: 'What happens to my transcription history?',
    answer: 'Your transcription history is stored locally in your browser\'s IndexedDB storage. You can export it anytime and clear it when needed. We never upload your history to any servers.',
  },
  {
    question: 'How can I ensure maximum security?',
    answer: 'Clear your API keys when you\'re done using the app, especially on shared devices. You can also regularly clear your transcription history and use the export feature to backup important transcriptions.',
  },
];

const shortcuts: ShortcutItem[] = [
  { key: '⌘ + V', action: 'Paste audio file' },
  { key: '⌘ + E', action: 'Export transcription' },
  { key: '⌘ + S', action: 'Save settings' },
  { key: 'Space', action: 'Play/Pause audio preview' },
];

export function Help() {
  return (
    <div className="max-w-4xl space-y-8">
      {/* Version Info */}
      <div className="bg-gray-900/75 backdrop-blur-md rounded-[20px] p-6 border border-gray-700/30 shadow-xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-[#A2AD1E]/20 rounded-full">
            <Zap className="w-6 h-6 text-[#A2AD1E]" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-100">What's New in v1.0.6</h2>
            <p className="text-gray-400 text-sm">Released March 21, 2024</p>
          </div>
        </div>
        
        <div className="space-y-4 text-gray-300">
          <div className="space-y-2">
            <h3 className="font-medium">New Features</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>Added built-in Groq trial key for instant transcription</li>
              <li>Updated UI to show trial key status</li>
              <li>Made Groq the default transcription provider</li>
              <li>Enhanced Quick Start guide with clearer instructions</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium">Improved</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>Streamlined transcription workflow with trial key</li>
              <li>Updated FAQs with trial key information</li>
              <li>Enhanced Settings UI for API key management</li>
              <li>Better visibility of trial key status in main UI</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Start Guide */}
      <div className="bg-gray-900/75 backdrop-blur-md rounded-[20px] p-6 border border-gray-700/30 shadow-xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-[#F98128]/20 rounded-full">
            <Zap className="w-6 h-6 text-[#F98128]" />
          </div>
          <h2 className="text-xl font-semibold text-gray-100">Quick Start Guide</h2>
        </div>
        
        <div className="space-y-6">
          <div className="flex items-start gap-4 p-4 bg-gray-800/40 rounded-lg border border-gray-700/30">
            <div className="p-2 bg-[#A2AD1E]/20 rounded-full">
              <FileAudio className="w-5 h-5 text-[#A2AD1E]" />
            </div>
            <div>
              <h3 className="text-gray-200 font-medium mb-2">1. Start Transcribing</h3>
              <p className="text-gray-400">Go to the Transcribe page and drop your audio files. We'll use our built-in Groq trial key automatically.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-gray-800/40 rounded-lg border border-gray-700/30">
            <div className="p-2 bg-gray-700/50 rounded-full">
              <Settings className="w-5 h-5 text-gray-300" />
            </div>
            <div>
              <h3 className="text-gray-200 font-medium mb-2">2. Optional: Add Your Own Key</h3>
              <p className="text-gray-400">For expanded limits, add your own API key in Settings from Groq, OpenAI, or Hugging Face.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-gray-800/40 rounded-lg border border-gray-700/30">
            <div className="p-2 bg-gray-700/50 rounded-full">
              <Download className="w-5 h-5 text-gray-300" />
            </div>
            <div>
              <h3 className="text-gray-200 font-medium mb-2">3. Upload Audio</h3>
              <p className="text-gray-400">Drag & drop your audio files or click to browse. Supports MP3, WAV, M4A, OGG.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-gray-800/40 rounded-lg border border-gray-700/30">
            <div className="p-2 bg-gray-700/50 rounded-full">
              <Bell className="w-5 h-5 text-gray-300" />
            </div>
            <div>
              <h3 className="text-gray-200 font-medium mb-2">4. Monitor Progress</h3>
              <p className="text-gray-400">Watch the progress bar and notifications for updates. Results will appear automatically.</p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQs */}
      <div className="bg-gray-900/75 backdrop-blur-md rounded-[20px] p-6 border border-gray-700/30 shadow-xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-[#A2AD1E]/20 rounded-full">
            <FileQuestion className="w-6 h-6 text-[#A2AD1E]" />
          </div>
          <h2 className="text-xl font-semibold text-gray-100">Frequently Asked Questions</h2>
        </div>
        
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="p-4 bg-gray-800/40 rounded-lg border border-gray-700/30 hover:bg-gray-800/60 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-[#F96C57]" />
                <h3 className="text-gray-200 font-medium">{faq.question}</h3>
              </div>
              <p className="mt-2 text-gray-400 ml-8">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="bg-gray-900/75 backdrop-blur-md rounded-[20px] p-6 border border-gray-700/30 shadow-xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-[#F98128]/20 rounded-full">
            <Keyboard className="w-6 h-6 text-[#F98128]" />
          </div>
          <h2 className="text-xl font-semibold text-gray-100">Keyboard Shortcuts</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-gray-800/40 rounded-lg border border-gray-700/30"
            >
              <span className="text-gray-400">{shortcut.action}</span>
              <kbd className="px-3 py-1 bg-gray-700/50 rounded-lg text-gray-200 font-mono text-sm">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}