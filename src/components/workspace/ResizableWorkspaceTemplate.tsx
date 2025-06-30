import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ResizableBox } from 'react-resizable';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Move } from 'lucide-react';
import 'react-resizable/css/styles.css';

interface ResizableWorkspaceTemplateProps {
  children: React.ReactNode;
  initialWidth?: number;
  initialHeight?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  onResize?: (width: number, height: number) => void;
  className?: string;
  hexieSize?: number; // For maintaining uniform hexie sizing
  onHexieSizeChange?: (size: number) => void;
}

export const ResizableWorkspaceTemplate: React.FC<ResizableWorkspaceTemplateProps> = ({
  children,
  initialWidth = 1200,
  initialHeight = 800,
  minWidth = 600,
  minHeight = 400,
  maxWidth = 2400,
  maxHeight = 1600,
  onResize,
  className = '',
  hexieSize = 60,
  onHexieSizeChange
}) => {
  const [dimensions, setDimensions] = useState({
    width: initialWidth,
    height: initialHeight
  });
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [currentHexieSize, setCurrentHexieSize] = useState(hexieSize);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0, startX: 0, startY: 0 });

  // Calculate hexie size based on template size to maintain uniformity
  useEffect(() => {
    const baseDimension = Math.min(dimensions.width, dimensions.height);
    const newHexieSize = Math.max(40, Math.min(80, baseDimension / 15)); // Scale between 40-80px
    setCurrentHexieSize(newHexieSize);
    onHexieSizeChange?.(newHexieSize);
  }, [dimensions, onHexieSizeChange]);

  const handleResize = useCallback((event: any, { size }: { size: { width: number; height: number } }) => {
    const newDimensions = {
      width: Math.max(minWidth, Math.min(maxWidth, size.width)),
      height: Math.max(minHeight, Math.min(maxHeight, size.height))
    };
    
    setDimensions(newDimensions);
    onResize?.(newDimensions.width, newDimensions.height);
  }, [minWidth, minHeight, maxWidth, maxHeight, onResize]);

  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(3, prev * 1.25));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale(prev => Math.max(0.25, prev / 1.25));
  }, []);

  const handleResetView = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleMaximize = useCallback(() => {
    const newDimensions = {
      width: Math.min(maxWidth, window.innerWidth - 100),
      height: Math.min(maxHeight, window.innerHeight - 200)
    };
    setDimensions(newDimensions);
    onResize?.(newDimensions.width, newDimensions.height);
  }, [maxWidth, maxHeight, onResize]);

  // Pan functionality
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('pannable')) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        startX: position.x,
        startY: position.y
      };
      e.preventDefault();
    }
  }, [position]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;

    setPosition({
      x: dragStartRef.current.startX + deltaX,
      y: dragStartRef.current.startY + deltaY
    });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div className={`relative border-2 border-gray-300 rounded-lg overflow-hidden ${className}`}>
      {/* Controls */}
      <div className="absolute top-2 right-2 z-50 flex gap-1 bg-white/90 backdrop-blur-sm rounded-lg p-1 shadow-lg">
        <Button
          size="sm"
          variant="outline"
          onClick={handleZoomOut}
          title="Zoom Out"
          className="h-8 w-8 p-0"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={handleZoomIn}
          title="Zoom In"
          className="h-8 w-8 p-0"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={handleResetView}
          title="Reset View"
          className="h-8 w-8 p-0"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={handleMaximize}
          title="Maximize"
          className="h-8 w-8 p-0"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Size and scale info */}
      <div className="absolute top-2 left-2 z-50 bg-black/60 text-white text-xs rounded px-2 py-1">
        <div>Size: {dimensions.width}×{dimensions.height}</div>
        <div>Scale: {Math.round(scale * 100)}%</div>
        <div>Hexie: {Math.round(currentHexieSize)}px</div>
      </div>

      {/* Pan instruction */}
      <div className="absolute bottom-2 left-2 z-50 bg-black/60 text-white text-xs rounded px-2 py-1 flex items-center gap-1">
        <Move className="h-3 w-3" />
        <span>Click & drag to pan</span>
      </div>

      {/* Resizable container */}
      <ResizableBox
        width={dimensions.width}
        height={dimensions.height}
        onResize={handleResize}
        minConstraints={[minWidth, minHeight]}
        maxConstraints={[maxWidth, maxHeight]}
        resizeHandles={['se', 'e', 's']}
        className="relative"
      >
        <div
          ref={containerRef}
          className="w-full h-full overflow-hidden bg-gray-50 cursor-move pannable"
          onMouseDown={handleMouseDown}
          style={{
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
        >
          {/* Viewport with zoom and pan */}
          <div
            className="w-full h-full"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transformOrigin: '0 0',
              transition: isDragging ? 'none' : 'transform 0.2s ease-out'
            }}
          >
            {/* Template content with dynamic sizing */}
            <div 
              style={{
                width: dimensions.width,
                height: dimensions.height,
                position: 'relative'
              }}
            >
              {children}
            </div>
          </div>
        </div>
      </ResizableBox>

      {/* CSS for uniform hexie sizing */}
      <style jsx>{`
        .hexie-card {
          width: ${currentHexieSize}px !important;
          height: ${currentHexieSize}px !important;
        }
        
        .hexie-instance {
          width: ${currentHexieSize}px !important;
          height: ${currentHexieSize}px !important;
        }
        
        .react-resizable-handle {
          background-color: #3b82f6;
          border-radius: 2px;
        }
        
        .react-resizable-handle-se {
          width: 20px;
          height: 20px;
        }
        
        .react-resizable-handle-e {
          width: 10px;
        }
        
        .react-resizable-handle-s {
          height: 10px;
        }
      `}</style>
    </div>
  );
};