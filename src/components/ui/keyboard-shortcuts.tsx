'use client';

import { useState, useEffect } from 'react';
import { Button } from './button';
import { FadeIn, Stagger } from './animations';
import { 
  Keyboard, 
  X, 
  MousePointer2, 
  Hand, 
  Hexagon, 
  Copy, 
  Trash2, 
  Undo, 
  Redo, 
  ZoomIn, 
  ZoomOut, 
  Save, 
  Download, 
  Grid3X3, 
  Maximize, 
  Search,
  Crown,
  Sparkles
} from 'lucide-react';

interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcutCategories = [
  {
    category: 'Tools',
    icon: MousePointer2,
    shortcuts: [
      { key: 'V', description: 'Select Tool', icon: MousePointer2 },
      { key: 'H', description: 'Pan Tool', icon: Hand },
      { key: 'A', description: 'Add Hexie Tool', icon: Hexagon },
      { key: 'Esc', description: 'Cancel Current Action', icon: X },
    ]
  },
  {
    category: 'Edit',
    icon: Copy,
    shortcuts: [
      { key: 'Ctrl+Z', description: 'Undo', icon: Undo },
      { key: 'Ctrl+Y', description: 'Redo', icon: Redo },
      { key: 'Ctrl+C', description: 'Copy Selected', icon: Copy },
      { key: 'Del', description: 'Delete Selected', icon: Trash2 },
      { key: 'Ctrl+S', description: 'Save Workspace', icon: Save },
    ]
  },
  {
    category: 'View',
    icon: ZoomIn,
    shortcuts: [
      { key: '+', description: 'Zoom In', icon: ZoomIn },
      { key: '-', description: 'Zoom Out', icon: ZoomOut },
      { key: '0', description: 'Reset Zoom (100%)', icon: Search },
      { key: 'G', description: 'Toggle Grid', icon: Grid3X3 },
      { key: 'F', description: 'Presentation Mode', icon: Maximize },
    ]
  },
  {
    category: 'Premium',
    icon: Crown,
    shortcuts: [
      { key: 'Ctrl+E', description: 'Export Options', icon: Download },
      { key: '?', description: 'Show Shortcuts', icon: Keyboard },
      { key: 'Ctrl+Shift+P', description: 'Command Palette', icon: Sparkles },
      { key: 'Ctrl+/', description: 'Quick Search', icon: Search },
    ]
  }
];

export function KeyboardShortcuts({ isOpen, onClose }: KeyboardShortcutsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCategories, setFilteredCategories] = useState(shortcutCategories);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredCategories(shortcutCategories);
      return;
    }

    const filtered = shortcutCategories.map(category => ({
      ...category,
      shortcuts: category.shortcuts.filter(
        shortcut => 
          shortcut.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          shortcut.key.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })).filter(category => category.shortcuts.length > 0);

    setFilteredCategories(filtered);
  }, [searchQuery]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
      if (e.key === '?' && e.ctrlKey) {
        e.preventDefault();
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <FadeIn>
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Keyboard className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Keyboard Shortcuts</h2>
                  <p className="text-blue-100">Master Hexies like a pro</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Search */}
            <div className="mt-4 relative">
              <input
                type="text"
                placeholder="Search shortcuts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/20 border border-white/30 rounded-lg px-4 py-2 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-sm"
              />
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-blue-200" />
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {filteredCategories.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Keyboard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No shortcuts found for "{searchQuery}"</p>
              </div>
            ) : (
              <Stagger className="space-y-8" staggerDelay={100}>
                {filteredCategories.map((category, categoryIndex) => (
                  <div key={category.category} className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        category.category === 'Premium' 
                          ? 'bg-gradient-to-r from-yellow-400 to-orange-500' 
                          : 'bg-gradient-to-r from-blue-500 to-purple-600'
                      }`}>
                        <category.icon className="h-4 w-4 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {category.category}
                        {category.category === 'Premium' && (
                          <Crown className="inline h-4 w-4 ml-2 text-yellow-600" />
                        )}
                      </h3>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-3">
                      {category.shortcuts.map((shortcut, shortcutIndex) => (
                        <div 
                          key={shortcut.key}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                        >
                          <div className="flex items-center space-x-3">
                            <shortcut.icon className="h-4 w-4 text-gray-500 group-hover:text-blue-600 transition-colors" />
                            <span className="text-gray-700 group-hover:text-gray-900 transition-colors">
                              {shortcut.description}
                            </span>
                          </div>
                          <kbd className="bg-white border border-gray-300 rounded px-2 py-1 text-sm font-mono text-gray-800 shadow-sm">
                            {shortcut.key}
                          </kbd>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </Stagger>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                <span>💡 Pro tip: Hold <kbd className="bg-white px-1 rounded border">Shift</kbd> while using tools for precision mode</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>Press</span>
                <kbd className="bg-white px-2 py-1 rounded border font-mono">Esc</kbd>
                <span>to close</span>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}

// Hook to manage keyboard shortcuts modal
export function useKeyboardShortcuts() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open shortcuts with ? key (or Shift+/)
      if (e.key === '?' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        setIsOpen(true);
      }
      
      // Also support Ctrl+? for accessibility
      if (e.key === '?' && e.ctrlKey) {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev)
  };
}