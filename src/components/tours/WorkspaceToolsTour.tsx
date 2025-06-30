'use client';

import React from 'react';
import { Step } from 'react-joyride';
import { ProductTour } from './ProductTour';

interface WorkspaceToolsTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

// Define the tour steps for workspace tools
const workspaceToolsSteps: Step[] = [
  {
    target: 'body',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">
          🛠️ Workspace Tools Tour
        </h3>
        <p className="text-gray-300 mb-3">
          Learn how to use the powerful workspace tools to organize, analyze, and interact with your hexies.
        </p>
        <p className="text-blue-300 text-sm">
          This tour covers layers, filtering, drawing tools, and workspace controls.
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="workspace-toolbar"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">
          🎯 Workspace Toolbar
        </h3>
        <p className="text-gray-300 mb-3">
          Your command center for workspace navigation and visualization. All essential tools are located here for easy access.
        </p>
        <p className="text-blue-300 text-sm">
          Let's explore each tool individually...
        </p>
      </div>
    ),
    placement: 'left',
  },
  {
    target: '[data-tour="zoom-in-button"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">
          🔍 Zoom Controls
        </h3>
        <p className="text-gray-300 mb-3">
          Use the zoom controls to get closer to details or see the bigger picture. Click + to zoom in and - to zoom out.
        </p>
        <p className="text-blue-300 text-sm">
          <strong>Pro tip:</strong> You can also use your mouse wheel to zoom smoothly!
        </p>
      </div>
    ),
    placement: 'left',
  },
  {
    target: '[data-tour="reset-view-button"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">
          🎯 Reset View
        </h3>
        <p className="text-gray-300 mb-3">
          Click the target icon to reset your view to the default zoom and position. Perfect for finding your way back when you're lost in a large workspace.
        </p>
        <p className="text-blue-300 text-sm">
          Great for presentations or when sharing your screen with others.
        </p>
      </div>
    ),
    placement: 'left',
  },
  {
    target: '[data-tour="layers-templates-button"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">
          📐 Templates & Layers
        </h3>
        <p className="text-gray-300 mb-3">
          Access workspace templates and background layers. Choose from organizational charts, process flows, or custom backgrounds to organize your hexies contextually.
        </p>
        <p className="text-blue-300 text-sm">
          Templates help structure your analysis - try the "Estuarine Map" for ecosystem thinking!
        </p>
      </div>
    ),
    placement: 'left',
  },
  {
    target: '[data-tour="severity-filter-button"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">
          🔍 Severity Filter
        </h3>
        <p className="text-gray-300 mb-3">
          Filter hexies by their antipattern severity rating. Focus on high-impact issues or gradually work through different severity levels.
        </p>
        <p className="text-blue-300 text-sm">
          <strong>Options:</strong> All, Unrated, Low (1-2), Medium (2-3.5), High (3.5+)
        </p>
      </div>
    ),
    placement: 'left',
  },
  {
    target: '[data-tour="drawing-tools-button"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">
          ✏️ Drawing Tools
        </h3>
        <p className="text-gray-300 mb-3">
          Create connections, annotations, and visual relationships between hexies. Draw arrows, lines, and shapes to map relationships and dependencies.
        </p>
        <p className="text-blue-300 text-sm">
          Perfect for showing cause-and-effect relationships between different antipatterns.
        </p>
      </div>
    ),
    placement: 'left',
  },
  {
    target: '[data-tour="zoom-indicator"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">
          📊 Zoom Indicator
        </h3>
        <p className="text-gray-300 mb-3">
          Keep track of your current zoom level. This shows the percentage scale of your workspace view.
        </p>
        <p className="text-blue-300 text-sm">
          Helpful for maintaining consistent zoom levels across sessions or team presentations.
        </p>
      </div>
    ),
    placement: 'left',
  },
  {
    target: '[data-tour="keyboard-shortcuts"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">
          ⌨️ Keyboard Shortcuts
        </h3>
        <p className="text-gray-300 mb-3">
          Speed up your workflow with keyboard shortcuts:
        </p>
        <ul className="text-sm text-gray-300 mb-3 space-y-1">
          <li>• <strong>Delete:</strong> Remove selected hexies</li>
          <li>• <strong>Esc:</strong> Clear selection</li>
          <li>• <strong>Ctrl+Click:</strong> Multi-select hexies</li>
          <li>• <strong>Space+Drag:</strong> Pan around workspace</li>
        </ul>
        <p className="text-blue-300 text-sm">
          Master these shortcuts to work efficiently with large hexie collections!
        </p>
      </div>
    ),
    placement: 'left',
  },
  {
    target: '[data-tour="search-input"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">
          🔍 Smart Search
        </h3>
        <p className="text-gray-300 mb-3">
          Quickly find specific hexies by title, content, or tags. The search works across all hexie data to help you locate exactly what you need.
        </p>
        <p className="text-blue-300 text-sm">
          <strong>Try searching for:</strong> "communication", "trust", or "meeting" to see it in action!
        </p>
      </div>
    ),
    placement: 'right',
  },
  {
    target: 'body',
    content: (
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">
          🎉 Workspace Mastery Complete!
        </h3>
        <p className="text-gray-300 mb-3">
          You now know how to use all the essential workspace tools. These features work together to help you:
        </p>
        <ul className="text-sm text-gray-300 mb-3 space-y-1">
          <li>• Navigate and organize large collections of hexies</li>
          <li>• Filter and focus on specific severity levels</li>
          <li>• Create visual connections and annotations</li>
          <li>• Use templates for structured analysis</li>
          <li>• Work efficiently with keyboard shortcuts</li>
        </ul>
        <p className="text-blue-300 text-sm">
          Ready to transform workplace challenges into actionable insights!
        </p>
      </div>
    ),
    placement: 'center',
  },
];

export const WorkspaceToolsTour: React.FC<WorkspaceToolsTourProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  return (
    <ProductTour
      steps={workspaceToolsSteps}
      isOpen={isOpen}
      onClose={onClose}
      onComplete={onComplete}
      tourKey="workspace-tools"
    />
  );
};

export default WorkspaceToolsTour;