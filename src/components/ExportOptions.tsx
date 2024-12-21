import React from 'react';
import { FileText, FileVideo, FileSpreadsheet, FileDown } from 'lucide-react';
import { GlassButton } from './ui/GlassButton';

interface ExportOptionsProps {
  onExport: (format: 'txt' | 'srt' | 'docx' | 'pdf', theme?: ExportTheme) => void;
  disabled: boolean;
}

export function ExportOptions({ onExport, disabled }: ExportOptionsProps) {
  return (
    <div className="flex flex-wrap gap-3 bg-white/10 backdrop-blur-md rounded-[16px] p-2">
      <GlassButton
        variant="dark"
        onClick={() => onExport('txt')}
        disabled={disabled}
        icon={<FileText className="w-4 h-4" />}
      >
        Export TXT
      </GlassButton>
      
      <GlassButton
        variant="dark"
        onClick={() => onExport('srt')}
        disabled={disabled}
        icon={<FileVideo className="w-4 h-4" />}
      >
        Export SRT
      </GlassButton>
      
      <GlassButton
        variant="dark"
        onClick={() => onExport('docx')}
        disabled={disabled}
        icon={<FileSpreadsheet className="w-4 h-4" />}
      >
        Export DOCX
      </GlassButton>
      
      <GlassButton
        variant="dark"
        onClick={() => onExport('pdf')}
        disabled={disabled}
        icon={<FileDown className="w-4 h-4" />}
      >
        Export PDF
      </GlassButton>
    </div>
  );
}