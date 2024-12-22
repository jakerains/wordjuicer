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

function App() {
  const [transcription, setTranscription] = useState('');
  const [timestamps, setTimestamps] = useState<Array<{ time: number; text: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'dashboard' | 'transcribe' | 'history' | 'settings' | 'help'>('transcribe');
  const [currentFile, setCurrentFile] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
  }, []);
  const handleFileSelect = async (file: File) => {
    try {
      setIsLoading(true);
      setCurrentFile(file.name);
      setError(null);
      setProgress(0);
      
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
      
      // Add to transcription store
      addTranscription({
        id: crypto.randomUUID(),
        filename: file.name,
        text: result.text,
        timestamps: result.timestamps,
        duration: 0, // This would come from audio metadata
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
      addNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to transcribe audio'
      });
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = (format: 'txt' | 'srt' | 'docx' | 'pdf', theme?: ExportTheme) => {
    const filename = currentFile || 'transcription';
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
      // Show the install prompt
      const result = await deferredPrompt.prompt();
      console.log('Install prompt shown');
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowInstallBanner(false);
      }
    } catch (error) {
      console.error('Error showing install prompt:', error);
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
                    <TranscriptionProgress progress={progress} />
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
    </div>
  );
}

export default App;