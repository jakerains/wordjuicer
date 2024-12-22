import React from 'react';
import { FileText, FileVideo, FileSpreadsheet, FileDown } from 'lucide-react';
import { GlassButton } from './ui/GlassButton';

interface ExportOptionsProps {
  onExport: (format: 'txt' | 'srt' | 'docx' | 'pdf', theme?: ExportTheme) => void;
  disabled: boolean;
}

export function ExportOptions({ onExport, disabled }: ExportOptionsProps) {
  return (
    <div className="flex flex-wrap gap-1 sm:gap-3 bg-white/10 backdrop-blur-md rounded-[16px] p-1 sm:p-2">
      <GlassButton
        variant="dark"
        size="sm"
        onClick={() => onExport('txt')}
        disabled={disabled}
        icon={<FileText className="w-4 h-4" />}
      >
        <span className="text-xs sm:text-sm">TXT</span>
      </GlassButton>
      
      <GlassButton
        variant="dark"
        size="sm"
        onClick={() => onExport('srt')}
        disabled={disabled}
        icon={<FileVideo className="w-4 h-4" />}
      >
        <span className="text-xs sm:text-sm">SRT</span>
      </GlassButton>
      
      <GlassButton
        variant="dark"
        size="sm"
        onClick={() => onExport('docx')}
        disabled={disabled}
        icon={<FileSpreadsheet className="w-4 h-4" />}
      >
        <span className="text-xs sm:text-sm">DOCX</span>
      </GlassButton>
      
      <GlassButton
        variant="dark"
        size="sm"
        onClick={() => onExport('pdf')}
        disabled={disabled}
        icon={<FileDown className="w-4 h-4" />}
      >
        <span className="text-xs sm:text-sm">PDF</span>
      </GlassButton>
    </div>
  );
}