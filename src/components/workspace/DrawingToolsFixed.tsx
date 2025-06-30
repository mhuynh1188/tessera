'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Pen, 
  Type, 
  Eraser, 
  RotateCcw,
  Eye,
  EyeOff,
  X,
  ArrowUpRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

interface DrawingElement {
  id: string;
  type: 'pen' | 'text' | 'arrow';
  path?: { x: number; y: number }[];
  text?: string;
  position?: { x: number; y: number };
  endPosition?: { x: number; y: number }; // For arrows
  color: string;
  size: number;
  timestamp: number;
  isDragging?: boolean;
}

interface DrawingToolsProps {
  canvasRef: React.RefObject<HTMLDivElement>;
  canvasTransform: { scale: number; translateX: number; translateY: number };
  isDrawingMode: boolean;
  onDrawingModeChange: (enabled: boolean) => void;
  showDrawingToolsPanel: boolean;
  onDrawingToolsPanelChange: (show: boolean) => void;
}

export const DrawingTools: React.FC<DrawingToolsProps> = ({
  canvasRef,
  canvasTransform,
  isDrawingMode,
  onDrawingModeChange,
  showDrawingToolsPanel,
  onDrawingToolsPanelChange
}) => {
  const [currentTool, setCurrentTool] = useState<'pen' | 'text' | 'eraser' | 'arrow'>('pen');
  const [currentColor, setCurrentColor] = useState('#ff6b6b');
  const [brushSize, setBrushSize] = useState(3);
  const [showDrawing, setShowDrawing] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [elements, setElements] = useState<DrawingElement[]>([]);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
  const [textValue, setTextValue] = useState('');
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isCreatingArrow, setIsCreatingArrow] = useState(false);
  const [arrowStart, setArrowStart] = useState<{ x: number; y: number } | null>(null);
  
  const drawingOverlayRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  // Common colors for quick selection
  const quickColors = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', 
    '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd'
  ];

  // Convert screen coordinates to drawing space coordinates
  const getDrawingCoordinates = useCallback((clientX: number, clientY: number) => {
    if (!drawingOverlayRef.current) return { x: 0, y: 0 };
    
    const rect = drawingOverlayRef.current.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }, []);

  // Get coordinates from touch or mouse event
  const getEventCoordinates = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if ('touches' in e && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: (e as React.MouseEvent).clientX, y: (e as React.MouseEvent).clientY };
  }, []);

  // Find element at coordinates
  const findElementAt = useCallback((coords: { x: number; y: number }) => {
    return elements.find(element => {
      if (element.type === 'text' && element.position) {
        return (
          Math.abs(element.position.x - coords.x) < 60 && 
          Math.abs(element.position.y - coords.y) < 30
        );
      }
      if (element.type === 'pen' && element.path) {
        return element.path.some(p => 
          Math.abs(p.x - coords.x) < 15 && Math.abs(p.y - coords.y) < 15
        );
      }
      if (element.type === 'arrow' && element.position && element.endPosition) {
        // Check if click is near arrow line
        const lineDistance = distanceToLine(
          coords, element.position, element.endPosition
        );
        return lineDistance < 10;
      }
      return false;
    });
  }, [elements]);

  // Calculate distance from point to line
  const distanceToLine = (point: { x: number; y: number }, start: { x: number; y: number }, end: { x: number; y: number }) => {
    const A = point.x - start.x;
    const B = point.y - start.y;
    const C = end.x - start.x;
    const D = end.y - start.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) return Math.sqrt(A * A + B * B);
    
    const param = dot / lenSq;
    
    let xx, yy;
    if (param < 0) {
      xx = start.x;
      yy = start.y;
    } else if (param > 1) {
      xx = end.x;
      yy = end.y;
    } else {
      xx = start.x + param * C;
      yy = start.y + param * D;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Unified touch/mouse handler
  const handlePointerStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawingMode) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const eventCoords = getEventCoordinates(e);
    const coords = getDrawingCoordinates(eventCoords.x, eventCoords.y);
    const clickedElement = findElementAt(coords);
    
    // If clicking on an existing element, select it for dragging
    if (clickedElement && currentTool !== 'eraser') {
      setSelectedElement(clickedElement.id);
      if (clickedElement.position) {
        setDragOffset({
          x: coords.x - clickedElement.position.x,
          y: coords.y - clickedElement.position.y
        });
      }
      setElements(prev => prev.map(el => 
        el.id === clickedElement.id ? { ...el, isDragging: true } : el
      ));
      return;
    }
    
    if (currentTool === 'text') {
      setTextPosition(coords);
      setShowTextInput(true);
      setTextValue('');
      setTimeout(() => textInputRef.current?.focus(), 100);
      return;
    }
    
    if (currentTool === 'arrow') {
      if (!isCreatingArrow) {
        // Start creating arrow
        setIsCreatingArrow(true);
        setArrowStart(coords);
        toast.success('Click where you want the arrow to point');
      } else {
        // Finish creating arrow
        if (arrowStart) {
          const newArrow: DrawingElement = {
            id: `arrow_${Date.now()}`,
            type: 'arrow',
            position: arrowStart,
            endPosition: coords,
            color: currentColor,
            size: brushSize,
            timestamp: Date.now()
          };
          setElements(prev => [...prev, newArrow]);
          toast.success('Arrow created');
        }
        setIsCreatingArrow(false);
        setArrowStart(null);
      }
      return;
    }
    
    if (currentTool === 'eraser') {
      // Find and remove elements near click position
      setElements(prev => prev.filter(element => {
        if (element.type === 'pen' && element.path) {
          return !element.path.some(p => 
            Math.abs(p.x - coords.x) < 20 && Math.abs(p.y - coords.y) < 20
          );
        }
        if (element.type === 'text' && element.position) {
          return !(
            Math.abs(element.position.x - coords.x) < 60 && 
            Math.abs(element.position.y - coords.y) < 30
          );
        }
        if (element.type === 'arrow' && element.position && element.endPosition) {
          const lineDistance = distanceToLine(coords, element.position, element.endPosition);
          return lineDistance >= 10;
        }
        return true;
      }));
      toast.success('Element erased');
      return;
    }
    
    if (currentTool === 'pen') {
      setIsDrawing(true);
      setCurrentPath([coords]);
    }
  }, [isDrawingMode, currentTool, getDrawingCoordinates, getEventCoordinates, findElementAt, isCreatingArrow, arrowStart, currentColor, brushSize, distanceToLine]);

  // Mouse down handler (calls unified handler)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    handlePointerStart(e);
  }, [handlePointerStart]);

  // Touch start handler (calls unified handler)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    handlePointerStart(e);
  }, [handlePointerStart]);

  // Unified touch/mouse move handler
  // Dynamic cursor management based on tool and context
  const [currentCursor, setCurrentCursor] = useState('default');
  
  // Get cursor for current tool
  const getToolCursor = useCallback(() => {
    switch (currentTool) {
      case 'pen': return 'crosshair';
      case 'eraser': return 'url("data:image/svg+xml,%3Csvg width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Ccircle cx=\'12\' cy=\'12\' r=\'10\' stroke=\'%23ff6666\' stroke-width=\'2\' fill=\'none\'/%3E%3Cpath d=\'m9 9 6 6\' stroke=\'%23ff6666\' stroke-width=\'2\' stroke-linecap=\'round\'/%3E%3Cpath d=\'m15 9 -6 6\' stroke=\'%23ff6666\' stroke-width=\'2\' stroke-linecap=\'round\'/%3E%3C/svg%3E") 12 12, auto';
      case 'text': return 'text';
      case 'arrow': return 'url("data:image/svg+xml,%3Csvg width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'m7 7 10 10\' stroke=\'%234494f6\' stroke-width=\'2\' stroke-linecap=\'round\'/%3E%3Cpath d=\'m13 7 4 0 0 4\' stroke=\'%234494f6\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E") 12 12, crosshair';
      default: return 'default';
    }
  }, [currentTool]);
  
  // Update cursor when hovering over elements
  const updateCursorForHover = useCallback((coords: { x: number; y: number }) => {
    const elementUnderCursor = findElementAt(coords);
    
    // If hovering over a moveable element and not in eraser mode
    if (elementUnderCursor && currentTool !== 'eraser') {
      setCurrentCursor('move');
    } else {
      setCurrentCursor(getToolCursor());
    }
  }, [currentTool, findElementAt, getToolCursor]);

  // Update cursor when tool changes
  useEffect(() => {
    setCurrentCursor(getToolCursor());
  }, [currentTool, getToolCursor]);

  const handlePointerMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawingMode) return;
    
    const eventCoords = getEventCoordinates(e);
    const coords = getDrawingCoordinates(eventCoords.x, eventCoords.y);
    
    // Update cursor based on what's under the mouse
    updateCursorForHover(coords);
    
    // Handle element dragging
    if (selectedElement) {
      setElements(prev => prev.map(element => {
        if (element.id === selectedElement && element.isDragging) {
          if (element.type === 'text') {
            return {
              ...element,
              position: {
                x: coords.x - dragOffset.x,
                y: coords.y - dragOffset.y
              }
            };
          }
          if (element.type === 'arrow' && element.position && element.endPosition) {
            const deltaX = coords.x - dragOffset.x - element.position.x;
            const deltaY = coords.y - dragOffset.y - element.position.y;
            return {
              ...element,
              position: {
                x: coords.x - dragOffset.x,
                y: coords.y - dragOffset.y
              },
              endPosition: {
                x: element.endPosition.x + deltaX,
                y: element.endPosition.y + deltaY
              }
            };
          }
        }
        return element;
      }));
      return;
    }
    
    // Handle pen drawing
    if (isDrawing && currentTool === 'pen') {
      setCurrentPath(prev => [...prev, coords]);
    }
  }, [isDrawingMode, isDrawing, currentTool, selectedElement, dragOffset, getDrawingCoordinates, getEventCoordinates]);

  // Mouse move handler
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    handlePointerMove(e);
  }, [handlePointerMove]);

  // Touch move handler
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    handlePointerMove(e);
  }, [handlePointerMove]);

  // Unified touch/mouse up handler
  const handlePointerEnd = useCallback(() => {
    // Handle element dragging end
    if (selectedElement) {
      setElements(prev => prev.map(el => ({ ...el, isDragging: false })));
      setSelectedElement(null);
      setDragOffset({ x: 0, y: 0 });
      return;
    }
    
    // Handle pen drawing end
    if (isDrawingMode && isDrawing && currentTool === 'pen') {
      if (currentPath.length > 1) {
        const newElement: DrawingElement = {
          id: `drawing_${Date.now()}`,
          type: 'pen',
          path: currentPath,
          color: currentColor,
          size: brushSize,
          timestamp: Date.now()
        };
        
        setElements(prev => [...prev, newElement]);
        toast.success('Drawing saved');
      }
      
      setIsDrawing(false);
      setCurrentPath([]);
    }
  }, [isDrawingMode, isDrawing, currentTool, currentPath, currentColor, brushSize, selectedElement]);

  // Mouse up handler
  const handleMouseUp = useCallback(() => {
    handlePointerEnd();
  }, [handlePointerEnd]);

  // Touch end handler
  const handleTouchEnd = useCallback(() => {
    handlePointerEnd();
  }, [handlePointerEnd]);

  // Add text element
  const addTextElement = useCallback(() => {
    if (!textValue.trim()) return;
    
    const newElement: DrawingElement = {
      id: `text_${Date.now()}`,
      type: 'text',
      text: textValue,
      position: textPosition,
      color: currentColor,
      size: brushSize * 4,
      timestamp: Date.now()
    };
    
    setElements(prev => [...prev, newElement]);
    setShowTextInput(false);
    setTextValue('');
    toast.success('Text added');
  }, [textValue, textPosition, currentColor, brushSize]);

  // Clear all drawings
  const clearDrawings = () => {
    setElements([]);
    setCurrentPath([]);
    setIsDrawing(false);
    setShowTextInput(false);
    toast.success('All drawings cleared');
  };

  // Global mouse event handlers for drawing continuation
  useEffect(() => {
    if (!isDrawingMode || !isDrawing) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (currentTool === 'pen') {
        const coords = getDrawingCoordinates(e.clientX, e.clientY);
        setCurrentPath(prev => [...prev, coords]);
      }
    };

    const handleGlobalMouseUp = () => {
      if (currentTool === 'pen' && currentPath.length > 1) {
        const newElement: DrawingElement = {
          id: `drawing_${Date.now()}`,
          type: 'pen',
          path: currentPath,
          color: currentColor,
          size: brushSize,
          timestamp: Date.now()
        };
        
        setElements(prev => [...prev, newElement]);
        toast.success('Drawing saved');
      }
      
      setIsDrawing(false);
      setCurrentPath([]);
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDrawingMode, isDrawing, currentTool, currentPath, currentColor, brushSize, getDrawingCoordinates]);

  // Show nothing if neither panel nor drawing mode is active
  if (!showDrawingToolsPanel && !isDrawingMode) return null;

  return (
    <>
      {/* Custom scrollbar styles */}
      <style jsx>{`
        .drawing-tools-panel {
          scrollbar-width: thin;
          scrollbar-color: #4b5563 #1f2937;
        }
        .drawing-tools-panel::-webkit-scrollbar {
          width: 6px;
        }
        .drawing-tools-panel::-webkit-scrollbar-track {
          background: #1f2937;
          border-radius: 3px;
        }
        .drawing-tools-panel::-webkit-scrollbar-thumb {
          background: #4b5563;
          border-radius: 3px;
          transition: background-color 0.2s ease;
        }
        .drawing-tools-panel::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
      `}</style>
      
      {/* Drawing Overlay - Only show when drawing mode is active */}
      {isDrawingMode && (
        <div
          ref={drawingOverlayRef}
          className={`fixed inset-0 w-full h-full z-[1001] ${!showDrawing ? 'pointer-events-none' : 'pointer-events-auto'}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            cursor: currentCursor,
            touchAction: 'none' // Prevent scrolling on touch devices
          }}
        >
        {/* Drawing SVG */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ display: showDrawing ? 'block' : 'none' }}
        >
          <defs>
            {/* Arrow marker */}
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill={currentColor}
              />
            </marker>
          </defs>
          {/* Existing elements */}
          {elements.map(element => {
            if (element.type === 'pen' && element.path) {
              const pathData = element.path.reduce((acc, point, index) => {
                return acc + (index === 0 ? `M ${point.x} ${point.y}` : ` L ${point.x} ${point.y}`);
              }, '');
              
              return (
                <path
                  key={element.id}
                  d={pathData}
                  stroke={element.color}
                  strokeWidth={element.size}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              );
            }
            
            if (element.type === 'text' && element.position && element.text) {
              return (
                <g key={element.id}>
                  {/* Selection highlight */}
                  {selectedElement === element.id && (
                    <rect
                      x={element.position.x - 5}
                      y={element.position.y - 5}
                      width={element.text.length * (element.size * 0.6) + 10}
                      height={element.size + 10}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                      opacity={0.7}
                    />
                  )}
                  <text
                    x={element.position.x}
                    y={element.position.y}
                    fill={element.color}
                    fontSize={element.size}
                    fontFamily="Inter, sans-serif"
                    fontWeight="600"
                    textAnchor="start"
                    dominantBaseline="text-before-edge"
                    style={{ cursor: 'move' }}
                  >
                    {element.text}
                  </text>
                </g>
              );
            }
            
            if (element.type === 'arrow' && element.position && element.endPosition) {
              return (
                <g key={element.id}>
                  {/* Selection highlight */}
                  {selectedElement === element.id && (
                    <line
                      x1={element.position.x}
                      y1={element.position.y}
                      x2={element.endPosition.x}
                      y2={element.endPosition.y}
                      stroke="#3b82f6"
                      strokeWidth={element.size + 4}
                      opacity={0.3}
                    />
                  )}
                  {/* Arrow line */}
                  <line
                    x1={element.position.x}
                    y1={element.position.y}
                    x2={element.endPosition.x}
                    y2={element.endPosition.y}
                    stroke={element.color}
                    strokeWidth={element.size}
                    markerEnd="url(#arrowhead)"
                    style={{ cursor: 'move' }}
                  />
                </g>
              );
            }
            
            return null;
          })}
          
          {/* Current drawing path */}
          {isDrawing && currentPath.length > 1 && (
            <path
              d={currentPath.reduce((acc, point, index) => {
                return acc + (index === 0 ? `M ${point.x} ${point.y}` : ` L ${point.x} ${point.y}`);
              }, '')}
              stroke={currentColor}
              strokeWidth={brushSize}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              opacity={0.8}
            />
          )}
          
          {/* Arrow preview while creating */}
          {isCreatingArrow && arrowStart && (
            <g>
              <circle
                cx={arrowStart.x}
                cy={arrowStart.y}
                r="4"
                fill={currentColor}
                opacity={0.7}
              />
              <text
                x={arrowStart.x + 10}
                y={arrowStart.y - 10}
                fill={currentColor}
                fontSize="12"
                fontFamily="Inter, sans-serif"
              >
                Click to finish arrow
              </text>
            </g>
          )}
        </svg>
        </div>
      )}

      {/* Text Input Overlay */}
      {showTextInput && (
        <div 
          className="fixed z-[1002] bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-500 p-4"
          style={{
            left: textPosition.x + 10,
            top: textPosition.y + 10
          }}
        >
          <input
            ref={textInputRef}
            type="text"
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                addTextElement();
              } else if (e.key === 'Escape') {
                setShowTextInput(false);
                setTextValue('');
              }
            }}
            placeholder="Enter text..."
            className="w-64 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
          <div className="flex space-x-2 mt-3">
            <Button 
              size="sm" 
              onClick={addTextElement} 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              Add Text
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => {
                setShowTextInput(false);
                setTextValue('');
              }}
              className="px-4 py-2 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Drawing Tools Panel - Overlays hexies library */}
      {showDrawingToolsPanel && (
        <div className="fixed 
                        bottom-4 left-4 right-4
                        md:bottom-4 md:left-4 md:right-auto md:w-80 md:max-w-80
                        z-[1003]
                        max-h-[calc(100vh-6rem)]">
        <div className="bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-600 
                        p-4 md:p-6 
                        w-full md:min-w-72 md:w-auto
                        relative overflow-y-auto
                        drawing-tools-panel">
          <div className="flex items-center justify-between mb-4 min-h-[32px]">
            <h3 className="text-lg font-bold text-white truncate">Drawing Tools</h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                onDrawingToolsPanelChange(false);
                onDrawingModeChange(false);
                setIsDrawing(false);
                setCurrentPath([]);
                setShowTextInput(false);
              }}
              className="text-gray-400 hover:text-white hover:bg-gray-700/50 h-8 w-8 p-0 rounded-lg shrink-0"
              aria-label="Close drawing tools"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Drawing Mode Toggle */}
          <div className="mb-4 md:mb-6">
            <Button
              onClick={() => {
                onDrawingModeChange(!isDrawingMode);
                // Remove duplicate toast messages since state is visually clear
              }}
              className={`w-full min-h-[50px] transition-all duration-200 font-semibold text-white ${
                isDrawingMode 
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/30' 
                  : 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 border border-gray-500'
              }`}
            >
              <Pen className={`h-5 w-5 mr-2 ${isDrawingMode ? 'text-white' : 'text-gray-300'}`} />
              {isDrawingMode ? 'Drawing Mode ON' : 'Enable Drawing Mode'}
            </Button>
          </div>
          
          {/* Tool Selection - Mobile Responsive Grid */}
          <div className={`grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-4 md:mb-6 ${!isDrawingMode ? 'opacity-50 pointer-events-none' : ''}`}>
            {[
              { tool: 'pen', icon: Pen, label: 'Draw' },
              { tool: 'text', icon: Type, label: 'Text' },
              { tool: 'arrow', icon: ArrowUpRight, label: 'Arrow' },
              { tool: 'eraser', icon: Eraser, label: 'Erase' }
            ].map(({ tool, icon: Icon, label }) => (
              <Button
                key={tool}
                size="sm"
                variant={currentTool === tool ? "default" : "outline"}
                onClick={() => {
                  setCurrentTool(tool as any);
                  setIsDrawing(false);
                  setCurrentPath([]);
                  setShowTextInput(false);
                  setSelectedElement(null);
                  setIsCreatingArrow(false);
                  setArrowStart(null);
                  // Visual feedback is clear from UI state, no need for toast
                }}
                className={`flex flex-col items-center 
                           py-3 md:py-4 h-auto min-h-[60px] md:min-h-[80px]
                           transition-all duration-200 
                           touch-manipulation select-none
                           active:scale-95 md:hover:scale-105
                           ${currentTool === tool 
                             ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/30 scale-105 ring-2 ring-blue-400/50' 
                             : 'border-gray-400 text-white bg-gray-700/50 active:bg-blue-500/30 md:hover:bg-blue-500/20 md:hover:border-blue-400 md:hover:text-white md:hover:shadow-lg'
                           }`}
              >
                <Icon className="h-5 w-5 md:h-6 md:w-6 mb-1 md:mb-2" />
                <span className="text-xs md:text-sm font-semibold">{label}</span>
              </Button>
            ))}
          </div>
          
          {/* Drawing Mode Toggle */}
          <div className="mb-4 md:mb-6">
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700">
              <div>
                <div className="text-sm font-semibold text-white">Drawing Mode</div>
                <div className="text-xs text-gray-400">Enable to draw on canvas</div>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  onDrawingModeChange(!isDrawingMode);
                  if (!isDrawingMode) {
                    toast.success('Drawing mode enabled');
                  } else {
                    toast.success('Drawing mode disabled');
                    setIsDrawing(false);
                    setCurrentPath([]);
                    setShowTextInput(false);
                  }
                }}
                className={`transition-all duration-200 ${
                  isDrawingMode 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-gray-600 hover:bg-gray-500 text-white'
                }`}
              >
                {isDrawingMode ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
          </div>
          
          {/* Color Selection - Mobile Responsive */}
          <div className={`mb-4 md:mb-6 ${!isDrawingMode ? 'opacity-50 pointer-events-none' : ''}`}>
            <label className="text-sm text-white mb-2 md:mb-3 block font-semibold">Color</label>
            <div className="grid grid-cols-4 gap-2 md:gap-3 mb-3 md:mb-4">
              {quickColors.map(color => (
                <button
                  key={color}
                  onClick={() => {
                    setCurrentColor(color);
                    toast.success('Color changed');
                  }}
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-xl border-2 transition-all duration-200 relative
                             touch-manipulation active:scale-95 md:hover:scale-105 ${
                    currentColor === color 
                      ? 'border-white scale-110 shadow-xl shadow-white/40 ring-2 ring-white/60' 
                      : 'border-gray-400 hover:border-white hover:scale-105 hover:shadow-lg'
                  }`}
                  style={{ backgroundColor: color }}
                  title={`Select ${color} color`}
                >
                  {currentColor === color && (
                    <div className="absolute inset-0 rounded-xl bg-white/30 flex items-center justify-center">
                      <div className="w-4 h-4 bg-white rounded-full shadow-lg"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
            <input
              type="color"
              value={currentColor}
              onChange={(e) => {
                setCurrentColor(e.target.value);
                toast.success('Custom color selected');
              }}
              className="w-full h-12 rounded-xl border-2 border-gray-400 bg-gray-800 cursor-pointer hover:border-white transition-all duration-200 hover:shadow-lg"
            />
          </div>
          
          {/* Brush Size - Mobile Responsive */}
          <div className={`mb-4 md:mb-6 ${!isDrawingMode ? 'opacity-50 pointer-events-none' : ''}`}>
            <label className="text-sm text-white mb-2 md:mb-3 block font-semibold">
              Size: {brushSize}px
            </label>
            <input
              type="range"
              min="1"
              max="20"
              value={brushSize}
              onChange={(e) => {
                setBrushSize(Number(e.target.value));
                toast.success(`Size: ${e.target.value}px`);
              }}
              className="w-full h-4 md:h-3 accent-blue-500 bg-gray-700 rounded-lg appearance-none cursor-pointer touch-manipulation"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>1px</span>
              <span>20px</span>
            </div>
          </div>
          
          {/* Actions - Mobile Responsive */}
          <div className="flex space-x-2 md:space-x-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowDrawing(!showDrawing);
                toast.success(showDrawing ? 'Drawings hidden' : 'Drawings shown');
              }}
              className="flex-1 min-h-[44px] transition-all duration-200
                        bg-gray-700/80 border-gray-500 text-white font-medium
                        active:bg-gray-600 md:hover:bg-gray-600 
                        active:border-gray-400 md:hover:border-gray-400
                        active:shadow-lg md:hover:shadow-lg
                        touch-manipulation"
            >
              {showDrawing ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
              {showDrawing ? 'Hide' : 'Show'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={clearDrawings}
              className="flex-1 min-h-[44px] transition-all duration-200
                        bg-red-700/80 border-red-500 text-white font-medium
                        active:bg-red-600 md:hover:bg-red-600 
                        active:border-red-400 md:hover:border-red-400
                        active:shadow-lg md:hover:shadow-lg
                        touch-manipulation"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>

          {/* Current Tool Status */}
          <div className="mt-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
            <div className="text-xs text-gray-400 mb-1">Current Tool</div>
            <div className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: currentColor }}
              ></div>
              <span className="text-sm text-white font-medium capitalize">
                {currentTool} • {brushSize}px
              </span>
            </div>
          </div>
        </div>
        </div>
      )}
    </>
  );
};

export default DrawingTools;