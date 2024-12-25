import React from 'react';
import { HelpCircle, FileQuestion, Keyboard, Zap, Server, Download, Settings, Bell } from 'lucide-react';
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
    question: 'Which transcription providers are available?',
    answer: 'We support Hugging Face, Groq, and OpenAI. All providers use the Whisper model for high-quality transcription.',
  },
  {
    question: 'How do I get started with transcription?',
    answer: 'First, add your API key for any provider in Settings. Then return to the Transcribe page where you can drag & drop your audio file.',
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
            <h2 className="text-xl font-semibold text-gray-100">What's New in {APP_VERSION}</h2>
            <p className="text-gray-400 text-sm">Released March 19, 2024</p>
          </div>
        </div>
        
        <div className="space-y-4 text-gray-300">
          <div className="space-y-2">
            <h3 className="font-medium">Fixed</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>Corrected Groq implementation with proper endpoint and model name</li>
              <li>Removed unsupported parameters from Groq API requests</li>
              <li>Improved error handling for Groq API responses</li>
              <li>Updated API documentation to reflect correct Groq configuration</li>
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
            <div className="p-2 bg-gray-700/50 rounded-full">
              <Settings className="w-5 h-5 text-gray-300" />
            </div>
            <div>
              <h3 className="text-gray-200 font-medium mb-2">1. Configure API Provider</h3>
              <p className="text-gray-400">Visit Settings to add your API key for any provider (Hugging Face, Groq, or OpenAI).</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-gray-800/40 rounded-lg border border-gray-700/30">
            <div className="p-2 bg-gray-700/50 rounded-full">
              <Server className="w-5 h-5 text-gray-300" />
            </div>
            <div>
              <h3 className="text-gray-200 font-medium mb-2">2. Select Provider</h3>
              <p className="text-gray-400">Choose your preferred provider from the available options on the Transcribe page.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-gray-800/40 rounded-lg border border-gray-700/30">
            <div className="p-2 bg-gray-700/50 rounded-full">
              <Download className="w-5 h-5 text-gray-300" />
            </div>
            <div>
              <h3 className="text-gray-200 font-medium mb-2">3. Upload Audio</h3>
              <p className="text-gray-400">Drag & drop your audio file or click to browse. Supported formats: MP3, WAV, M4A, OGG.</p>
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