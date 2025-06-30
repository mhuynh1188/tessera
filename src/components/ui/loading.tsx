'use client';

import { cn } from '@/lib/utils';
import { Hexagon, Loader2 } from 'lucide-react';

interface LoadingProps {
  variant?: 'default' | 'minimal' | 'hexagon' | 'dots' | 'pulse' | 'skeleton';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  className?: string;
  fullScreen?: boolean;
}

const LoadingSpinner = ({ size = 'md', className }: { size?: string; className?: string }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  return (
    <Loader2 className={cn('animate-spin', sizeClasses[size as keyof typeof sizeClasses], className)} />
  );
};

const HexagonLoader = ({ size = 'md', className }: { size?: string; className?: string }) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  return (
    <div className={cn('relative', className)}>
      <Hexagon className={cn('animate-spin text-blue-500', sizeClasses[size as keyof typeof sizeClasses])} />
      <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-xl animate-pulse"></div>
    </div>
  );
};

const DotsLoader = ({ size = 'md', className }: { size?: string; className?: string }) => {
  const dotSizes = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4'
  };

  const dotSize = dotSizes[size as keyof typeof dotSizes];

  return (
    <div className={cn('flex space-x-1', className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'bg-blue-500 rounded-full animate-pulse',
            dotSize
          )}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  );
};

const PulseLoader = ({ size = 'md', className }: { size?: string; className?: string }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  return (
    <div className={cn('relative', className)}>
      <div className={cn('bg-blue-500 rounded-full animate-ping opacity-75', sizeClasses[size as keyof typeof sizeClasses])}></div>
      <div className={cn('bg-blue-600 rounded-full absolute inset-0', sizeClasses[size as keyof typeof sizeClasses])}></div>
    </div>
  );
};

const SkeletonLoader = ({ className }: { className?: string }) => {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="animate-pulse flex space-x-4">
        <div className="rounded-full bg-gray-200 h-10 w-10"></div>
        <div className="flex-1 space-y-2 py-1">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
      <div className="animate-pulse space-y-2">
        <div className="h-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded w-4/6"></div>
      </div>
    </div>
  );
};

export function Loading({ 
  variant = 'default', 
  size = 'md', 
  text, 
  className,
  fullScreen = false 
}: LoadingProps) {
  const containerClasses = fullScreen 
    ? 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50'
    : 'flex items-center justify-center p-4';

  const renderLoader = () => {
    switch (variant) {
      case 'minimal':
        return <LoadingSpinner size={size} className="text-gray-400" />;
      case 'hexagon':
        return <HexagonLoader size={size} />;
      case 'dots':
        return <DotsLoader size={size} />;
      case 'pulse':
        return <PulseLoader size={size} />;
      case 'skeleton':
        return <SkeletonLoader />;
      default:
        return (
          <div className="flex flex-col items-center space-y-3">
            <div className="relative">
              <HexagonLoader size={size} />
            </div>
            {text && (
              <p className="text-sm text-gray-600 font-medium animate-pulse">
                {text}
              </p>
            )}
          </div>
        );
    }
  };

  return (
    <div className={cn(containerClasses, className)}>
      {fullScreen && (
        <div className="bg-white rounded-2xl p-8 shadow-2xl border border-gray-100">
          {renderLoader()}
        </div>
      )}
      {!fullScreen && renderLoader()}
    </div>
  );
}

// Individual component exports for convenience
export { LoadingSpinner, HexagonLoader, DotsLoader, PulseLoader, SkeletonLoader };