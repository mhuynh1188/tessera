'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  HexGrid, 
  Layout, 
  Hexagon, 
  GridGenerator, 
  HexUtils, 
  Path,
  Pattern,
  Text as HexText
} from 'react-hexgrid';
import { HexagonShape } from '@/components/HexagonShape';
import { HexieCard } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  Star, 
  Plus, 
  RotateCcw,
  X,
  Settings,
  Save,
  Share2,
  Layers
} from 'lucide-react';
import toast from 'react-hot-toast';
import { HexieContextMenu } from './HexieContextMenu';

interface HexieInstance {
  id: string;
  hexie_card_id: string;
  q: number; // HexGrid coordinate
  r: number; // HexGrid coordinate
  s: number; // HexGrid coordinate
  is_flipped: boolean;
  z_index: number;
  annotations: any[];
  antipattern_severity?: number;
  card_data: HexieCard;
}

interface WorkspaceBoard {
  id: string;
  name: string;
  description: string;
  session_id?: string;
  game_settings: {
    difficulty_level: 'beginner' | 'intermediate' | 'advanced';
    safety_level: 'high' | 'medium' | 'low';
    intervention_mode: 'individual' | 'collaborative' | 'guided';
    progress_tracking: boolean;
    anonymous_mode: boolean;
  };
  access_level: 'free' | 'basic' | 'premium';
  max_hexies: number;
  max_annotations: number;
}

interface UserCompetency {
  primary_role: 'explorer' | 'analyst' | 'facilitator' | 'architect' | 'mentor';
  competency_scores: {
    pattern_recognition: number;
    emotional_intelligence: number;
    systems_thinking: number;
    intervention_design: number;
    psychological_safety: number;
    group_facilitation: number;
  };
  total_experience: number;
  current_level: number;
  badges_earned: string[];
}

interface HexGridWorkspaceProps {
  board: WorkspaceBoard;
  userCompetency: UserCompetency;
  onHexieAdd: (hexie: HexieCard, gridPosition?: { q: number; r: number; s: number }) => void;
  onHexieUpdate: (hexie: HexieInstance) => void;
  onAnnotationAdd: (hexieId: string, annotation: any) => void;
  onSafetyAlert: (alert: any) => void;
  hideHeader?: boolean;
  hexieInstances: HexieInstance[];
  selectedHexieInstances: string[];
  onHexieSelect: (hexieId: string, isMultiSelect?: boolean) => void;
  onHexieDelete: (hexieId: string) => void;
  draggedHexie?: HexieCard | null;
  onDragEnd?: () => void;
}

export const HexGridWorkspace: React.FC<HexGridWorkspaceProps> = ({
  board,
  userCompetency,
  onHexieAdd,
  onHexieUpdate,
  onAnnotationAdd,
  onSafetyAlert,
  hideHeader = false,
  hexieInstances,
  selectedHexieInstances,
  onHexieSelect,
  onHexieDelete,
  draggedHexie,
  onDragEnd
}) => {
  const [hoveredHex, setHoveredHex] = useState<any>(null);
  const [selectedHex, setSelectedHex] = useState<any>(null);
  const [flippedHexies, setFlippedHexies] = useState<Set<string>>(new Set());
  const [gridSize, setGridSize] = useState({ width: 20, height: 15 });
  const [dragTarget, setDragTarget] = useState<any>(null);
  const [workspaceZoom, setWorkspaceZoom] = useState(1);
  const [workspacePan, setWorkspacePan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    hexieId: string;
  }>({ isOpen: false, position: { x: 0, y: 0 }, hexieId: '' });
  const svgRef = useRef<SVGSVGElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);

  // Generate base hex grid - this creates the background template
  const hexagons = GridGenerator.hexagon(gridSize.width);
  
  // Layout configuration for the hex grid
  const layout = new Layout({ 
    width: 20, 
    height: 20, 
    flat: false, // pointy-top hexagons
    spacing: 1.05 // spacing between hexagons
  });

  // Handle window resize to adjust grid size
  useEffect(() => {
    const handleResize = () => {
      const container = svgRef.current?.parentElement;
      if (container) {
        const width = Math.floor(container.clientWidth / 45); // Adjust based on hex size
        const height = Math.floor(container.clientHeight / 45);
        setGridSize({ width: Math.max(10, width), height: Math.max(8, height) });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle drag over event (legacy - for non-hexgrid drags)
  const handleLegacyDragOver = useCallback((event: React.DragEvent, hex: any) => {
    event.preventDefault();
    setDragTarget(hex);
  }, []);

  // Handle drop event using react-hexgrid's built-in system
  const handleDrop = useCallback((event: any, source: any, targetProps: any) => {
    const hexieData = targetProps as HexieCard;
    
    if (hexieData) {
      // Check if position is already occupied
      const isOccupied = hexieInstances.some(instance => 
        instance.q === source.state.hex.q && 
        instance.r === source.state.hex.r && 
        instance.s === source.state.hex.s
      );

      if (isOccupied) {
        toast.error('Position already occupied');
        return;
      }

      // Call the onHexieAdd with grid position
      onHexieAdd(hexieData, { 
        q: source.state.hex.q, 
        r: source.state.hex.r, 
        s: source.state.hex.s 
      });
      toast.success(`${hexieData.title} added to grid!`);
    }
  }, [hexieInstances, onHexieAdd]);

  // Handle drag over to allow drop
  const handleDragOver = useCallback((event: any, source: any) => {
    // Check if position is already occupied
    const isOccupied = hexieInstances.some(instance => 
      instance.q === source.state.hex.q && 
      instance.r === source.state.hex.r && 
      instance.s === source.state.hex.s
    );

    // Allow drop if position is not occupied
    if (!isOccupied) {
      event.preventDefault();
    }
  }, [hexieInstances]);

  // Handle hexie flip
  const handleFlipHexie = useCallback((hexieId: string) => {
    setFlippedHexies(prev => {
      const newFlipped = new Set(prev);
      if (newFlipped.has(hexieId)) {
        newFlipped.delete(hexieId);
      } else {
        newFlipped.add(hexieId);
      }
      return newFlipped;
    });
  }, []);

  // Handle hexie selection
  const handleHexieClick = useCallback((hexieId: string, event: React.MouseEvent) => {
    const isMultiSelect = event.ctrlKey || event.metaKey;
    onHexieSelect(hexieId, isMultiSelect);
  }, [onHexieSelect]);

  // Handle hexie deletion
  const handleDeleteHexie = useCallback((hexieId: string) => {
    onHexieDelete(hexieId);
    setFlippedHexies(prev => {
      const newFlipped = new Set(prev);
      newFlipped.delete(hexieId);
      return newFlipped;
    });
  }, [onHexieDelete]);

  // Get hexie instance at specific grid position
  const getHexieAtPosition = useCallback((q: number, r: number, s: number) => {
    return hexieInstances.find(instance => 
      instance.q === q && instance.r === r && instance.s === s
    );
  }, [hexieInstances]);

  // Pan and zoom handlers
  const handleWorkspaceZoomIn = () => {
    setWorkspaceZoom(prev => Math.min(prev * 1.2, 3));
  };

  const handleWorkspaceZoomOut = () => {
    setWorkspaceZoom(prev => Math.max(prev / 1.2, 0.3));
  };

  const handleWorkspaceResetView = () => {
    setWorkspaceZoom(1);
    setWorkspacePan({ x: 0, y: 0 });
  };

  const handleWorkspaceWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setWorkspaceZoom(prev => Math.min(Math.max(prev * delta, 0.3), 3));
  }, []);

  // Add wheel event listener with passive: false to enable preventDefault
  useEffect(() => {
    const workspaceElement = workspaceRef.current;
    if (workspaceElement) {
      workspaceElement.addEventListener('wheel', handleWorkspaceWheel, { passive: false });
      return () => {
        workspaceElement.removeEventListener('wheel', handleWorkspaceWheel);
      };
    }
  }, [handleWorkspaceWheel]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) { // Middle mouse or Ctrl+Left
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const deltaX = e.clientX - lastPanPoint.x;
      const deltaY = e.clientY - lastPanPoint.y;
      setWorkspacePan(prev => ({
        x: prev.x + deltaX / workspaceZoom,
        y: prev.y + deltaY / workspaceZoom
      }));
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  return (
    <div className="h-full w-full bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 overflow-hidden">
      {!hideHeader && (
        <div className="flex items-center justify-between p-4 bg-black/20 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold text-white">Hex Grid Workspace</h2>
            <Badge variant="outline" className="text-blue-300">
              {board.name}
            </Badge>
            <Badge variant="secondary" className="text-gray-300">
              Level {userCompetency.current_level}
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            {/* Workspace Zoom Controls */}
            <div className="flex items-center space-x-1 border border-gray-600 rounded px-2 py-1">
              <Button
                onClick={handleWorkspaceZoomOut}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white p-1 h-6 w-6"
                title="Zoom out"
              >
                -
              </Button>
              <span className="text-xs text-gray-400 min-w-[3rem] text-center">
                {Math.round(workspaceZoom * 100)}%
              </span>
              <Button
                onClick={handleWorkspaceZoomIn}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white p-1 h-6 w-6"
                title="Zoom in"
              >
                +
              </Button>
              <Button
                onClick={handleWorkspaceResetView}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white p-1 h-6 w-6"
                title="Reset view"
              >
                ⌂
              </Button>
            </div>
            
            <Button variant="outline" size="sm" className="text-gray-300">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" size="sm" className="text-gray-300">
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button variant="outline" size="sm" className="text-gray-300">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      )}

      <div className="h-full w-full relative overflow-hidden">
        <div 
          ref={workspaceRef}
          className="w-full h-full"
          onDragOver={(e) => e.preventDefault()}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
        >
          <HexGrid 
            width="100%" 
            height="100%" 
            viewBox={`${-50 / workspaceZoom + workspacePan.x} ${-50 / workspaceZoom + workspacePan.y} ${100 / workspaceZoom} ${100 / workspaceZoom}`}
          >
            <Layout 
              size={{ x: 2 * workspaceZoom, y: 2 * workspaceZoom }} 
              flat={false} 
              spacing={1.1} 
              origin={{ x: workspacePan.x, y: workspacePan.y }}
            >
              {/* Background hex grid pattern */}
              {hexagons.map((hex, i) => {
                const hexieInstance = getHexieAtPosition(hex.q, hex.r, hex.s);
                const isHovered = hoveredHex && HexUtils.equals(hoveredHex, hex);
                const isSelected = selectedHex && HexUtils.equals(selectedHex, hex);
                const isDragTarget = dragTarget && HexUtils.equals(dragTarget, hex);
                
                return (
                  <g key={i}>
                    {/* Background hexagon */}
                    <Hexagon
                      q={hex.q}
                      r={hex.r}
                      s={hex.s}
                      fill={
                        hexieInstance ? 'transparent' : // Don't show background if hexie is present
                        isDragTarget ? 'rgba(59, 130, 246, 0.3)' :
                        isHovered ? 'rgba(255, 255, 255, 0.1)' :
                        'rgba(255, 255, 255, 0.05)'
                      }
                      cellStyle={{
                        stroke: isDragTarget ? '#3b82f6' :
                                isHovered ? 'rgba(255, 255, 255, 0.3)' :
                                'rgba(255, 255, 255, 0.1)',
                        strokeWidth: isDragTarget ? 2 : 1,
                        cursor: 'copy',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={() => setHoveredHex(hex)}
                      onMouseLeave={() => setHoveredHex(null)}
                      onClick={() => setSelectedHex(hex)}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                    />
                    
                    {/* Grid coordinates (for development/debugging) */}
                    {!hexieInstance && isHovered && (
                      <HexText 
                        q={hex.q} 
                        r={hex.r} 
                        s={hex.s}
                        className="hex-text"
                      >
                        {`${hex.q},${hex.r}`}
                      </HexText>
                    )}
                  </g>
                );
              })}

              {/* Hexie instances on the grid using proper positioning */}
              {hexieInstances.map((instance) => {
                const isSelected = selectedHexieInstances.includes(instance.id);
                const isFlipped = flippedHexies.has(instance.id);

                return (
                  <g key={instance.id}>
                    {/* Larger hexie content using foreignObject */}
                    <foreignObject
                      x={-50}
                      y={-50}
                      width={100}
                      height={100}
                      style={{ pointerEvents: 'auto' }}
                    >
                      <div className="w-full h-full flex items-center justify-center">
                        <HexagonShape
                          size={90}
                          color={instance.card_data.color_scheme?.primary || '#3b82f6'}
                          borderColor={instance.card_data.color_scheme?.secondary || '#1e40af'}
                          title={instance.card_data.title}
                          frontText={instance.card_data.front_text}
                          backText={instance.card_data.back_text}
                          references={instance.card_data.references || []}
                          isFlipped={isFlipped}
                          onFlip={() => handleFlipHexie(instance.id)}
                          showFlipButton={isSelected}
                          showDelete={isSelected}
                          onDelete={() => handleDeleteHexie(instance.id)}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleHexieClick(instance.id, e);
                          }}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setContextMenu({
                              isOpen: true,
                              position: { x: e.clientX, y: e.clientY },
                              hexieId: instance.id
                            });
                          }}
                          className={`${isSelected ? 'ring-2 ring-blue-400' : ''} transition-all duration-200`}
                        />
                      </div>
                    </foreignObject>
                  </g>
                );
              })}

              {/* Patterns for styling */}
              <defs>
                <Pattern id="hexiePattern" size={{ x: 10, y: 10 }} fill="rgba(59, 130, 246, 0.1)" />
              </defs>
            </Layout>
          </HexGrid>
        </div>

        {/* Floating action panel */}
        <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-xl rounded-lg p-3 border border-white/20">
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-gray-300">
              {hexieInstances.length}/{board.max_hexies} hexies
            </Badge>
            {selectedHexieInstances.length > 0 && (
              <Badge variant="secondary" className="text-blue-300">
                {selectedHexieInstances.length} selected
              </Badge>
            )}
          </div>
        </div>

        {/* Instructions overlay */}
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-xl rounded-lg p-3 border border-white/20 max-w-sm">
          <h3 className="text-sm font-semibold text-white mb-2">How to use:</h3>
          <ul className="text-xs text-gray-300 space-y-1">
            <li>• Drag hexies from the library to the grid</li>
            <li>• Click hexies to select/deselect them</li>
            <li>• Right-click for context menu options</li>
            <li>• Scroll wheel or +/- to zoom</li>
            <li>• Ctrl+drag or middle mouse to pan</li>
          </ul>
        </div>

        {/* Context Menu */}
        {contextMenu.isOpen && (() => {
          const contextHexie = hexieInstances.find(h => h.id === contextMenu.hexieId);
          if (!contextHexie) return null;

          const isFlipped = flippedHexies.has(contextHexie.id);
          // TODO: Get favorites from parent component
          const isFavorite = false; // This should come from props
          const hasReferences = contextHexie.card_data.references && contextHexie.card_data.references.length > 0;

          return (
            <HexieContextMenu
              isOpen={contextMenu.isOpen}
              position={contextMenu.position}
              hexieId={contextHexie.id}
              hexieTitle={contextHexie.card_data.title}
              isFlipped={isFlipped}
              isFavorite={isFavorite}
              hasReferences={hasReferences}
              onClose={() => setContextMenu(prev => ({ ...prev, isOpen: false }))}
              onFlip={() => handleFlipHexie(contextHexie.id)}
              onToggleFavorite={() => {
                // TODO: Implement favorite toggle
                toast.success('Favorites feature needs to be connected to parent');
              }}
              onDelete={() => handleDeleteHexie(contextHexie.id)}
              onSetSeverity={(severity) => {
                // TODO: Implement severity setting
                toast.success(`Severity set to ${severity}/5 for ${contextHexie.card_data.title}`);
              }}
              onAddAnnotation={() => {
                // TODO: Implement annotation system
                toast.success('Annotation system needs to be implemented');
              }}
              onViewReferences={() => {
                // TODO: Implement reference viewer
                toast.success('Reference viewer needs to be implemented');
              }}
            />
          );
        })()}
      </div>
    </div>
  );
};

export default HexGridWorkspace;