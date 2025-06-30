'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Pen, 
  Type, 
  Eraser, 
  Palette,
  RotateCcw,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

interface DrawingElement {
  id: string;
  type: 'pen' | 'text';
  path?: { x: number; y: number }[];
  text?: string;
  position?: { x: number; y: number };
  color: string;
  size: number;
  timestamp: number;
}

interface DrawingToolsProps {
  canvasRef: React.RefObject<HTMLDivElement>;
  canvasTransform: { scale: number; translateX: number; translateY: number };
  isDrawingMode: boolean;
  onDrawingModeChange: (enabled: boolean) => void;
}

export const DrawingTools: React.FC<DrawingToolsProps> = ({
  canvasRef,
  canvasTransform,
  isDrawingMode,
  onDrawingModeChange
}) => {
  const [currentTool, setCurrentTool] = useState<'pen' | 'text' | 'eraser'>('pen');
  const [currentColor, setCurrentColor] = useState('#ff6b6b');
  const [brushSize, setBrushSize] = useState(3);
  const [showDrawing, setShowDrawing] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [elements, setElements] = useState<DrawingElement[]>([]);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
  const [textValue, setTextValue] = useState('');
  
  const drawingContainerRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  // Common colors for quick selection
  const quickColors = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', 
    '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd'
  ];

  // Convert screen coordinates to drawing coordinates (relative to the drawing container)
  const screenToDrawing = useCallback((screenX: number, screenY: number) => {
    if (!drawingContainerRef.current) return { x: 0, y: 0 };
    
    const rect = drawingContainerRef.current.getBoundingClientRect();
    const x = screenX - rect.left;
    const y = screenY - rect.top;
    
    return { x, y };
  }, []);

  // Handle mouse down for drawing
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isDrawingMode) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const point = screenToDrawing(e.clientX, e.clientY);
    
    if (currentTool === 'eraser') {
      // Find and remove elements at this position
      setElements(prev => prev.filter(element => {
        if (element.type === 'pen' && element.path) {
          return !element.path.some(p => 
            Math.abs(p.x - point.x) < 20 && Math.abs(p.y - point.y) < 20
          );
        }
        if (element.type === 'text' && element.position) {
          return !(Math.abs(element.position.x - point.x) < 50 && 
                  Math.abs(element.position.y - point.y) < 20);
        }
        return true;
      }));
      toast.success('Element erased');
      return;
    }
    
    if (currentTool === 'text') {
      setTextPosition(point);
      setShowTextInput(true);
      setTextValue('');
      
      // Focus input after a brief delay
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 100);
      return;
    }
    
    if (currentTool === 'pen') {
      setIsDrawing(true);
      setCurrentPath([point]);
    }
  }, [isDrawingMode, currentTool, screenToDrawing]);

  // Handle mouse move for drawing
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawingMode || !isDrawing || currentTool !== 'pen') return;
    
    const point = screenToDrawing(e.clientX, e.clientY);
    setCurrentPath(prev => [...prev, point]);
  }, [isDrawingMode, isDrawing, currentTool, screenToDrawing]);

  // Handle mouse up for drawing
  const handleMouseUp = useCallback(() => {
    if (!isDrawingMode || !isDrawing || currentTool !== 'pen') return;
    
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
  }, [isDrawingMode, isDrawing, currentTool, currentPath, currentColor, brushSize]);

  // Add text element
  const addTextElement = useCallback(() => {
    if (!textValue.trim()) return;
    
    const newElement: DrawingElement = {
      id: `text_${Date.now()}`,
      type: 'text',
      text: textValue,
      position: textPosition,
      color: currentColor,
      size: brushSize * 4, // Text size is larger
      timestamp: Date.now()
    };
    
    setElements(prev => [...prev, newElement]);
    setShowTextInput(false);
    setTextValue('');
    toast.success('Text added');
  }, [textValue, textPosition, currentColor, brushSize]);

  // Setup global mouse move and up listeners for drawing
  useEffect(() => {
    if (!isDrawingMode) return;
    
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDrawing && currentTool === 'pen') {
        const point = screenToDrawing(e.clientX, e.clientY);
        setCurrentPath(prev => [...prev, point]);
      }
    };
    
    const handleGlobalMouseUp = () => {
      if (isDrawing && currentTool === 'pen') {
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
    };
    
    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDrawingMode, isDrawing, currentTool, currentPath, currentColor, brushSize, screenToDrawing]);

  // Clear all drawings
  const clearDrawings = () => {
    setElements([]);
    toast.success('Drawings cleared');
  };

  // Save drawings (placeholder for future implementation)
  const saveDrawings = () => {
    toast.success('Drawings saved to workspace');
  };

  if (!isDrawingMode) return null;

  return (
    <>
      {/* Drawing Container Overlay */}
      <div
        ref={drawingContainerRef}
        className={`absolute inset-0 w-full h-full z-[1001] ${!showDrawing ? 'hidden' : ''} ${isDrawingMode ? 'pointer-events-auto' : 'pointer-events-none'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{
          cursor: isDrawingMode ? (currentTool === 'pen' ? 'crosshair' : currentTool === 'eraser' ? 'grab' : 'text') : 'default'
        }}
      >
        {/* Drawing SVG */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
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
                <text
                  key={element.id}
                  x={element.position.x}
                  y={element.position.y}
                  fill={element.color}
                  fontSize={element.size}
                  fontFamily="Inter, sans-serif"
                  fontWeight="500"
                >
                  {element.text}
                </text>
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
        </svg>
      </div>

      {/* Text Input Overlay */}
      {showTextInput && (
        <div 
          className="absolute z-[1002] bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-600 p-3"
          style={{
            left: textPosition.x,
            top: textPosition.y
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
            className="w-48 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
          <div className="flex space-x-2 mt-2">
            <Button size="sm" onClick={addTextElement} className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white">
              Add
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => {
                setShowTextInput(false);
                setTextValue('');
              }}
              className="h-7 px-3 text-xs border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Drawing Tools Panel */}
      <div className="absolute bottom-20 left-6 z-[1003]">
        <div className="bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-600 p-4 min-w-64">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Drawing Tools</h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                onDrawingModeChange(false);
                setIsDrawing(false);
                setCurrentPath([]);
                setShowTextInput(false);
              }}
              className="text-gray-400 hover:text-white hover:bg-gray-700 h-8 w-8 p-0 rounded-lg"
            >
              ×
            </Button>
          </div>
          
          {/* Tool Selection */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { tool: 'pen', icon: Pen, label: 'Draw' },
              { tool: 'text', icon: Type, label: 'Text' },
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
                  toast.success(`${label} tool selected`);
                }}
                className={`flex flex-col items-center py-4 h-auto transition-all duration-200 ${
                  currentTool === tool 
                    ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-500/30 scale-105 ring-2 ring-blue-300/50' 
                    : 'border-gray-400 text-white bg-gray-700 hover:bg-blue-500/30 hover:border-blue-400 hover:text-white hover:scale-105 hover:shadow-md'
                }`}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="text-xs font-semibold">{label}</span>
              </Button>
            ))}
          </div>
          
          {/* Color Selection */}
          <div className="mb-4">
            <label className="text-sm text-white mb-3 block font-medium">Color</label>
            <div className="grid grid-cols-4 gap-3 mb-3">
              {quickColors.map(color => (
                <button
                  key={color}
                  onClick={() => {
                    setCurrentColor(color);
                    toast.success('Color changed');
                  }}
                  className={`w-10 h-10 rounded-lg border-2 transition-all duration-200 relative ${
                    currentColor === color 
                      ? 'border-white scale-110 shadow-lg shadow-white/40 ring-2 ring-white/60' 
                      : 'border-gray-400 hover:border-white hover:scale-105 hover:shadow-lg'
                  }`}
                  style={{ backgroundColor: color }}
                  title={`Select ${color} color`}
                >
                  {currentColor === color && (
                    <div className="absolute inset-0 rounded-lg bg-white/30 flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-full shadow-sm"></div>
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
              className="w-full h-10 rounded-lg border-2 border-gray-400 bg-gray-800 cursor-pointer hover:border-white transition-all duration-200 hover:shadow-md"
            />
          </div>
          
          {/* Brush Size */}
          <div className="mb-4">
            <label className="text-sm text-white mb-3 block font-medium">
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
              className="w-full h-3 accent-blue-500 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1px</span>
              <span>20px</span>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowDrawing(!showDrawing);
                toast.success(showDrawing ? 'Drawings hidden' : 'Drawings shown');
              }}
              className="flex-1 border-gray-500 text-gray-200 hover:bg-gray-700 hover:text-white hover:border-gray-400"
            >
              {showDrawing ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
              {showDrawing ? 'Hide' : 'Show'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={clearDrawings}
              className="flex-1 border-gray-500 text-gray-200 hover:bg-red-600 hover:text-white hover:border-red-500"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default DrawingTools;