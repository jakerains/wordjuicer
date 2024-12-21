import React, { useState, useEffect } from 'react';
import { Clock, FileAudio, CheckCircle } from 'lucide-react';
import { useTranscriptionStore } from '../store/transcriptionStore';
import { formatDuration } from '../utils/formatters';
import { TranscriptionViewer } from './TranscriptionViewer';
import { Stats } from '../types';
import { GlassButton } from './ui/GlassButton';
import { ChevronLeft } from 'lucide-react';

export function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalTranscriptions: 0,
    totalDuration: 0,
    completedToday: 0
  });
  const transcriptions = useTranscriptionStore((state) => state.transcriptions);
  const getStats = useTranscriptionStore((state) => state.getStats);
  const [selectedTranscription, setSelectedTranscription] = useState<any>(null);

  useEffect(() => {
    const loadStats = async () => {
      const newStats = await getStats();
      setStats(newStats);
    };
    loadStats();
  }, [getStats, transcriptions]);

  // Get the 5 most recent transcriptions
  const recentTranscriptions = transcriptions
    .slice(0, 5)
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="space-y-8">
      {selectedTranscription ? (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <GlassButton
              variant="secondary"
              size="sm"
              onClick={() => setSelectedTranscription(null)}
              icon={<ChevronLeft className="w-4 h-4" />}
            >
              Back to Dashboard
            </GlassButton>
          </div>
          <TranscriptionViewer
            transcription={selectedTranscription.text}
            timestamps={selectedTranscription.timestamps}
          />
        </div>
      ) : (
        <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="bg-gray-900/75 backdrop-blur-md rounded-[20px] p-6 border border-gray-700/30 shadow-xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-[#A2AD1E]/20 rounded-full">
              <FileAudio className="w-6 h-6 text-[#A2AD1E]" />
            </div>
            <h3 className="text-lg font-medium text-gray-100">Total Transcriptions</h3>
          </div>
          <p className="text-3xl font-bold text-gray-100">{stats.totalTranscriptions}</p>
        </div>

        <div className="bg-gray-900/75 backdrop-blur-md rounded-[20px] p-6 border border-gray-700/30 shadow-xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-[#F96C57]/20 rounded-full">
              <Clock className="w-6 h-6 text-[#F96C57]" />
            </div>
            <h3 className="text-lg font-medium text-gray-100">Total Duration</h3>
          </div>
          <p className="text-3xl font-bold text-gray-100">{formatDuration(stats.totalDuration)}</p>
        </div>

        <div className="bg-gray-900/75 backdrop-blur-md rounded-[20px] p-6 border border-gray-700/30 shadow-xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-[#F98128]/20 rounded-full">
              <CheckCircle className="w-6 h-6 text-[#F98128]" />
            </div>
            <h3 className="text-lg font-medium text-gray-100">Completed Today</h3>
          </div>
          <p className="text-3xl font-bold text-gray-100">{stats.completedToday}</p>
        </div>
      </div>

      <div className="bg-gray-900/75 backdrop-blur-md rounded-[20px] p-6 border border-gray-700/30 shadow-xl">
        <h3 className="text-xl font-semibold text-gray-100 mb-6">Recent Activity</h3>
        <div className="space-y-4">
          {recentTranscriptions.map((transcription) => (
            <div
              key={transcription.id}
              className="flex items-center justify-between p-4 bg-gray-800/60 rounded-lg border border-gray-700/30 hover:bg-gray-800/70 transition-colors cursor-pointer group"
              onClick={() => setSelectedTranscription(transcription)}
            >
              <div className="flex items-center gap-4">
                <FileAudio className="w-5 h-5 text-gray-300" />
                <div>
                  <p className="text-gray-100 font-medium group-hover:text-[#A2AD1E] transition-colors">
                    {transcription.filename}
                  </p>
                  <p className="text-sm text-gray-400">
                    {(transcription.size / (1024 * 1024)).toFixed(1)}MB • {formatDuration(transcription.duration)}
                  </p>
                </div>
              </div>
              <span className="text-sm text-gray-400">
                {formatDuration((Date.now() - transcription.date.getTime()) / 60000)} ago
              </span>
            </div>
          ))}
        </div>
      </div>
      </>
      )}
    </div>
  );
}