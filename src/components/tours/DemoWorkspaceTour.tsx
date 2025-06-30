'use client';

import React from 'react';
import { Step } from 'react-joyride';
import { ProductTour } from './ProductTour';

interface DemoWorkspaceTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

// Define the tour steps for the demo workspace
const demoWorkspaceSteps: Step[] = [
  {
    target: 'body',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">
          🎉 Welcome to Hexies Demo!
        </h3>
        <p className="text-gray-300 mb-3">
          This interactive tour will guide you through the key features of the Hexies platform - 
          your toolkit for identifying and addressing workplace antipatterns.
        </p>
        <p className="text-blue-300 text-sm">
          Let's explore how to transform workplace challenges into actionable insights!
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="hexies-library"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">
          📚 Hexies Library
        </h3>
        <p className="text-gray-300 mb-3">
          This is your library of workplace antipatterns. Each hexie represents a common 
          workplace challenge with research-backed insights and intervention strategies.
        </p>
        <p className="text-blue-300 text-sm">
          <strong>Try this:</strong> Hover over any hexie to see quick action buttons for favoriting, 
          adding to workspace, or zooming in for details.
        </p>
      </div>
    ),
    placement: 'right',
  },
  {
    target: '[data-tour="search-input"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">
          🔍 Smart Search & Filtering
        </h3>
        <p className="text-gray-300 mb-3">
          Search hexies by title, content, or tags. Use the category and tag filters 
          below to narrow down to specific workplace domains.
        </p>
        <p className="text-blue-300 text-sm">
          <strong>Tip:</strong> Click the heart icon to filter by your favorites!
        </p>
      </div>
    ),
    placement: 'right',
  },
  {
    target: '[data-tour="workspace-canvas"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">
          🎨 Interactive Workspace
        </h3>
        <p className="text-gray-300 mb-3">
          This is your analysis canvas. Add hexies here by clicking them in the library 
          or dragging them directly onto the workspace.
        </p>
        <p className="text-blue-300 text-sm">
          <strong>Features:</strong> Right-click hexies for context menu, drag to reposition, 
          and use keyboard shortcuts for quick actions.
        </p>
      </div>
    ),
    placement: 'left',
  },
  {
    target: '[data-tour="workspace-mode-toggle"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">
          ⚡ Workspace Modes
        </h3>
        <p className="text-gray-300 mb-3">
          Toggle between <strong>Free Mode</strong> (flexible positioning) and 
          <strong>Hex Grid</strong> (structured pattern analysis).
        </p>
        <p className="text-blue-300 text-sm">
          Free mode is perfect for brainstorming, while hex grid helps visualize 
          relationships between patterns.
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="create-button"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">
          ✨ Create Custom Hexies
        </h3>
        <p className="text-gray-300 mb-3">
          Spotted a workplace pattern not in our library? Create your own custom hexie 
          with your organization's specific challenges and solutions.
        </p>
        <p className="text-blue-300 text-sm">
          Custom hexies include front/back text, categories, tags, and visual themes.
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="scenarios-button"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">
          📖 Workplace Scenarios
        </h3>
        <p className="text-gray-300 mb-3">
          Load pre-built workplace scenarios that automatically populate your workspace 
          with relevant antipatterns for focused analysis sessions.
        </p>
        <p className="text-blue-300 text-sm">
          Perfect for team workshops, training sessions, or analyzing specific situations.
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="hexie-stats"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">
          📊 Progress Tracking
        </h3>
        <p className="text-gray-300 mb-3">
          Monitor your workspace activity: hexies placed, favorites saved, and insights shared. 
          Premium users get advanced analytics and AI-powered pattern detection.
        </p>
        <p className="text-blue-300 text-sm">
          Your progress helps build competency in pattern recognition and intervention design.
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="upgrade-button"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">
          🚀 Unlock Full Power
        </h3>
        <p className="text-gray-300 mb-3">
          Ready to level up? Premium features include AI analysis, team collaboration, 
          unlimited hexies, advanced scenarios, and detailed reporting.
        </p>
        <p className="text-green-300 text-sm">
          <strong>You're currently in demo mode</strong> - upgrade to save your work and 
          collaborate with your team!
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: 'body',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">
          🎯 You're Ready to Go!
        </h3>
        <p className="text-gray-300 mb-3">
          You've completed the tour! Start by adding a few hexies to your workspace 
          and explore how they relate to your current workplace challenges.
        </p>
        <div className="bg-blue-500/20 p-3 rounded-lg mt-3">
          <p className="text-blue-300 text-sm">
            <strong>Quick Start Tips:</strong>
            <br />• Right-click hexies for actions menu
            <br />• Use Ctrl/Cmd+click for multi-selection
            <br />• Press Delete to remove selected hexies
            <br />• Hover near edges for auto-scroll
          </p>
        </div>
      </div>
    ),
    placement: 'center',
  },
];

export const DemoWorkspaceTour: React.FC<DemoWorkspaceTourProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  return (
    <ProductTour
      steps={demoWorkspaceSteps}
      isOpen={isOpen}
      onClose={onClose}
      onComplete={onComplete}
      tourKey="demo-workspace"
    />
  );
};

export default DemoWorkspaceTour;