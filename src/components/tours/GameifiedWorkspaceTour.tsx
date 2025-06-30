'use client';

import React from 'react';
import { Step } from 'react-joyride';
import { ProductTour } from './ProductTour';

interface GameifiedWorkspaceTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

// Define the tour steps for the gamified workspace
const gamifiedWorkspaceSteps: Step[] = [
  {
    target: 'body',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">
          🎮 Welcome to Gamified Workspace!
        </h3>
        <p className="text-gray-300 mb-3">
          You're now in the advanced gamified workspace with role-based challenges, 
          competency tracking, and collaborative features.
        </p>
        <p className="text-blue-300 text-sm">
          Let's explore the enhanced features that help you level up your workplace intervention skills!
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="user-level"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">
          ⭐ Your Level & Role
        </h3>
        <p className="text-gray-300 mb-3">
          Track your progress as you develop competencies in pattern recognition, 
          emotional intelligence, and intervention design. Your role determines 
          available challenges and learning paths.
        </p>
        <p className="text-purple-300 text-sm">
          <strong>Roles:</strong> Explorer → Analyst → Facilitator → Architect → Mentor
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="tab-navigation"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">
          🗂️ Workspace Tabs
        </h3>
        <p className="text-gray-300 mb-3">
          Navigate between different aspects of your learning journey:
        </p>
        <ul className="text-gray-300 text-sm space-y-1 mb-3">
          <li><strong>Workspace:</strong> Interactive hexie canvas</li>
          <li><strong>Scenarios:</strong> Guided learning situations</li>
          <li><strong>Progress:</strong> Skills & achievements</li>
          <li><strong>Safety:</strong> Psychological safety monitoring</li>
          <li><strong>Combinations:</strong> Pattern relationship analysis</li>
        </ul>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="hexies-menu"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">
          🏆 Enhanced Hexies Library
        </h3>
        <p className="text-gray-300 mb-3">
          Your hexie library now shows subscription tiers, favorite indicators, 
          and quick action buttons. Hover over hexies for instant access to 
          favorite, workspace, and zoom actions.
        </p>
        <p className="text-blue-300 text-sm">
          Premium hexies unlock advanced patterns and intervention strategies.
        </p>
      </div>
    ),
    placement: 'right',
  },
  {
    target: '[data-tour="workspace-header"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">
          🎯 Smart Workspace Header
        </h3>
        <p className="text-gray-300 mb-3">
          Monitor your hexie usage limits, active scenarios, and collaboration status. 
          Premium users see real-time collaboration indicators and AI analysis options.
        </p>
        <p className="text-green-300 text-sm">
          The analytics bar shows pattern density, risk scores, and collaboration metrics.
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="gamified-canvas"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">
          🎨 Gamified Canvas
        </h3>
        <p className="text-gray-300 mb-3">
          This enhanced canvas tracks interaction patterns, provides contextual hints, 
          and offers competency-based feedback as you work with hexies.
        </p>
        <p className="text-blue-300 text-sm">
          <strong>Pro Tips:</strong> Right-click for advanced options, use annotation system 
          for insights, and watch for safety alerts during intense sessions.
        </p>
      </div>
    ),
    placement: 'left',
  },
  {
    target: '[data-tour="ai-analysis-button"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">
          🧠 AI-Powered Analysis
        </h3>
        <p className="text-gray-300 mb-3">
          Basic and Premium users can trigger AI analysis to identify pattern clusters, 
          intervention opportunities, and relationship insights between hexies.
        </p>
        <p className="text-purple-300 text-sm">
          AI learns from your workspace arrangements to suggest optimal interventions.
        </p>
      </div>
    ),
    placement: 'bottom',
    styles: {
      tooltip: {
        backgroundColor: '#1f2937',
      }
    }
  },
  {
    target: '[data-tour="scenarios-tab"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">
          📚 Scenario-Based Learning
        </h3>
        <p className="text-gray-300 mb-3">
          Load workplace scenarios that provide context-specific challenges. 
          Scenarios automatically populate relevant hexies and guide your analysis.
        </p>
        <p className="text-orange-300 text-sm">
          Perfect for team training, case studies, and skill development exercises.
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="progress-tab"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">
          📈 Progress & Achievements
        </h3>
        <p className="text-gray-300 mb-3">
          Track your competency development across six key areas. Complete challenges 
          to earn badges and unlock new capabilities.
        </p>
        <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-3 rounded-lg mt-3">
          <p className="text-sm text-gray-300">
            <strong>Competency Areas:</strong>
            <br />• Pattern Recognition • Emotional Intelligence
            <br />• Systems Thinking • Intervention Design
            <br />• Psychological Safety • Group Facilitation
          </p>
        </div>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="safety-tab"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">
          🛡️ Psychological Safety Monitoring
        </h3>
        <p className="text-gray-300 mb-3">
          Real-time monitoring of psychological safety indicators during collaborative 
          sessions. Get alerts when stress patterns emerge and access support resources.
        </p>
        <p className="text-green-300 text-sm">
          Essential for maintaining healthy team dynamics during intensive analysis sessions.
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="ai-insights-sidebar"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">
          🔮 AI Insights (Premium)
        </h3>
        <p className="text-gray-300 mb-3">
          Premium users see real-time AI insights including pattern clusters, 
          intervention opportunities, and psychological safety assessments.
        </p>
        <p className="text-yellow-300 text-sm">
          AI continuously analyzes your workspace to suggest evidence-based interventions.
        </p>
      </div>
    ),
    placement: 'left',
  },
  {
    target: 'body',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">
          🚀 Ready for Advanced Practice!
        </h3>
        <p className="text-gray-300 mb-3">
          You're now equipped to use the full gamified workspace. Start with a scenario, 
          add relevant hexies, and use the AI insights to develop intervention strategies.
        </p>
        <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 p-3 rounded-lg mt-3">
          <p className="text-blue-300 text-sm">
            <strong>Advanced Features:</strong>
            <br />• Team collaboration & real-time sync
            <br />• Custom challenge creation
            <br />• Advanced pattern analysis
            <br />• Export capabilities for reports
            <br />• Integration with learning management systems
          </p>
        </div>
      </div>
    ),
    placement: 'center',
  },
];

export const GameifiedWorkspaceTour: React.FC<GameifiedWorkspaceTourProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  return (
    <ProductTour
      steps={gamifiedWorkspaceSteps}
      isOpen={isOpen}
      onClose={onClose}
      onComplete={onComplete}
      tourKey="gamified-workspace"
    />
  );
};

export default GameifiedWorkspaceTour;