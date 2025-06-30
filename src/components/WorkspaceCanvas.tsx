'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Workspace, User, HexieInstance, Position } from '@/types';
import { Hexagon } from 'lucide-react';

interface WorkspaceCanvasProps {
  workspace: Workspace | null;
  user: User | null;
  mode: 'select' | 'pan' | 'hexie';
  selectedHexies: string[];
  onSelectionChange: (selected: string[]) => void;
}

interface CanvasHexie extends HexieInstance {
  isDragging?: boolean;
  dragOffset?: Position;
}

export default function WorkspaceCanvas({
  workspace,
  user,
  mode,
  selectedHexies,
  onSelectionChange
}: WorkspaceCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [hexieInstances, setHexieInstances] = useState<CanvasHexie[]>([]);
  const [viewTransform, setViewTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState<Position>({ x: 0, y: 0 });
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    hexieId: string | null;
    startPos: Position;
    offset: Position;
  }>({
    isDragging: false,
    hexieId: null,
    startPos: { x: 0, y: 0 },
    offset: { x: 0, y: 0 }
  });

  // Load hexie instances for the workspace
  useEffect(() => {
    if (workspace) {
      loadHexieInstances();
    }
  }, [workspace]);

  const loadHexieInstances = async () => {
    if (!workspace) return;
    
    try {
      const { db } = await import('@/lib/supabase');
      const instances = await db.getHexieInstances(workspace.id);
      setHexieInstances(instances.map(instance => ({
        ...instance,
        isDragging: false
      })));
    } catch (error) {
      console.error('Failed to load hexie instances:', error);
    }
  };

  // Convert screen coordinates to canvas coordinates
  const screenToCanvas = useCallback((screenPos: Position): Position => {
    const canvas = canvasRef.current;
    if (!canvas) return screenPos;

    const rect = canvas.getBoundingClientRect();
    return {
      x: (screenPos.x - rect.left - viewTransform.x) / viewTransform.scale,
      y: (screenPos.y - rect.top - viewTransform.y) / viewTransform.scale
    };
  }, [viewTransform]);

  // Convert canvas coordinates to screen coordinates
  const canvasToScreen = useCallback((canvasPos: Position): Position => {
    return {
      x: canvasPos.x * viewTransform.scale + viewTransform.x,
      y: canvasPos.y * viewTransform.scale + viewTransform.y
    };
  }, [viewTransform]);

  // Snap position to grid if enabled
  const snapToGrid = useCallback((pos: Position): Position => {
    if (!workspace?.settings.snap_to_grid) return pos;
    
    const gridSize = workspace.settings.grid_size;
    return {
      x: Math.round(pos.x / gridSize) * gridSize,
      y: Math.round(pos.y / gridSize) * gridSize
    };
  }, [workspace]);

  // Handle mouse down events
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const canvasPos = screenToCanvas({ x: e.clientX, y: e.clientY });
    
    if (mode === 'pan') {
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      return;
    }

    if (mode === 'select') {
      // Check if clicking on a hexie
      const clickedHexie = hexieInstances.find(hexie => {
        const distance = Math.sqrt(
          Math.pow(hexie.position.x - canvasPos.x, 2) + 
          Math.pow(hexie.position.y - canvasPos.y, 2)
        );
        return distance < 50; // Hexie click radius
      });

      if (clickedHexie) {
        // Start dragging
        setDragState({
          isDragging: true,
          hexieId: clickedHexie.id,
          startPos: canvasPos,
          offset: {
            x: canvasPos.x - clickedHexie.position.x,
            y: canvasPos.y - clickedHexie.position.y
          }
        });

        // Update selection
        if (e.ctrlKey || e.metaKey) {
          // Toggle selection
          if (selectedHexies.includes(clickedHexie.id)) {
            onSelectionChange(selectedHexies.filter(id => id !== clickedHexie.id));
          } else {
            onSelectionChange([...selectedHexies, clickedHexie.id]);
          }
        } else {
          // Single selection
          onSelectionChange([clickedHexie.id]);
        }
      } else {
        // Clear selection if clicking empty space
        if (!e.ctrlKey && !e.metaKey) {
          onSelectionChange([]);
        }
      }
    }
  }, [mode, hexieInstances, selectedHexies, onSelectionChange, screenToCanvas]);

  // Handle mouse move events
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      const deltaX = e.clientX - lastPanPoint.x;
      const deltaY = e.clientY - lastPanPoint.y;
      
      setViewTransform(prev => ({
        ...prev,
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      return;
    }

    if (dragState.isDragging && dragState.hexieId) {
      const canvasPos = screenToCanvas({ x: e.clientX, y: e.clientY });
      const newPos = snapToGrid({
        x: canvasPos.x - dragState.offset.x,
        y: canvasPos.y - dragState.offset.y
      });

      setHexieInstances(prev => prev.map(hexie => 
        hexie.id === dragState.hexieId 
          ? { ...hexie, position: newPos, isDragging: true }
          : hexie
      ));
    }
  }, [isPanning, lastPanPoint, dragState, screenToCanvas, snapToGrid]);

  // Handle mouse up events
  const handleMouseUp = useCallback(async () => {
    if (isPanning) {
      setIsPanning(false);
    }

    if (dragState.isDragging && dragState.hexieId) {
      // Save the new position to database
      try {
        const { db } = await import('@/lib/supabase');
        const hexie = hexieInstances.find(h => h.id === dragState.hexieId);
        if (hexie) {
          await db.updateHexieInstance(hexie.id, {
            position: hexie.position
          });
        }
      } catch (error) {
        console.error('Failed to update hexie position:', error);
      }

      // Clear drag state
      setDragState({
        isDragging: false,
        hexieId: null,
        startPos: { x: 0, y: 0 },
        offset: { x: 0, y: 0 }
      });

      setHexieInstances(prev => prev.map(hexie => ({ 
        ...hexie, 
        isDragging: false 
      })));
    }
  }, [isPanning, dragState, hexieInstances]);

  // Handle wheel events for zooming
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(5, viewTransform.scale * scaleFactor));
    
    // Zoom towards mouse position
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      setViewTransform(prev => ({
        x: mouseX - (mouseX - prev.x) * (newScale / prev.scale),
        y: mouseY - (mouseY - prev.y) * (newScale / prev.scale),
        scale: newScale
      }));
    }
  }, [viewTransform]);

  // Render grid
  const renderGrid = () => {
    if (!workspace?.settings.snap_to_grid) return null;

    const gridSize = workspace.settings.grid_size * viewTransform.scale;
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const startX = (-viewTransform.x % gridSize);
    const startY = (-viewTransform.y % gridSize);
    
    const lines = [];
    
    // Vertical lines
    for (let x = startX; x < rect.width; x += gridSize) {
      lines.push(
        <line
          key={`v-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={rect.height}
          stroke="currentColor"
          strokeWidth={0.5}
          opacity={0.1}
        />
      );
    }
    
    // Horizontal lines
    for (let y = startY; y < rect.height; y += gridSize) {
      lines.push(
        <line
          key={`h-${y}`}
          x1={0}
          y1={y}
          x2={rect.width}
          y2={y}
          stroke="currentColor"
          strokeWidth={0.5}
          opacity={0.1}
        />
      );
    }

    return (
      <svg className="absolute inset-0 pointer-events-none text-muted-foreground">
        {lines}
      </svg>
    );
  };

  // Render hexie instances
  const renderHexies = () => {
    return hexieInstances.map(hexie => {
      const screenPos = canvasToScreen(hexie.position);
      const isSelected = selectedHexies.includes(hexie.id);
      const size = 60 * viewTransform.scale;
      
      return (
        <div
          key={hexie.id}
          className={`absolute cursor-pointer transition-all duration-200 ${
            isSelected ? 'ring-2 ring-primary ring-offset-2' : ''
          } ${hexie.isDragging ? 'opacity-80' : 'hover:scale-110'}`}
          style={{
            left: screenPos.x - size / 2,
            top: screenPos.y - size / 2,
            width: size,
            height: size,
            transform: `rotate(${hexie.rotation}deg) scale(${hexie.scale})`,
            zIndex: hexie.z_index + (isSelected ? 1000 : 0)
          }}
        >
          <div className="hexagon w-full h-full text-primary">
            <div className="hexagon-inner flex items-center justify-center">
              <span className="text-xs font-bold text-white text-center">
                {hexie.hexie_card_id.slice(0, 3)}
              </span>
            </div>
          </div>
        </div>
      );
    });
  };

  return (
    <div 
      ref={canvasRef}
      className="relative w-full h-full overflow-hidden bg-background cursor-crosshair"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      style={{
        cursor: mode === 'pan' ? 'grab' : mode === 'select' ? 'default' : 'crosshair'
      }}
    >
      {/* Grid */}
      {renderGrid()}

      {/* Hexie Instances */}
      {renderHexies()}

      {/* Empty State */}
      {hexieInstances.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Hexagon className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2 text-muted-foreground">
              Your workspace is empty
            </h3>
            <p className="text-sm text-muted-foreground">
              Drag hexies from the library to start tessellating
            </p>
          </div>
        </div>
      )}

      {/* Instructions overlay */}
      {mode === 'hexie' && (
        <div className="absolute top-4 left-4 bg-background/90 backdrop-blur rounded-lg p-3 border">
          <p className="text-sm font-medium mb-1">Add Hexie Mode</p>
          <p className="text-xs text-muted-foreground">
            Click anywhere to place a hexie from the library
          </p>
        </div>
      )}
    </div>
  );
}