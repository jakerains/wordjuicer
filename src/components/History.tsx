import React from 'react';
import { FileAudio, Download, Trash2, ChevronRight, ChevronLeft, Archive, FileText } from 'lucide-react';
import { useTranscriptionStore } from '../store/transcriptionStore';
import { formatDuration } from '../utils/formatters';
import { TranscriptionViewer } from './TranscriptionViewer';
import { GlassButton } from './ui/GlassButton';
import { exportAllTranscriptions, exportTXT, exportSRT, exportDOCX, exportPDF } from '../utils/exportFormats';
import { ExportStyleSelector } from './ExportStyleSelector';
import type { ExportTheme } from './ExportStyleSelector';
import { useNotificationStore } from '../store/notificationStore';
import { ExportOptions } from './ExportOptions';

interface TranscriptionDetailsProps {
  transcription: any;
  onBack: () => void;
}

function TranscriptionDetails({ transcription, onBack }: TranscriptionDetailsProps) {
  const handleExport = (format: 'txt' | 'srt' | 'docx' | 'pdf', theme?: ExportTheme) => {
    switch (format) {
      case 'txt':
        exportTXT(transcription.text, transcription.timestamps, transcription.filename);
        break;
      case 'srt':
        exportSRT(transcription.timestamps, transcription.filename);
        break;
      case 'docx':
        exportDOCX(transcription.text, transcription.timestamps, transcription.filename, theme);
        break;
      case 'pdf':
        exportPDF(transcription.text, transcription.timestamps, transcription.filename, theme);
        break;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <GlassButton
          variant="dark"
          size="sm"
          onClick={onBack}
          icon={<ChevronLeft className="w-4 h-4" />}
        >
          <span className="text-xs sm:text-sm">Back</span>
        </GlassButton>
        <div className="flex items-center gap-2 sm:gap-4">
          <ExportOptions onExport={handleExport} disabled={false} />
        </div>
      </div>
      <TranscriptionViewer
        transcription={transcription.text}
        timestamps={transcription.timestamps}
      />
    </div>
  );
}

export function History() {
  const transcriptions = useTranscriptionStore((state) => state.transcriptions);
  const removeTranscription = useTranscriptionStore((state) => state.removeTranscription);
  const addNotification = useNotificationStore((state) => state.addNotification);
  const [selectedTranscription, setSelectedTranscription] = React.useState<any>(null);
  const [showStyleSelector, setShowStyleSelector] = React.useState(false);

  const handleExportAll = async (theme: ExportTheme) => {
    try {
      setShowStyleSelector(false);
      await exportAllTranscriptions(transcriptions, theme);
      addNotification({
        type: 'success',
        message: 'Successfully exported all transcriptions'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Failed to export transcriptions'
      });
    }
  };

  return (
    <div className="space-y-6">
      {selectedTranscription ? (
        <TranscriptionDetails
          transcription={selectedTranscription}
          onBack={() => setSelectedTranscription(null)}
        />
      ) : (
      <div className="bg-gray-900/75 backdrop-blur-md rounded-[20px] p-6 border border-gray-700/30 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-100">Transcription History</h2>
          <div className="flex gap-2">
            <GlassButton
              variant="dark"
              size="sm"
              onClick={() => setShowStyleSelector(true)}
              disabled={transcriptions.length === 0}
              icon={<Archive className="w-4 h-4" />}
            >
              Export All
            </GlassButton>
            <GlassButton variant="dark" size="sm">
              Filter
            </GlassButton>
            <GlassButton variant="dark" size="sm">
              Sort
            </GlassButton>
          </div>
        </div>

        <div className="space-y-4">
          {transcriptions.map((record) => (
            <div
              key={record.id}
              className="flex items-center justify-between p-4 bg-gray-800/60 rounded-lg hover:bg-gray-800/70 transition-colors cursor-pointer group border border-gray-700/30"
              onClick={() => setSelectedTranscription(record)}
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-[#A2AD1E]/20 rounded-full">
                  <FileAudio className="w-5 h-5 text-[#A2AD1E]" />
                </div>
                <div>
                  <p className="text-gray-100 font-medium group-hover:text-[#A2AD1E] transition-colors">
                    {record.filename}
                  </p>
                  <p className="text-sm text-gray-400">
                    {(record.size / (1024 * 1024)).toFixed(1)}MB • {formatDuration(record.duration)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-400">
                  {new Date(record.date).toLocaleDateString()}
                </span>
                <div className="flex gap-2">
                  <GlassButton
                    variant="secondary"
                    size="sm"
                    icon={<Download className="w-4 h-4" />}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle download
                    }}
                  />
                  <GlassButton
                    variant="danger"
                    size="sm"
                    icon={<Trash2 className="w-4 h-4" />}
                    onClick={() => removeTranscription(record.id)}
                  />
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#A2AD1E] transition-colors" />
              </div>
            </div>
          ))}
        </div>
      </div>
      )}
      {showStyleSelector && (
          <ExportStyleSelector
            onSelect={handleExportAll}
            onCancel={() => setShowStyleSelector(false)}
          />
      )}
    </div>
  );
}