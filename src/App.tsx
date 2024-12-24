import React, { useState, useEffect } from 'react';
import { DropZone } from './components/DropZone';
import { TranscriptionViewer } from './components/TranscriptionViewer';
import { ExportOptions } from './components/ExportOptions';
import { TranscriptionProgress } from './components/TranscriptionProgress';
import { Dashboard } from './components/Dashboard';
import { History } from './components/History';
import { Settings } from './components/Settings';
import { Help } from './components/Help';
import { NotificationCenter } from './components/NotificationCenter';
import { Sidebar } from './components/Sidebar';
import { InstallPWA } from './components/InstallPWA';
import { exportTXT, exportSRT, exportDOCX, exportPDF } from './utils/exportFormats';
import type { ExportTheme } from './components/ExportStyleSelector';
import { transcribeAudio } from './utils/transcription';
import { Settings as SettingsIcon, Menu, FileText } from 'lucide-react';
import { useTranscriptionStore } from './store/transcriptionStore';
import { useNotificationStore } from './store/notificationStore';
import { initializeDatabase } from './db';
import { getFormattedVersion } from './utils/version';
import { GlassButton } from './components/ui/GlassButton';
import { initGA, pageview, trackTranscriptionStart, trackTranscriptionComplete, trackExport, trackError, trackFeatureUsage, trackInstallEvent, trackReturnVisit, trackAPIError } from './utils/analytics';
import { useApiKeyStore } from './store/apiKeyStore';
import { motion } from 'framer-motion';

// Define error type with status
interface APIError extends Error {
  status?: number;
}

function App() {
  const [transcription, setTranscription] = useState('');
  const [timestamps, setTimestamps] = useState<Array<{ time: number; text: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'dashboard' | 'transcribe' | 'history' | 'settings' | 'help'>('transcribe');
  const [currentFile, setCurrentFile] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { provider } = useApiKeyStore();

  const resetTranscription = () => {
    setTranscription('');
    setTimestamps([]);
    setError(null);
    setProgress(0);
  };

  const addTranscription = useTranscriptionStore((state) => state.addTranscription);
  const loadTranscriptions = useTranscriptionStore((state) => state.loadTranscriptions);
  const addNotification = useNotificationStore((state) => state.addNotification);

  useEffect(() => {
    // Initialize database and load transcriptions
    const init = async () => {
      await initializeDatabase();
      await loadTranscriptions();
    };
    init();

    // Track return visit if applicable
    const lastVisit = localStorage.getItem('lastVisit');
    if (lastVisit) {
      const daysSinceLastVisit = Math.floor((Date.now() - parseInt(lastVisit)) / (1000 * 60 * 60 * 24));
      if (daysSinceLastVisit > 0) {
        trackReturnVisit(daysSinceLastVisit);
      }
    }
    localStorage.setItem('lastVisit', Date.now().toString());
  }, []);

  useEffect(() => {
    // Initialize Google Analytics
    initGA();
    // Track initial page view
    pageview(window.location.pathname);
  }, []);

  useEffect(() => {
    // Track page view when activeView changes
    pageview(`/${activeView}`);
  }, [activeView]);

  const handleFileSelect = async (file: File) => {
    try {
      setIsLoading(true);
      setCurrentFile(file.name);
      setError(null);
      setProgress(0);
      
      trackTranscriptionStart('auto', provider as 'openai' | 'groq' | 'huggingface');
      trackFeatureUsage('transcription_start');
      
      const startTime = Date.now();
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 1000);
      
      const result = await transcribeAudio(file);
      
      // Complete the progress
      clearInterval(progressInterval);
      setProgress(100);
      
      const duration = (Date.now() - startTime) / 1000;
      trackTranscriptionComplete(duration, 'auto', provider as 'openai' | 'groq' | 'huggingface', file.size);
      trackFeatureUsage('transcription_complete');
      
      // Add to transcription store
      addTranscription({
        id: crypto.randomUUID(),
        filename: file.name,
        text: result.text,
        timestamps: result.timestamps,
        duration: duration,
        size: file.size,
        date: new Date(),
        status: 'completed'
      });

      // Add success notification
      addNotification({
        type: 'success',
        message: `Successfully transcribed ${file.name}`
      });

      setTranscription(result.text);
      setTimestamps(result.timestamps);
    } catch (err) {
      const error = err as APIError;
      const errorMessage = error.message || 'Unknown error';
      trackError(`${provider} - ${errorMessage}`);
      
      if (errorMessage.includes('API')) {
        trackAPIError(
          provider as 'openai' | 'groq' | 'huggingface',
          errorMessage,
          error.status
        );
      }
      
      addNotification({
        type: 'error',
        message: errorMessage || 'Failed to transcribe audio'
      });
      setError(errorMessage || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = (format: 'txt' | 'srt' | 'docx' | 'pdf', theme?: ExportTheme) => {
    const filename = currentFile || 'transcription';
    try {
      trackFeatureUsage('export_start');
      const blob = new Blob([transcription], { type: 'text/plain' });
      trackExport(format, true, blob.size);
      
      switch (format) {
        case 'txt':
          exportTXT(transcription, timestamps, filename);
          break;
        case 'srt':
          exportSRT(timestamps, filename);
          break;
        case 'docx':
          exportDOCX(transcription, timestamps, filename, theme);
          break;
        case 'pdf':
          exportPDF(transcription, timestamps, filename, theme);
          break;
      }
      trackFeatureUsage('export_complete');
    } catch (err) {
      trackExport(format, false);
      trackError(`Export failed - ${format}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(true);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Don't prevent default - let the browser show its native install prompt
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      trackInstallEvent('prompt_shown');
      const result = await deferredPrompt.prompt();
      
      const { outcome } = await deferredPrompt.userChoice;
      trackInstallEvent(outcome === 'accepted' ? 'installed' : 'dismissed');
      
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowInstallBanner(false);
      }
    } catch (error) {
      console.error('Error showing install prompt:', error);
      trackError(`Install prompt error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#A2AD1E] via-[#F96C57] to-[#F98128] relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="fixed top-[-50%] left-[-50%] w-[100%] h-[100%] rounded-full bg-[#E1C94B]/20 blur-[120px]" />
        <div className="fixed bottom-[-50%] right-[-50%] w-[100%] h-[100%] rounded-full bg-[#F96C57]/20 blur-[120px]" />
      </div>

      <div className="flex min-h-screen relative">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-64 fixed inset-y-0 left-0 z-50">
          <Sidebar activeView={activeView} setActiveView={setActiveView} />
        </div>

        {/* Mobile Sidebar */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-64 z-50">
              <Sidebar activeView={activeView} setActiveView={(view) => {
                setActiveView(view);
                setIsMobileMenuOpen(false);
              }} />
            </div>
          </div>
        )}

        <div className="flex-1 lg:ml-64 min-h-screen flex flex-col">
          <main className="flex-1 p-4 lg:p-8">
          <div className="flex flex-col mb-8">
            <div className="flex items-center justify-between mb-2">
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors lg:hidden"
                aria-label="Open Menu"
              >
                <Menu className="w-5 h-5 text-white/70" />
              </button>
              <div className="flex items-center gap-4">
                <NotificationCenter />
                <button 
                  onClick={() => activeView === 'settings' ? setActiveView('transcribe') : setActiveView('settings')}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  aria-label="Toggle Settings"
                >
                  <SettingsIcon className="w-5 h-5 text-white/70 animate-gear" />
                </button>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <img 
                src="/juicerbanner-wide.png" 
                alt="Word Juicer" 
                className="h-32 w-auto lg:hidden mb-6"
              />
              {activeView !== 'transcribe' && (
                <h1 className="text-xl font-medium text-white/80">
                  {activeView.charAt(0).toUpperCase() + activeView.slice(1)}
                </h1>
              )}
            </div>
          </div>

          <div className="space-y-4 lg:space-y-8 max-w-4xl mx-auto">
            {activeView === 'dashboard' && <Dashboard />}
            {activeView === 'transcribe' && (
              <div className="space-y-8">
                {!isLoading && <DropZone onFileSelect={handleFileSelect} isLoading={isLoading} />}

                {error && (
                  <div className="w-full p-4 bg-white/10 backdrop-blur-md border border-red-500/20 rounded-[20px] text-red-300">
                    {error}
                  </div>
                )}
                
                {isLoading && (
                  <div className="w-full bg-white/10 backdrop-blur-md rounded-[20px] p-8 border border-white/20">
                    <TranscriptionProgress />
                  </div>
                )}
                
                {transcription && !isLoading && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between gap-2 sm:gap-4">
                      <div className="bg-white/10 backdrop-blur-md rounded-[16px] p-1 sm:p-2">
                        <GlassButton
                          variant="dark"
                          size="sm"
                          onClick={resetTranscription}
                          icon={<FileText className="w-4 h-4" />}
                        >
                          <span className="text-xs sm:text-sm">New</span>
                        </GlassButton>
                      </div>
                      <ExportOptions onExport={handleExport} disabled={isLoading} />
                    </div>
                    <TranscriptionViewer transcription={transcription} timestamps={timestamps} />
                  </div>
                )}
              </div>
            )}
            {activeView === 'history' && <History />}
            {activeView === 'settings' && <Settings setActiveView={setActiveView} />}
            {activeView === 'help' && <Help />}
          </div>
          </main>
          <footer className="w-full text-center py-2 text-white/80 border-t border-white/10">
            Made with <span className="text-[#E1C94B]">♥</span> by{' '}
            <span className="space-x-1">
              <a
                href="https://www.x.com/jakerains"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-[#E1C94B] transition-colors">
                GenAI Jake
              </a>
              <span className="text-white/50">•</span>
              <span className="text-white/50">{getFormattedVersion()}</span>
            </span>
          </footer>
        </div>
      </div>
      {showInstallBanner && (
        <InstallPWA
          deferredPrompt={deferredPrompt}
          onInstall={handleInstall}
          onDismiss={() => setShowInstallBanner(false)}
        />
      )}

      {/* Launch Special Starburst */}
      <motion.div
        initial={{ rotate: -10, scale: 0 }}
        animate={{ rotate: 0, scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
          delay: 1
        }}
        className="fixed bottom-8 right-8 z-50 select-none"
      >
        <div className="relative">
          {/* Glossy Starburst Base */}
          <div 
            className="absolute inset-0 w-[200px] h-[200px]"
            style={{
              background: 'linear-gradient(135deg, #F96C57, #E1C94B)',
              clipPath: 'polygon(50% 0%, 65% 25%, 97% 25%, 70% 50%, 79% 95%, 50% 70%, 21% 95%, 30% 50%, 3% 25%, 35% 25%)',
              transform: 'rotate(5deg)',
              filter: 'drop-shadow(0 8px 16px rgba(249, 108, 87, 0.3))'
            }}
          />
          
          {/* Inner Starburst */}
          <div 
            className="absolute inset-[4px] w-[192px] h-[192px]"
            style={{
              background: 'linear-gradient(135deg, #FFB347, #FFD700)',
              clipPath: 'polygon(50% 0%, 65% 25%, 97% 25%, 70% 50%, 79% 95%, 50% 70%, 21% 95%, 30% 50%, 3% 25%, 35% 25%)',
              transform: 'rotate(5deg)',
            }}
          >
            {/* Glossy Overlay */}
            <div 
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.2) 30%, rgba(255,255,255,0) 50%, rgba(0,0,0,0.1) 100%)',
                clipPath: 'polygon(50% 0%, 65% 25%, 97% 25%, 70% 50%, 79% 95%, 50% 70%, 21% 95%, 30% 50%, 3% 25%, 35% 25%)'
              }}
            />
          </div>

          {/* Inner Content */}
          <motion.div 
            animate={{ 
              rotate: [0, -3, 3, -3, 0],
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            }}
            className="relative flex flex-col items-center justify-center text-center w-[200px] h-[200px]"
            style={{
              textShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            {/* Lemon Icon */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2">
              <svg 
                width="48" 
                height="48" 
                viewBox="0 0 48 48" 
                className="transform -rotate-12"
              >
                {/* Main Lemon Shape */}
                <path
                  d="M24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44Z"
                  fill="url(#lemonGradient)"
                  filter="url(#lemonShadow)"
                />
                
                {/* Highlight */}
                <path
                  d="M24 8C14.0589 8 6 16.0589 6 26C6 35.9411 14.0589 44 24 44C33.9411 44 42 35.9411 42 26"
                  fill="url(#lemonHighlight)"
                  opacity="0.6"
                />

                {/* Leaf */}
                <path
                  d="M23 4C23 4 20 0 24 0C28 0 25 4 25 4"
                  fill="url(#leafGradient)"
                />
                
                {/* Leaf Highlight */}
                <path
                  d="M23.5 3C23.5 3 22 1 24 1C26 1 24.5 3 24.5 3"
                  fill="url(#leafHighlight)"
                  opacity="0.5"
                />

                {/* Definitions */}
                <defs>
                  {/* Lemon Base Gradient */}
                  <linearGradient id="lemonGradient" x1="4" y1="4" x2="44" y2="44">
                    <stop offset="0%" stopColor="#FFD700" />
                    <stop offset="100%" stopColor="#FFA500" />
                  </linearGradient>

                  {/* Lemon Highlight Gradient */}
                  <linearGradient id="lemonHighlight" x1="6" y1="8" x2="42" y2="44">
                    <stop offset="0%" stopColor="white" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="white" stopOpacity="0" />
                  </linearGradient>

                  {/* Leaf Gradient */}
                  <linearGradient id="leafGradient" x1="20" y1="0" x2="28" y2="4">
                    <stop offset="0%" stopColor="#C1CF2A" />
                    <stop offset="100%" stopColor="#A2AD1E" />
                  </linearGradient>

                  {/* Leaf Highlight */}
                  <linearGradient id="leafHighlight" x1="22" y1="1" x2="26" y2="3">
                    <stop offset="0%" stopColor="white" />
                    <stop offset="100%" stopColor="white" stopOpacity="0" />
                  </linearGradient>

                  {/* Shadow Filter */}
                  <filter id="lemonShadow" x="-2" y="-2" width="52" height="52">
                    <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.3" />
                  </filter>
                </defs>
              </svg>
            </div>

            <div className="mt-12">
              <span 
                className="text-sm font-black tracking-wider"
                style={{
                  background: 'linear-gradient(to bottom, #FFFFFF, #F0F0F0)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.2))'
                }}
              >
                LAUNCH SPECIAL!
              </span>
              <div className="text-xs mt-1 text-white font-medium opacity-90">NOW WITH</div>
              <span 
                className="text-xl mt-1 font-black block"
                style={{
                  background: 'linear-gradient(to bottom, #FFFFFF, #F0F0F0)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.2))'
                }}
              >
                MORE
              </span>
              <span 
                className="text-2xl font-black tracking-wider block"
                style={{
                  background: 'linear-gradient(to bottom, #A2AD1E, #8A9419)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.2))'
                }}
              >
                CITRUS!
              </span>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

export default App;