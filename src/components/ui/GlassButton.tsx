import React from 'react';
import { cn } from '../../utils/cn';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export function GlassButton({ 
  children, 
  className,
  variant = 'primary',
  size = 'md',
  icon,
  disabled,
  ...props 
}: GlassButtonProps) {
  const baseStyles = `
    glass-button
    flex items-center justify-center gap-2
    font-medium transition-all duration-300
    disabled:opacity-50 disabled:cursor-not-allowed
    backdrop-blur-md shadow-lg hover:shadow-xl
    text-shadow-sm
  `;

  const variants = {
    primary: `
      bg-[#A2AD1E]/30 border border-[#A2AD1E]/40 text-white
      hover:bg-[#A2AD1E]/40 hover:border-[#A2AD1E]/50
      shadow-[#A2AD1E]/10
    `,
    secondary: `
      bg-white/20 border border-white/40 text-white
      hover:bg-white/30 hover:border-white/50
      shadow-white/10
    `,
    danger: `
      bg-[#F96C57]/30 border border-[#F96C57]/40 text-white
      hover:bg-[#F96C57]/40 hover:border-[#F96C57]/50
      shadow-[#F96C57]/10
    `,
    dark: `
      bg-gray-800/80 border border-gray-700/40 text-white
      hover:bg-gray-800/90 hover:border-gray-700/50
      shadow-gray-800/20
    `
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm rounded-lg font-semibold',
    md: 'px-6 py-3 rounded-xl font-semibold',
    lg: 'px-8 py-4 text-lg rounded-2xl font-semibold'
  };

  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="relative z-10">{icon}</span>}
      <span className="relative z-10">{children}</span>
    </button>
  );
}