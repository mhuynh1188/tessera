'use client';

import React, { useState, useCallback } from 'react';
import { Step } from 'react-joyride';
import { ProductTour, TourTrigger } from './ProductTour';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  Lightbulb, 
  Target, 
  Hexagon,
  Award,
  Users,
  BarChart3,
  Play
} from 'lucide-react';

interface UnifiedTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
  context: 'workspace' | 'analytics' | 'demo' | 'board';
}

// Combined tour steps that work across different contexts
const createUnifiedSteps = (context: string): Step[] => {
  const baseSteps: Step[] = [
    {
      target: 'body',
      content: (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">
            🚀 Welcome to Hexies Platform!
          </h3>
          <p className="text-gray-300 mb-3">
            This unified tour will guide you through all the key features of the Hexies platform, 
            from workspace management to behavior analytics.
          </p>
          <p className="text-blue-300 text-sm">
            Let's explore how hexagonal thinking can transform your workflow!
          </p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
  ];

  // Context-specific steps
  const workspaceSteps: Step[] = [
    {
      target: '[data-tour="user-level"], .text-xl.font-bold',
      content: (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">
            🎯 Workspace Overview
          </h3>
          <p className="text-gray-300 mb-3">
            This is your main workspace where you can explore hexies, create workspaces, 
            and access different features. The header shows your current subscription level 
            and available features.
          </p>
          <p className="text-purple-300 text-sm">
            Your subscription tier determines access to premium hexies and advanced features.
          </p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '[href="/workspace/board"], button:has(svg + text)',
      content: (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">
            🎨 Interactive Workspace
          </h3>
          <p className="text-gray-300 mb-3">
            Click "Create Workspace" to access the interactive canvas where you can 
            place hexies, create annotations, and analyze patterns. This is where 
            the real hexagonal thinking happens!
          </p>
          <p className="text-blue-300 text-sm">
            Pro tip: Start with a scenario to get guided context for your analysis.
          </p>
        </div>
      ),
      placement: 'bottom',
    },
  ];

  const analyticsSteps: Step[] = [
    {
      target: '[data-tour="analytics-header"], .text-2xl.font-bold, h1',
      content: (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">
            📊 Behavior Savior Analytics
          </h3>
          <p className="text-gray-300 mb-3">
            This is the analytics dashboard where you can explore workplace behavior 
            patterns with privacy-preserving insights. All data is anonymized and 
            aggregated to protect individual privacy.
          </p>
          <p className="text-purple-300 text-sm">
            Switch between stakeholder views to see role-specific insights.
          </p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '[data-tour="role-selector"], button:contains("HR"), .bg-blue-50',
      content: (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">
            👥 Stakeholder Perspectives
          </h3>
          <p className="text-gray-300 mb-3">
            Toggle between HR, Executive, and Management views to see different 
            perspectives on the same data. Each role gets tailored insights and 
            metrics relevant to their responsibilities.
          </p>
          <p className="text-green-300 text-sm">
            Each role focuses on different aspects: HR on culture, Executives on strategy, 
            Management on team dynamics.
          </p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '[data-tour="analytics-tabs"], .inline-flex.h-12',
      content: (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">
            📈 Visualization Options
          </h3>
          <p className="text-gray-300 mb-3">
            Explore different ways to visualize your data:
          </p>
          <ul className="text-gray-300 text-sm space-y-1 mb-3">
            <li><strong>Patterns:</strong> Interactive bubble charts</li>
            <li><strong>Timeline:</strong> Animated trend analysis</li>
            <li><strong>Heatmap:</strong> Organizational "city" view</li>
            <li><strong>Interventions:</strong> Track improvement initiatives</li>
            <li><strong>Export:</strong> Generate privacy-compliant reports</li>
          </ul>
        </div>
      ),
      placement: 'bottom',
    },
  ];

  const boardSteps: Step[] = [
    {
      target: '[data-tour="hexies-menu"], .w-80, .bg-gray-800\\/50',
      content: (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">
            🏆 Hexies Library
          </h3>
          <p className="text-gray-300 mb-3">
            Browse and select hexies from your library. Hexies are organized by 
            categories and show subscription requirements. Click on any hexie 
            to select it for placement.
          </p>
          <p className="text-blue-300 text-sm">
            Favorites, search, and quick actions help you find the right hexie quickly.
          </p>
        </div>
      ),
      placement: 'right',
    },
    {
      target: '[data-tour="gamified-canvas"], .flex-1',
      content: (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">
            🎨 Interactive Canvas
          </h3>
          <p className="text-gray-300 mb-3">
            This is your main workspace canvas. Place hexies by selecting them 
            from the library and clicking on the canvas. You can drag, rotate, 
            and annotate hexies to explore patterns and relationships.
          </p>
          <p className="text-purple-300 text-sm">
            Right-click hexies for advanced options like annotations and severity ratings.
          </p>
        </div>
      ),
      placement: 'left',
    },
    {
      target: '[data-tour="tab-navigation"], .flex.space-x-1',
      content: (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">
            🗂️ Workspace Features
          </h3>
          <p className="text-gray-300 mb-3">
            Navigate between different workspace features:
          </p>
          <ul className="text-gray-300 text-sm space-y-1 mb-3">
            <li><strong>Workspace:</strong> Main hexie canvas</li>
            <li><strong>Scenarios:</strong> Guided learning situations</li>
            <li><strong>Progress:</strong> Skills & achievements tracking</li>
            <li><strong>Safety:</strong> Psychological safety monitoring</li>
            <li><strong>Combinations:</strong> Pattern analysis tools</li>
          </ul>
        </div>
      ),
      placement: 'bottom',
    },
  ];

  const navigationSteps: Step[] = [
    {
      target: '[href="/analytics"], button:has(.lucide-brain)',
      content: (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">
            🧠 Analytics Dashboard
          </h3>
          <p className="text-gray-300 mb-3">
            Access the Behavior Savior analytics dashboard to explore workplace 
            behavior patterns, track interventions, and generate insights for 
            organizational improvement.
          </p>
          <p className="text-purple-300 text-sm">
            All analytics maintain strict privacy standards with k-anonymity protection.
          </p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '[href="/workspace/board"], button:has(.lucide-plus)',
      content: (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">
            🎯 Create Workspace
          </h3>
          <p className="text-gray-300 mb-3">
            Create new interactive workspaces for hexie analysis. Each workspace 
            can be customized with different scenarios, team members, and focus areas.
          </p>
          <p className="text-green-300 text-sm">
            Workspaces support real-time collaboration and progress tracking.
          </p>
        </div>
      ),
      placement: 'bottom',
    },
  ];

  const completionStep: Step[] = [
    {
      target: 'body',
      content: (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">
            🎉 Tour Complete!
          </h3>
          <p className="text-gray-300 mb-3">
            You've completed the unified platform tour! You now know how to:
          </p>
          <ul className="text-gray-300 text-sm space-y-1 mb-4">
            <li>• Navigate between workspace and analytics</li>
            <li>• Create and manage interactive workspaces</li>
            <li>• Use hexies for pattern analysis</li>
            <li>• Access behavior analytics and insights</li>
            <li>• Switch between stakeholder perspectives</li>
          </ul>
          <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 p-3 rounded-lg">
            <p className="text-blue-300 text-sm">
              <strong>Next Steps:</strong> Start with a scenario, place some hexies, 
              and explore the analytics to see how hexagonal thinking can transform 
              your approach to workplace challenges!
            </p>
          </div>
        </div>
      ),
      placement: 'center',
    },
  ];

  // Combine steps based on context
  let steps = [...baseSteps];
  
  switch (context) {
    case 'workspace':
      steps = [...steps, ...workspaceSteps, ...navigationSteps, ...completionStep];
      break;
    case 'analytics':
      steps = [...steps, ...analyticsSteps, ...navigationSteps, ...completionStep];
      break;
    case 'board':
      steps = [...steps, ...boardSteps, ...navigationSteps, ...completionStep];
      break;
    case 'demo':
      steps = [...steps, ...workspaceSteps, ...boardSteps, ...analyticsSteps, ...completionStep];
      break;
    default:
      steps = [...steps, ...workspaceSteps, ...analyticsSteps, ...completionStep];
  }

  return steps;
};

export const UnifiedTour: React.FC<UnifiedTourProps> = ({
  isOpen,
  onClose,
  onComplete,
  context
}) => {
  const steps = createUnifiedSteps(context);
  
  return (
    <ProductTour
      steps={steps}
      isOpen={isOpen}
      onClose={onClose}
      onComplete={onComplete}
      tourKey={`unified-tour-${context}`}
    />
  );
};

// Enhanced unified tour trigger that works across contexts
interface UnifiedTourTriggerProps {
  onStartTour: () => void;
  context: 'workspace' | 'analytics' | 'demo' | 'board';
  className?: string;
  variant?: 'button' | 'icon' | 'text';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export const UnifiedTourTrigger: React.FC<UnifiedTourTriggerProps> = ({
  onStartTour,
  context,
  className = '',
  variant = 'button',
  size = 'sm',
  label
}) => {
  const tourKey = `unified-tour-${context}`;
  const wasTourCompleted = typeof window !== 'undefined' 
    ? localStorage.getItem(`tour-completed-${tourKey}`) === 'true'
    : false;

  const handleStartTour = () => {
    // Reset completion status and start tour
    localStorage.removeItem(`tour-completed-${tourKey}`);
    onStartTour();
  };

  const getContextIcon = () => {
    switch (context) {
      case 'analytics':
        return <Brain className="h-4 w-4 mr-2" />;
      case 'workspace':
        return <Hexagon className="h-4 w-4 mr-2" />;
      case 'board':
        return <Target className="h-4 w-4 mr-2" />;
      case 'demo':
        return <Play className="h-4 w-4 mr-2" />;
      default:
        return <Lightbulb className="h-4 w-4 mr-2" />;
    }
  };

  const getContextLabel = () => {
    if (label) return label;
    
    switch (context) {
      case 'analytics':
        return wasTourCompleted ? 'Restart Analytics Tour' : 'Analytics Tour';
      case 'workspace':
        return wasTourCompleted ? 'Restart Workspace Tour' : 'Workspace Tour';
      case 'board':
        return wasTourCompleted ? 'Restart Board Tour' : 'Board Tour';
      case 'demo':
        return wasTourCompleted ? 'Restart Demo Tour' : 'Demo Tour';
      default:
        return wasTourCompleted ? 'Restart Tour' : 'Start Tour';
    }
  };

  if (variant === 'icon') {
    return (
      <Button
        onClick={handleStartTour}
        variant="outline"
        size={size}
        className={`${className} bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 border-yellow-400 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 animate-pulse`}
        title={getContextLabel()}
      >
        {getContextIcon()}
        {wasTourCompleted ? 'Restart' : 'Tour'}
      </Button>
    );
  }

  if (variant === 'text') {
    return (
      <button
        onClick={handleStartTour}
        className={`text-blue-400 hover:text-blue-300 text-sm underline ${className}`}
      >
        {getContextLabel()}
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
      {getContextIcon()}
      {getContextLabel()}
    </Button>
  );
};

export default UnifiedTour;