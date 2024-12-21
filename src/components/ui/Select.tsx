import React from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export function Select({ options, value, onChange, icon, disabled }: SelectProps) {
  return (
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70">
        {icon}
      </div>
      
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full appearance-none bg-black/20 backdrop-blur-md border border-white/20 rounded-lg pl-12 pr-10 py-2 text-white focus:outline-none focus:border-[#A2AD1E] transition-colors cursor-pointer"
        >
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              className="bg-black/90 backdrop-blur-md text-white py-3 px-4 hover:bg-white/20 cursor-pointer"
            >
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-0 pointer-events-none rounded-lg bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
      </div>
      
      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 pointer-events-none">
        <ChevronDown className="w-5 h-5" />
      </div>
    </div>
  );
}