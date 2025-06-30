'use client';

import React, { useState, useCallback } from 'react';
import Joyride, { 
  Step, 
  CallBackProps, 
  STATUS, 
  EVENTS, 
  ACTIONS,
  Placement,
  Styles
} from 'react-joyride';
import { Button } from '@/components/ui/button';
import { 
  Play, 
  SkipForward, 
  Square, 
  ArrowRight,
  ArrowLeft,
  X,
  Lightbulb
} from 'lucide-react';

interface ProductTourProps {
  steps: Step[];
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
  tourKey: string;
}

// Custom styles for the tour
const tourStyles: Styles = {
  options: {
    primaryColor: '#3b82f6',
    backgroundColor: '#1f2937',
    textColor: '#f9fafb',
    zIndex: 10000,
  },
  tooltip: {
    backgroundColor: '#1f2937',
    color: '#f9fafb',
    borderRadius: '12px',
    border: '1px solid #374151',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(59, 130, 246, 0.1)',
    maxWidth: '400px',
    padding: '24px',
  },
  tooltipContainer: {
    textAlign: 'left',
  },
  tooltipTitle: {
    color: '#f9fafb',
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '12px',
    lineHeight: '1.4',
  },
  tooltipContent: {
    color: '#d1d5db',
    fontSize: '14px',
    lineHeight: '1.6',
    marginBottom: '16px',
  },
  tooltipFooter: {
    marginTop: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonNext: {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  buttonBack: {
    backgroundColor: 'transparent',
    color: '#9ca3af',
    border: '1px solid #374151',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  buttonSkip: {
    backgroundColor: 'transparent',
    color: '#6b7280',
    border: 'none',
    padding: '8px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  buttonClose: {
    backgroundColor: 'transparent',
    color: '#6b7280',
    border: 'none',
    padding: '8px',
    fontSize: '14px',
    cursor: 'pointer',
    position: 'absolute',
    right: '12px',
    top: '12px',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(2px)',
  },
  spotlight: {
    borderRadius: '8px',
  },
  beacon: {
    backgroundColor: '#3b82f6',
    border: '3px solid #60a5fa',
  },
};

export const ProductTour: React.FC<ProductTourProps> = ({
  steps,
  isOpen,
  onClose,
  onComplete,
  tourKey
}) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { status, type, action, index } = data;

    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
    } else if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setIsRunning(false);
      setStepIndex(0);
      
      // Mark tour as completed in localStorage
      localStorage.setItem(`tour-completed-${tourKey}`, 'true');
      
      onComplete?.();
      onClose();
    }
  }, [onClose, onComplete, tourKey]);

  const startTour = useCallback(() => {
    setIsRunning(true);
    setStepIndex(0);
  }, []);

  const stopTour = useCallback(() => {
    setIsRunning(false);
    setStepIndex(0);
    onClose();
  }, [onClose]);

  // Check if tour was already completed
  const wasTourCompleted = typeof window !== 'undefined' 
    ? localStorage.getItem(`tour-completed-${tourKey}`) === 'true'
    : false;

  React.useEffect(() => {
    if (isOpen && !wasTourCompleted) {
      startTour();
    }
  }, [isOpen, wasTourCompleted, startTour]);

  if (!isOpen || wasTourCompleted) {
    return null;
  }

  return (
    <>
      <Joyride
        steps={steps}
        run={isRunning}
        stepIndex={stepIndex}
        callback={handleJoyrideCallback}
        continuous={true}
        showProgress={true}
        showSkipButton={true}
        disableCloseOnEsc={false}
        disableOverlayClose={false}
        spotlightClicks={true}
        spotlightPadding={8}
        styles={tourStyles}
        locale={{
          back: 'Back',
          close: 'Close',
          last: 'Finish',
          next: 'Next',
          skip: 'Skip Tour',
        }}
        floaterProps={{
          disableAnimation: false,
        }}
      />
    </>
  );
};

// Reusable tour trigger component
interface TourTriggerProps {
  onStartTour: () => void;
  tourKey: string;
  className?: string;
  variant?: 'button' | 'icon' | 'text';
  size?: 'sm' | 'md' | 'lg';
}

export const TourTrigger: React.FC<TourTriggerProps> = ({
  onStartTour,
  tourKey,
  className = '',
  variant = 'button',
  size = 'sm'
}) => {
  const wasTourCompleted = typeof window !== 'undefined' 
    ? localStorage.getItem(`tour-completed-${tourKey}`) === 'true'
    : false;

  const handleStartTour = () => {
    // Reset completion status and start tour
    localStorage.removeItem(`tour-completed-${tourKey}`);
    onStartTour();
  };

  if (variant === 'icon') {
    return (
      <Button
        onClick={handleStartTour}
        variant="outline"
        size={size}
        className={`${className} bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 border-yellow-400 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 animate-pulse`}
        title={wasTourCompleted ? 'Restart Product Tour' : 'Start Product Tour'}
      >
        <Lightbulb className="h-4 w-4 mr-1" />
        {wasTourCompleted ? 'Restart Tour' : 'Tour'}
      </Button>
    );
  }

  if (variant === 'text') {
    return (
      <button
        onClick={handleStartTour}
        className={`text-blue-400 hover:text-blue-300 text-sm underline ${className}`}
      >
        {wasTourCompleted ? 'Restart Tour' : 'Take a Tour'}
      </button>
    );
  }

  return (
    <Button
      onClick={handleStartTour}
      variant="outline"
      size={size}
      className={`${className} bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 border-yellow-400 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200`}
    >
      <Lightbulb className="h-4 w-4 mr-2" />
      {wasTourCompleted ? 'Restart Tour' : 'Start Tour'}
    </Button>
  );
};

export default ProductTour;