import React, { useState } from 'react';
import { HexieContextMenu } from './HexieContextMenu';
import { ResizableWorkspaceTemplate } from './ResizableWorkspaceTemplate';
import EstuarineMapTemplate from './templates/EstuarineMapTemplate';

// Example component showing how to use the enhanced features
export const EnhancedWorkspaceExample: React.FC = () => {
  const [contextMenu, setContextMenu] = useState<{
    isVisible: boolean;
    hexieId: string | null;
    hexieInstanceId: string | null;
    tesseraCardId: string | null;
    position: { x: number; y: number };
  }>({
    isVisible: false,
    hexieId: null,
    hexieInstanceId: null,
    tesseraCardId: null,
    position: { x: 0, y: 0 }
  });

  const [templateDimensions, setTemplateDimensions] = useState({
    width: 1200,
    height: 800
  });

  const [hexieSize, setHexieSize] = useState(60);

  // Mock user data - replace with actual user context
  const currentUserId = 'user-123'; // Get from your auth context
  const userTier = 'premium' as const;

  // Mock hexie data - replace with actual data
  const sampleHexie = {
    id: 'hexie-456',
    instanceId: 'instance-789',
    tesseraCardId: 'tessera-012',
    title: 'The Micromanager',
    referenceCount: 3,
    annotationCount: 5,
    severityScore: 3.5
  };

  const handleHexieRightClick = (event: React.MouseEvent, hexie: typeof sampleHexie) => {
    event.preventDefault();
    setContextMenu({
      isVisible: true,
      hexieId: hexie.id,
      hexieInstanceId: hexie.instanceId,
      tesseraCardId: hexie.tesseraCardId,
      position: { x: event.clientX, y: event.clientY }
    });
  };

  const closeContextMenu = () => {
    setContextMenu(prev => ({ ...prev, isVisible: false }));
  };

  const handleTemplateResize = (width: number, height: number) => {
    setTemplateDimensions({ width, height });
    console.log(`Template resized to: ${width}x${height}`);
  };

  const handleHexieSizeChange = (size: number) => {
    setHexieSize(size);
    console.log(`Hexie size changed to: ${size}px`);
  };

  return (
    <div className="w-full h-screen bg-gray-100 p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-2">Enhanced Workspace Features</h1>
        <div className="text-sm text-gray-600 space-y-1">
          <div>✅ <strong>Voting:</strong> Click tessera cards to vote up/down (remembers your vote)</div>
          <div>✅ <strong>Bookmarking:</strong> Right-click and bookmark cards (saves to database)</div>
          <div>✅ <strong>Resizable Template:</strong> Drag corners to resize, hexies stay uniform</div>
          <div className="text-xs mt-2">Current hexie size: {hexieSize}px | Template: {templateDimensions.width}×{templateDimensions.height}</div>
        </div>
      </div>

      {/* Resizable workspace template */}
      <ResizableWorkspaceTemplate
        initialWidth={templateDimensions.width}
        initialHeight={templateDimensions.height}
        onResize={handleTemplateResize}
        hexieSize={hexieSize}
        onHexieSizeChange={handleHexieSizeChange}
        className="shadow-lg"
      >
        <EstuarineMapTemplate 
          width={templateDimensions.width} 
          height={templateDimensions.height}
        />
        
        {/* Sample tessera card positioned on the template */}
        <div
          className="absolute cursor-pointer transition-transform hover:scale-105"
          style={{
            left: '300px',
            top: '200px',
            width: `${hexieSize}px`,
            height: `${hexieSize}px`,
          }}
          onContextMenu={(e) => handleHexieRightClick(e, sampleHexie)}
          title="Right-click for options"
        >
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg flex items-center justify-center text-white text-xs font-bold p-1 text-center">
            {sampleHexie.title}
          </div>
        </div>

        {/* Add more sample tessera cards here */}
        <div
          className="absolute cursor-pointer transition-transform hover:scale-105"
          style={{
            left: '500px',
            top: '400px',
            width: `${hexieSize}px`,
            height: `${hexieSize}px`,
          }}
          onContextMenu={(e) => handleHexieRightClick(e, {
            ...sampleHexie,
            id: 'hexie-999',
            instanceId: 'instance-888',
            tesseraCardId: 'tessera-777',
            title: 'The Credit Stealer'
          })}
          title="Right-click for options"
        >
          <div className="w-full h-full bg-gradient-to-br from-red-500 to-pink-600 rounded-lg shadow-lg flex items-center justify-center text-white text-xs font-bold p-1 text-center">
            The Credit Stealer
          </div>
        </div>
      </ResizableWorkspaceTemplate>

      {/* Enhanced context menu with voting and bookmarking */}
      {contextMenu.hexieId && (
        <HexieContextMenu
          hexieId={contextMenu.hexieId}
          hexieInstanceId={contextMenu.hexieInstanceId!}
          tesseraCardId={contextMenu.tesseraCardId!}
          title={sampleHexie.title}
          isVisible={contextMenu.isVisible}
          position={contextMenu.position}
          referenceCount={sampleHexie.referenceCount}
          annotationCount={sampleHexie.annotationCount}
          severityScore={sampleHexie.severityScore}
          userTier={userTier}
          userId={currentUserId}
          onClose={closeContextMenu}
          onAnnotate={() => console.log('Add annotation')}
          onViewReferences={() => console.log('View references')}
          onRateSeverity={() => console.log('Rate severity')}
          onShare={() => console.log('Share hexie')}
          onEdit={() => console.log('Edit hexie')}
          onContest={() => console.log('Contest card')}
        />
      )}
    </div>
  );
};