'use client';

import React from 'react';

interface TesseraLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'text';
  theme?: 'light' | 'dark' | 'gradient';
}

// Tessera Icon Component - Mathematical tessellation pattern
export const TesseraIcon: React.FC<{
  className?: string;
  size?: number;
  theme?: 'light' | 'dark' | 'gradient';
}> = ({ className = '', size = 24, theme = 'gradient' }) => {
  const getThemeColors = () => {
    switch (theme) {
      case 'light':
        return { primary: '#0f172a', secondary: '#334155', accent: '#64748b' };
      case 'dark':
        return { primary: '#f8fafc', secondary: '#e2e8f0', accent: '#cbd5e1' };
      case 'gradient':
      default:
        return { primary: '#3b82f6', secondary: '#8b5cf6', accent: '#06b6d4' };
    }
  };

  const colors = getThemeColors();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {theme === 'gradient' && (
        <defs>
          <linearGradient id="tessera-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.primary} />
            <stop offset="50%" stopColor={colors.secondary} />
            <stop offset="100%" stopColor={colors.accent} />
          </linearGradient>
          <linearGradient id="tessera-gradient-2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors.accent} />
            <stop offset="50%" stopColor={colors.secondary} />
            <stop offset="100%" stopColor={colors.primary} />
          </linearGradient>
        </defs>
      )}
      
      {/* Main tessellation pattern - interlocking squares creating mosaic effect */}
      <g transform="translate(2, 2)">
        {/* Primary tessera tile */}
        <rect
          x="0"
          y="0"
          width="12"
          height="12"
          rx="2"
          fill={theme === 'gradient' ? 'url(#tessera-gradient)' : colors.primary}
          opacity="0.9"
        />
        
        {/* Secondary tessera tile */}
        <rect
          x="8"
          y="8"
          width="12"
          height="12"
          rx="2"
          fill={theme === 'gradient' ? 'url(#tessera-gradient-2)' : colors.secondary}
          opacity="0.8"
        />
        
        {/* Tertiary tessera tile */}
        <rect
          x="16"
          y="0"
          width="12"
          height="12"
          rx="2"
          fill={theme === 'gradient' ? 'url(#tessera-gradient)' : colors.accent}
          opacity="0.7"
        />
        
        {/* Accent tessera tiles */}
        <rect
          x="0"
          y="16"
          width="8"
          height="8"
          rx="1"
          fill={theme === 'gradient' ? 'url(#tessera-gradient-2)' : colors.secondary}
          opacity="0.6"
        />
        
        <rect
          x="12"
          y="16"
          width="8"
          height="8"
          rx="1"
          fill={theme === 'gradient' ? 'url(#tessera-gradient)' : colors.primary}
          opacity="0.5"
        />
        
        <rect
          x="24"
          y="16"
          width="4"
          height="4"
          rx="0.5"
          fill={theme === 'gradient' ? 'url(#tessera-gradient-2)' : colors.accent}
          opacity="0.8"
        />
        
        <rect
          x="24"
          y="24"
          width="4"
          height="4"
          rx="0.5"
          fill={theme === 'gradient' ? 'url(#tessera-gradient)' : colors.primary}
          opacity="0.9"
        />
      </g>
      
      {/* Connection lines showing pattern relationships */}
      <g stroke={theme === 'gradient' ? colors.accent : colors.secondary} strokeWidth="0.5" opacity="0.3">
        <line x1="8" y1="8" x2="14" y2="14" />
        <line x1="14" y1="8" x2="20" y2="14" />
        <line x1="8" y1="20" x2="20" y2="20" />
      </g>
    </svg>
  );
};

// Main Tessera Logo Component
export const TesseraLogo: React.FC<TesseraLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'full',
  theme = 'gradient'
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'xs': return { icon: 16, text: 'text-sm', container: 'h-6' };
      case 'sm': return { icon: 20, text: 'text-base', container: 'h-8' };
      case 'md': return { icon: 24, text: 'text-lg', container: 'h-10' };
      case 'lg': return { icon: 32, text: 'text-xl', container: 'h-12' };
      case 'xl': return { icon: 40, text: 'text-2xl', container: 'h-16' };
      default: return { icon: 24, text: 'text-lg', container: 'h-10' };
    }
  };

  const sizeConfig = getSizeClasses();
  
  const getTextTheme = () => {
    switch (theme) {
      case 'light':
        return 'text-slate-900';
      case 'dark':
        return 'text-slate-100';
      case 'gradient':
      default:
        return 'bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent';
    }
  };

  if (variant === 'icon') {
    return (
      <div className={`flex items-center justify-center ${sizeConfig.container} ${className}`}>
        <TesseraIcon size={sizeConfig.icon} theme={theme} />
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div className={`flex items-center ${sizeConfig.container} ${className}`}>
        <span className={`font-bold tracking-tight ${sizeConfig.text} ${getTextTheme()}`}>
          Tessera
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-3 ${sizeConfig.container} ${className}`}>
      <div className="relative">
        <TesseraIcon size={sizeConfig.icon} theme={theme} />
        {theme === 'gradient' && (
          <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-xl animate-pulse"></div>
        )}
      </div>
      <span className={`font-bold tracking-tight ${sizeConfig.text} ${getTextTheme()}`}>
        Tessera
      </span>
    </div>
  );
};

export default TesseraLogo;