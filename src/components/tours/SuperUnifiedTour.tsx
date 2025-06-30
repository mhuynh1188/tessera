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
  Play,
  Settings,
  Crown,
  ExternalLink
} from 'lucide-react';

interface SuperUnifiedTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
  context: 'workspace' | 'analytics' | 'demo' | 'board' | 'admin';
}

// Complete tour that covers BOTH applications
const createSuperUnifiedSteps = (context: string): Step[] => {
  const introSteps: Step[] = [
    {
      target: 'body',
      content: (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">
            🚀 Complete Hexies Platform Tour!
          </h3>
          <p className="text-gray-300 mb-3">
            Welcome to the comprehensive tour that covers both the main Hexies platform 
            AND the admin dashboard. This tour will show you how to use hexies for 
            workplace pattern analysis AND how to manage the platform.
          </p>
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-3 rounded-lg mt-3">
            <p className="text-blue-300 text-sm">
              <strong>What You'll Learn:</strong>
              <br />• Using hexies for workplace analysis
              <br />• Creating and managing workspaces  
              <br />• Behavior analytics and insights
              <br />• Admin dashboard for content management
              <br />• Complete platform workflow
            </p>
          </div>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
  ];

  // User-facing platform steps
  const platformSteps: Step[] = [
    {
      target: '[data-tour="user-level"], .text-xl.font-bold, h1',
      content: (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">
            🎯 Main Platform Overview
          </h3>
          <p className="text-gray-300 mb-3">
            This is the main Hexies platform where users explore workplace patterns, 
            create interactive workspaces, and gain insights from behavior analytics.
          </p>
          <p className="text-purple-300 text-sm">
            Your subscription tier determines access to premium features and advanced hexies.
          </p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '[href="/workspace/board"], button:has(svg + text), [href="/analytics"]',
      content: (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">
            🎨 Core Platform Features
          </h3>
          <p className="text-gray-300 mb-3">
            The main platform provides three key areas:
          </p>
          <ul className="text-gray-300 text-sm space-y-1 mb-3">
            <li><strong>🎯 Interactive Workspaces:</strong> Place and analyze hexies</li>
            <li><strong>🧠 Behavior Analytics:</strong> Privacy-preserving insights</li>
            <li><strong>📚 Scenario Library:</strong> Guided learning situations</li>
          </ul>
          <p className="text-blue-300 text-sm">
            Let's explore each area and then see how content is managed behind the scenes!
          </p>
        </div>
      ),
      placement: 'bottom',
    },
  ];

  // Analytics-specific steps  
  const analyticsSteps: Step[] = [
    {
      target: '[data-tour="analytics-header"], .text-2xl.font-bold, h1',
      content: (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">
            📊 Behavior Savior Analytics
          </h3>
          <p className="text-gray-300 mb-3">
            This analytics dashboard transforms workplace hexie interactions into 
            actionable insights while maintaining strict privacy protection.
          </p>
          <p className="text-purple-300 text-sm">
            All data is anonymized and aggregated to protect individual privacy 
            while revealing organizational patterns.
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
            👥 Stakeholder-Specific Views
          </h3>
          <p className="text-gray-300 mb-3">
            Switch between HR, Executive, and Management perspectives to see 
            role-specific insights and metrics.
          </p>
          <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 p-3 rounded-lg mt-3">
            <p className="text-green-300 text-sm">
              <strong>Privacy by Design:</strong> Each role sees only the insights 
              relevant to their responsibilities, with built-in k-anonymity protection.
            </p>
          </div>
        </div>
      ),
      placement: 'bottom',
    },
  ];

  // Workspace-specific steps
  const workspaceSteps: Step[] = [
    {
      target: '[data-tour="hexies-menu"], .w-80, .bg-gray-800\\/50',
      content: (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">
            🏆 Hexies Library
          </h3>
          <p className="text-gray-300 mb-3">
            Browse workplace antipatterns organized by category. Each hexie represents 
            a common workplace dysfunction with research-backed intervention strategies.
          </p>
          <p className="text-blue-300 text-sm">
            Premium hexies unlock advanced patterns and evidence-based interventions.
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
            🎨 Interactive Analysis Canvas
          </h3>
          <p className="text-gray-300 mb-3">
            Place hexies to explore workplace patterns, create annotations for insights, 
            and use tessellation to discover hidden connections between issues.
          </p>
          <p className="text-purple-300 text-sm">
            The geometric approach helps reveal systemic patterns that linear thinking misses.
          </p>
        </div>
      ),
      placement: 'left',
    },
  ];

  // Admin transition steps
  const adminTransitionSteps: Step[] = [
    {
      target: 'body',
      content: (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">
            🔄 Platform Management Overview
          </h3>
          <p className="text-gray-300 mb-3">
            Now that you understand the user experience, let's explore how content 
            is created and managed behind the scenes using the admin dashboard.
          </p>
          <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 p-3 rounded-lg mt-3">
            <p className="text-orange-300 text-sm">
              <strong>Next:</strong> We'll explore the admin dashboard where hexies are created, 
              users are managed, and platform analytics are monitored.
            </p>
          </div>
          <div className="mt-4 p-3 bg-blue-500/20 rounded-lg">
            <p className="text-blue-300 text-sm">
              💡 <strong>Pro Tip:</strong> You can access the admin dashboard at any time 
              by opening a new tab to localhost:3002 (hexies-admin)
            </p>
          </div>
        </div>
      ),
      placement: 'center',
    },
    {
      target: 'body',
      content: (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">
            🛠️ Admin Dashboard Preview
          </h3>
          <p className="text-gray-300 mb-3">
            The admin dashboard (hexies-admin) provides powerful tools for:
          </p>
          <ul className="text-gray-300 text-sm space-y-1 mb-4">
            <li>📚 <strong>Creating hexie cards</strong> with research references</li>
            <li>👥 <strong>Managing users</strong> and subscription tiers</li>
            <li>🏷️ <strong>Organizing categories</strong> and content structure</li>
            <li>📊 <strong>Monitoring analytics</strong> and platform performance</li>
            <li>🔧 <strong>System diagnostics</strong> and troubleshooting</li>
          </ul>
          <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 p-3 rounded-lg">
            <p className="text-yellow-300 text-sm">
              <strong>Admin Access Required:</strong> Admin features require special permissions 
              and are typically used by content creators and platform administrators.
            </p>
          </div>
        </div>
      ),
      placement: 'center',
    },
  ];

  // Completion steps
  const completionSteps: Step[] = [
    {
      target: 'body',
      content: (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">
            🎉 Complete Platform Tour Finished!
          </h3>
          <p className="text-gray-300 mb-3">
            You've now seen the complete Hexies ecosystem! You understand:
          </p>
          <ul className="text-gray-300 text-sm space-y-1 mb-4">
            <li>✅ How users interact with hexies for workplace analysis</li>
            <li>✅ How behavior analytics provide organizational insights</li>
            <li>✅ How interactive workspaces enable pattern discovery</li>
            <li>✅ How content is created and managed via admin tools</li>
            <li>✅ The complete workflow from creation to analysis</li>
          </ul>
          <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 p-3 rounded-lg mt-3">
            <p className="text-green-300 text-sm">
              <strong>Ready to Start:</strong> Begin with a scenario, place relevant hexies, 
              analyze patterns, and use insights to design effective interventions!
            </p>
          </div>
          <div className="mt-3 p-3 bg-purple-500/20 rounded-lg">
            <p className="text-purple-300 text-sm">
              🚀 <strong>Power User Tip:</strong> Bookmark both localhost:3000 (main platform) 
              and localhost:3002 (admin) for quick access to all features!
            </p>
          </div>
        </div>
      ),
      placement: 'center',
    },
  ];

  // Combine steps based on context
  let steps = [...introSteps];
  
  switch (context) {
    case 'workspace':
      steps = [...steps, ...platformSteps, ...workspaceSteps, ...adminTransitionSteps, ...completionSteps];
      break;
    case 'analytics':
      steps = [...steps, ...analyticsSteps, ...platformSteps, ...adminTransitionSteps, ...completionSteps];
      break;
    case 'board':
      steps = [...steps, ...workspaceSteps, ...analyticsSteps, ...adminTransitionSteps, ...completionSteps];
      break;
    case 'admin':
      // If starting from admin, focus on admin features then show user experience
      steps = [...steps, ...adminTransitionSteps, ...platformSteps, ...completionSteps];
      break;
    default:
      steps = [...steps, ...platformSteps, ...analyticsSteps, ...workspaceSteps, ...adminTransitionSteps, ...completionSteps];
  }

  return steps;
};

export const SuperUnifiedTour: React.FC<SuperUnifiedTourProps> = ({
  isOpen,
  onClose,
  onComplete,
  context
}) => {
  const steps = createSuperUnifiedSteps(context);
  
  return (
    <ProductTour
      steps={steps}
      isOpen={isOpen}
      onClose={onClose}
      onComplete={onComplete}
      tourKey={`super-unified-tour-${context}`}
    />
  );
};

// Enhanced tour trigger for the super unified experience
interface SuperUnifiedTourTriggerProps {
  onStartTour: () => void;
  context: 'workspace' | 'analytics' | 'demo' | 'board' | 'admin';
  className?: string;
  variant?: 'button' | 'icon' | 'text';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export const SuperUnifiedTourTrigger: React.FC<SuperUnifiedTourTriggerProps> = ({
  onStartTour,
  context,
  className = '',
  variant = 'button',
  size = 'sm',
  label
}) => {
  const tourKey = `super-unified-tour-${context}`;
  const wasTourCompleted = typeof window !== 'undefined' 
    ? localStorage.getItem(`tour-completed-${tourKey}`) === 'true'
    : false;

  const handleStartTour = () => {
    // Reset completion status and start tour
    localStorage.removeItem(`tour-completed-${tourKey}`);
    onStartTour();
  };

  const getContextIcon = () => {
    return <Crown className="h-4 w-4 mr-2" />;
  };

  const getContextLabel = () => {
    if (label) return label;
    return wasTourCompleted ? 'Restart Complete Tour' : 'Complete Platform Tour';
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
        {wasTourCompleted ? 'Restart Complete' : 'Complete Tour'}
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

export default SuperUnifiedTour;