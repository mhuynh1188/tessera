'use client';

import { 
  MousePointer2, 
  Hand, 
  Hexagon,
  Copy,
  Trash2,
  RotateCw,
  FlipHorizontal,
  Group,
  Ungroup,
  Download,
  Upload,
  Save,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Grid3X3,
  Layers,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Workspace, User } from '@/types';

interface WorkspaceToolbarProps {
  mode: 'select' | 'pan' | 'hexie';
  onModeChange: (mode: 'select' | 'pan' | 'hexie') => void;
  selectedCount: number;
  onClearSelection: () => void;
  workspace: Workspace | null;
  user: User | null;
}

export default function WorkspaceToolbar({
  mode,
  onModeChange,
  selectedCount,
  onClearSelection,
  workspace,
  user
}: WorkspaceToolbarProps) {
  
  const tools = [
    {
      id: 'select',
      icon: MousePointer2,
      label: 'Select',
      shortcut: 'V',
      active: mode === 'select'
    },
    {
      id: 'pan',
      icon: Hand,
      label: 'Pan',
      shortcut: 'H',
      active: mode === 'pan'
    },
    {
      id: 'hexie',
      icon: Hexagon,
      label: 'Add Hexie',
      shortcut: 'A',
      active: mode === 'hexie'
    }
  ];

  return (
    <div className="border-b bg-background/95 backdrop-blur px-4 py-2">
      <div className="flex items-center justify-between">
        {/* Left Section - Tools */}
        <div className="flex items-center space-x-1">
          {/* Tool Selection */}
          <div className="flex items-center space-x-1 mr-4 p-1 bg-muted rounded-lg">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Button
                  key={tool.id}
                  variant={tool.active ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onModeChange(tool.id as any)}
                  className="h-8 w-8 p-0"
                  title={`${tool.label} (${tool.shortcut})`}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              );
            })}
          </div>

          {/* Action Tools */}
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm" title="Undo (Ctrl+Z)">
              <Undo className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" title="Redo (Ctrl+Y)">
              <Redo className="h-4 w-4" />
            </Button>
          </div>

          <div className="w-px h-6 bg-border mx-2" />

          {/* Selection Tools */}
          {selectedCount > 0 && (
            <div className="flex items-center space-x-1">
              <span className="text-sm text-muted-foreground mr-2">
                {selectedCount} selected
              </span>
              
              <Button variant="ghost" size="sm" title="Copy (Ctrl+C)">
                <Copy className="h-4 w-4" />
              </Button>
              
              <Button variant="ghost" size="sm" title="Rotate">
                <RotateCw className="h-4 w-4" />
              </Button>
              
              <Button variant="ghost" size="sm" title="Flip">
                <FlipHorizontal className="h-4 w-4" />
              </Button>
              
              {selectedCount > 1 && (
                <Button variant="ghost" size="sm" title="Group">
                  <Group className="h-4 w-4" />
                </Button>
              )}
              
              <Button variant="ghost" size="sm" title="Delete (Del)">
                <Trash2 className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClearSelection}
                title="Clear Selection (Esc)"
              >
                ✕
              </Button>
            </div>
          )}
        </div>

        {/* Center Section - Zoom Controls */}
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="sm" title="Zoom Out">
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <span className="text-sm text-muted-foreground px-2 min-w-16 text-center">
            100%
          </span>
          
          <Button variant="ghost" size="sm" title="Zoom In">
            <ZoomIn className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-border mx-2" />
          
          <Button 
            variant="ghost" 
            size="sm" 
            title="Toggle Grid"
            className={workspace?.settings.snap_to_grid ? 'bg-muted' : ''}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
        </div>

        {/* Right Section - File Operations */}
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="sm" title="Import">
            <Upload className="h-4 w-4" />
          </Button>
          
          <Button variant="ghost" size="sm" title="Export">
            <Download className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-border mx-2" />
          
          <Button variant="ghost" size="sm" title="Auto-save enabled">
            <Save className="h-4 w-4 text-green-500" />
          </Button>
          
          <Button variant="ghost" size="sm" title="Workspace Settings">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Quick Access Hints */}
      {selectedCount === 0 && mode === 'select' && (
        <div className="mt-2 text-xs text-muted-foreground">
          💡 Tip: Drag hexies from the library or press 'A' to add mode. Use 'V' for select, 'H' for pan.
        </div>
      )}
    </div>
  );
}