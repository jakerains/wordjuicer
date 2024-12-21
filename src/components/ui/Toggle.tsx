import React from 'react';
import { motion } from 'framer-motion';

interface ToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  leftLabel?: string;
  rightLabel?: string;
}

export function Toggle({ 
  value, 
  onChange, 
  leftIcon, 
  rightIcon,
  leftLabel,
  rightLabel 
}: ToggleProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-white/70">
        {leftIcon}
        <span className="text-sm">{leftLabel}</span>
      </div>
      
      <button
        onClick={() => onChange(!value)}
        className="relative h-8 w-16 rounded-full bg-white/10 p-1 backdrop-blur-sm transition-colors duration-200 hover:bg-white/20 border border-white/20"
      >
        <motion.div
          className="absolute top-1 left-1 h-6 w-6 rounded-full shadow-lg bg-[#E1C94B]"
          animate={{ x: value ? '2rem' : '0rem' }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        />
      </button>

      <div className="flex items-center gap-2 text-white/70">
        {rightIcon}
        <span className="text-sm">{rightLabel}</span>
      </div>
    </div>
  );
}