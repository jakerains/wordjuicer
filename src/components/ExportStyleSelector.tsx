import React from 'react';
import { Sparkles, Briefcase } from 'lucide-react';
import { GlassButton } from './ui/GlassButton';
import { cn } from '../utils/cn';

export type ExportTheme = 'professional' | 'tropical';

interface ExportStyleSelectorProps {
  onSelect: (theme: ExportTheme) => void;
  onCancel: () => void;
}

export function ExportStyleSelector({ onSelect, onCancel }: ExportStyleSelectorProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900/90 backdrop-blur-md rounded-[20px] p-8 max-w-md w-full mx-4 border border-gray-700/30 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Choose Your Style</h2>
        
        <div className="space-y-4">
          <button
            onClick={() => onSelect('professional')}
            className={cn(
              "w-full p-6 rounded-xl border transition-all duration-300",
              "bg-gray-800/60 border-gray-700/30",
              "hover:bg-gray-800/80 hover:border-gray-600/50",
              "group"
            )}
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="p-2 bg-gray-700/50 rounded-full">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white">Professional</h3>
            </div>
            <p className="text-gray-400 text-sm text-left">
              Clean, modern, and professional design perfect for business and formal use.
            </p>
          </button>

          <button
            onClick={() => onSelect('tropical')}
            className={cn(
              "w-full p-6 rounded-xl border transition-all duration-300",
              "bg-gradient-to-br from-[#A2AD1E]/20 via-[#F96C57]/20 to-[#F98128]/20",
              "border-white/20 hover:border-white/30",
              "group relative overflow-hidden"
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#A2AD1E]/20 via-[#F96C57]/20 to-[#F98128]/20 animate-gradient" />
            <div className="relative">
              <div className="flex items-center gap-4 mb-3">
                <div className="p-2 bg-white/10 rounded-full">
                  <Sparkles className="w-6 h-6 text-[#F98128]" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  Dare to go Tropical?
                </h3>
              </div>
              <p className="text-gray-200 text-sm text-left">
                Vibrant, fun, and citrus-inspired design that brings your transcripts to life!
              </p>
            </div>
          </button>
        </div>

        <div className="mt-6 flex justify-end">
          <GlassButton
            variant="dark"
            size="sm"
            onClick={onCancel}
          >
            Cancel
          </GlassButton>
        </div>
      </div>
    </div>
  );
}