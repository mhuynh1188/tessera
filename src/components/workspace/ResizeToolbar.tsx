import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Maximize2, 
  Minimize2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Settings,
  Grip
} from 'lucide-react';

interface ResizeToolbarProps {
  onToggleResize: () => void;
  isResizeMode: boolean;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onReset?: () => void;
  currentSize?: { width: number; height: number };
  hexieSize?: number;
}

export const ResizeToolbar: React.FC<ResizeToolbarProps> = ({
  onToggleResize,
  isResizeMode,
  onZoomIn,
  onZoomOut,
  onReset,
  currentSize,
  hexieSize
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="fixed bottom-4 right-4 z-50 bg-gray-800/95 border-gray-600 backdrop-blur-xl">
      <div className="p-2">
        {/* Main toggle button */}
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant={isResizeMode ? "default" : "outline"}
            onClick={onToggleResize}
            className={`${
              isResizeMode 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {isResizeMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          
          {/* Expand/collapse controls */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-white hover:bg-gray-700"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        {/* Expanded controls */}
        {isExpanded && isResizeMode && (
          <div className="mt-3 pt-3 border-t border-gray-600">
            <div className="space-y-2">
              {/* Zoom controls */}
              <div className="flex items-center space-x-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onZoomOut}
                  disabled={!onZoomOut}
                  className="text-gray-300 hover:text-white hover:bg-gray-700 w-8 h-8 p-0"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-3 w-3" />
                </Button>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onZoomIn}
                  disabled={!onZoomIn}
                  className="text-gray-300 hover:text-white hover:bg-gray-700 w-8 h-8 p-0"
                  title="Zoom In"
                >
                  <ZoomIn className="h-3 w-3" />
                </Button>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onReset}
                  disabled={!onReset}
                  className="text-gray-300 hover:text-white hover:bg-gray-700 w-8 h-8 p-0"
                  title="Reset"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </div>

              {/* Size info */}
              {currentSize && (
                <div className="text-xs text-gray-400 mt-2">
                  <div>Size: {currentSize.width}×{currentSize.height}</div>
                  {hexieSize && <div>Tessera: {hexieSize}px</div>}
                </div>
              )}

              {/* Instructions */}
              <div className="text-xs text-gray-500 mt-2 max-w-48">
                <div className="flex items-center space-x-1 mb-1">
                  <Grip className="h-3 w-3" />
                  <span>Drag corners to resize</span>
                </div>
                <div>Tesseras stay uniform</div>
              </div>
            </div>
          </div>
        )}

        {/* Compact mode info */}
        {!isExpanded && isResizeMode && (
          <div className="mt-1 text-xs text-gray-400 text-center">
            Resize Mode
          </div>
        )}
      </div>
    </Card>
  );
};