'use client';

import React from 'react';
import { TourProvider, useTour } from '@reactour/tour';

const analyticsSteps = [
  {
    selector: '[data-tour="analytics-header"]',
    content: (
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">Welcome to Behavior Savior Analytics!</h3>
        <p className="text-sm text-gray-600">
          This dashboard provides privacy-preserving insights into workplace behavior patterns 
          to help improve organizational culture.
        </p>
      </div>
    ),
    position: 'bottom' as const,
  },
  {
    selector: '[data-tour="role-selector"]',
    content: (
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">Stakeholder Perspectives</h3>
        <p className="text-sm text-gray-600">
          Switch between HR, Executive, and Management views to see role-specific insights 
          and metrics tailored to your needs.
        </p>
      </div>
    ),
    position: 'bottom' as const,
  },
  {
    selector: '[data-tour="focus-areas"]',
    content: (
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">Interactive Focus Areas</h3>
        <p className="text-sm text-gray-600">
          Click these buttons to learn more about each stakeholder's key focus areas 
          and how the analytics support their objectives.
        </p>
      </div>
    ),
    position: 'bottom' as const,
  },
  {
    selector: '[data-tour="key-metrics"]',
    content: (
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">Key Performance Metrics</h3>
        <p className="text-sm text-gray-600">
          Monitor confidentiality levels, actionable insights, stakeholder engagement, 
          and culture improvement trends at a glance.
        </p>
      </div>
    ),
    position: 'top' as const,
  },
  {
    selector: '[data-tour="analytics-tabs"]',
    content: (
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">Analytics Visualization Tabs</h3>
        <p className="text-sm text-gray-600">
          Explore different views of your data:
          <br />• <strong>Behavior Patterns</strong>: Interactive bubble charts
          <br />• <strong>Timeline</strong>: Animated trend analysis
          <br />• <strong>Heatmap</strong>: Organizational "city" view
          <br />• <strong>Interventions</strong>: Track improvement initiatives
          <br />• <strong>Export</strong>: Generate privacy-compliant reports
        </p>
      </div>
    ),
    position: 'bottom' as const,
  },
  {
    selector: '[data-tour="bubble-chart"]',
    content: (
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">Interactive Bubble Chart</h3>
        <p className="text-sm text-gray-600">
          Each bubble represents a behavior pattern. Size indicates impact, 
          position shows severity vs frequency, and colors represent categories. 
          Hover for details and click to select patterns.
        </p>
      </div>
    ),
    position: 'top' as const,
  },
  {
    selector: '[data-tour="time-filter"]',
    content: (
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">Time Range Filters</h3>
        <p className="text-sm text-gray-600">
          Adjust the time window to analyze patterns over different periods. 
          This affects all visualizations and helps identify trends.
        </p>
      </div>
    ),
    position: 'bottom' as const,
  },
  {
    selector: '[data-tour="interventions-tab"]',
    content: (
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">Intervention Tracking</h3>
        <p className="text-sm text-gray-600">
          Create, track, and measure the effectiveness of workplace interventions. 
          Monitor progress from planning to completion with detailed metrics.
        </p>
      </div>
    ),
    position: 'bottom' as const,
  },
  {
    selector: '[data-tour="export-functionality"]',
    content: (
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">Privacy-Compliant Export</h3>
        <p className="text-sm text-gray-600">
          Generate reports in multiple formats (CSV, PDF, PNG) while maintaining 
          strict privacy standards. All exports are role-based and anonymized.
        </p>
      </div>
    ),
    position: 'top' as const,
  },
  {
    selector: '[data-tour="analytics-complete"]',
    content: (
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">🎉 Analytics Tour Complete!</h3>
        <p className="text-sm text-gray-600">
          You're now ready to explore workplace behavior insights. Remember:
          <br />• All data is privacy-preserving
          <br />• Insights are role-specific
          <br />• Interventions can be tracked end-to-end
          <br />• Reports maintain confidentiality
        </p>
      </div>
    ),
    position: 'center' as const,
  },
];

interface AnalyticsTourContentProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

const AnalyticsTourContent: React.FC<AnalyticsTourContentProps> = ({ 
  isOpen, 
  onClose, 
  onComplete 
}) => {
  const { setCurrentStep, currentStep, setIsOpen } = useTour();

  React.useEffect(() => {
    setIsOpen(isOpen);
  }, [isOpen, setIsOpen]);

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  const handleComplete = () => {
    setIsOpen(false);
    onComplete?.();
    onClose();
  };

  // Auto-advance on last step
  React.useEffect(() => {
    if (currentStep === analyticsSteps.length - 1) {
      const timer = setTimeout(() => {
        handleComplete();
      }, 5000); // Auto-close after 5 seconds on final step
      
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  return null;
};

interface AnalyticsTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export const AnalyticsTour: React.FC<AnalyticsTourProps> = ({ 
  isOpen, 
  onClose, 
  onComplete 
}) => {
  return (
    <TourProvider
      steps={analyticsSteps}
      isOpen={isOpen}
      onRequestClose={onClose}
      styles={{
        popover: (base) => ({
          ...base,
          '--reactour-accent': '#3b82f6',
          borderRadius: 12,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: '1px solid #e5e7eb',
          backgroundColor: 'white',
        }),
        maskArea: (base) => ({ 
          ...base, 
          rx: 8 
        }),
        badge: (base) => ({
          ...base,
          left: 'auto',
          right: '8px',
          backgroundColor: '#3b82f6',
          color: 'white',
          fontSize: '12px',
          fontWeight: '600',
        }),
        controls: (base) => ({
          ...base,
          marginTop: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }),
        button: (base) => ({
          ...base,
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '8px 16px',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }),
        navigation: (base) => ({
          ...base,
          display: 'flex',
          gap: '8px',
        }),
      }}
      badgeContent={(_, index) => `${index + 1}/${analyticsSteps.length}`}
      prevButton={({ currentStep, setCurrentStep }) => (
        <button
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          style={{
            backgroundColor: currentStep === 0 ? '#9ca3af' : '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '14px',
            cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          Previous
        </button>
      )}
      nextButton={({ currentStep, stepsLength, setCurrentStep, setIsOpen }) => (
        <button
          onClick={() => {
            if (currentStep === stepsLength - 1) {
              setIsOpen(false);
              onComplete?.();
              onClose();
            } else {
              setCurrentStep(currentStep + 1);
            }
          }}
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          {currentStep === stepsLength - 1 ? 'Finish' : 'Next'}
        </button>
      )}
      showCloseButton={true}
      showNavigation={true}
      showPrevNextButtons={true}
      showBadge={true}
    >
      <AnalyticsTourContent 
        isOpen={isOpen} 
        onClose={onClose} 
        onComplete={onComplete}
      />
    </TourProvider>
  );
};

export default AnalyticsTour;