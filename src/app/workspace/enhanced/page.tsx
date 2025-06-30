'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Settings, 
  Maximize2, 
  Layers, 
  Palette,
  Upload,
  Download,
  Save,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';
import { authService } from '@/lib/auth';
import { db } from '@/lib/supabase';
import { TesseraCard, User as UserType } from '@/types';
import toast from 'react-hot-toast';
import UserNav from '@/components/layout/UserNav';
import { ResizableWorkspaceTemplate } from '@/components/workspace/ResizableWorkspaceTemplate';
import EstuarineMapTemplate from '@/components/workspace/templates/EstuarineMapTemplate';
import { HexieContextMenu } from '@/components/workspace/HexieContextMenu';

interface PlacedTessera {
  id: string;
  tesseraCard: TesseraCard;
  position: { x: number; y: number };
  rotation: number;
  scale: number;
  isFlipped: boolean;
}

export default function EnhancedWorkspacePage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [tesseraLibrary, setTesseraLibrary] = useState<TesseraCard[]>([]);
  const [placedTesseras, setPlacedTesseras] = useState<PlacedTessera[]>([]);
  const [selectedTessera, setSelectedTessera] = useState<string | null>(null);
  const [templateDimensions, setTemplateDimensions] = useState({ width: 1200, height: 800 });
  const [hexieSize, setHexieSize] = useState(60);
  const [showTesseraLibrary, setShowTesseraLibrary] = useState(true);
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    isVisible: boolean;
    tesseraId: string | null;
    position: { x: number; y: number };
  }>({
    isVisible: false,
    tesseraId: null,
    position: { x: 0, y: 0 }
  });

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        window.location.href = '/auth/login';
        return;
      }
      setUser(currentUser);
      await loadUserData(currentUser);
    } catch (error) {
      console.error('Authentication check failed:', error);
      window.location.href = '/auth/login';
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async (user: UserType) => {
    try {
      const tesseras = await db.getTesseraCards({
        subscription_tier: user.subscription_tier || 'free',
        is_active: true
      });
      setTesseraLibrary(tesseras);
      toast.success(`Enhanced workspace loaded! 🎯`);
    } catch (error) {
      console.error('Failed to load user data:', error);
      toast.error('Failed to load workspace data');
    }
  };

  const handleTesseraClick = (tessera: TesseraCard) => {
    // Add tessera to workspace at center
    const newPlacedTessera: PlacedTessera = {
      id: `placed-${Date.now()}-${Math.random()}`,
      tesseraCard: tessera,
      position: { 
        x: templateDimensions.width / 2 - hexieSize / 2, 
        y: templateDimensions.height / 2 - hexieSize / 2 
      },
      rotation: 0,
      scale: 1,
      isFlipped: false
    };
    
    setPlacedTesseras(prev => [...prev, newPlacedTessera]);
    toast.success(`Added "${tessera.title}" to workspace`);
  };

  const handleTesseraRightClick = (event: React.MouseEvent, placedTessera: PlacedTessera) => {
    event.preventDefault();
    setContextMenu({
      isVisible: true,
      tesseraId: placedTessera.id,
      position: { x: event.clientX, y: event.clientY }
    });
  };

  const closeContextMenu = () => {
    setContextMenu(prev => ({ ...prev, isVisible: false }));
  };

  const handleTemplateResize = (width: number, height: number) => {
    setTemplateDimensions({ width, height });
  };

  const handleHexieSizeChange = (size: number) => {
    setHexieSize(size);
  };

  const handleDeleteTessera = (tesseraId: string) => {
    setPlacedTesseras(prev => prev.filter(t => t.id !== tesseraId));
    toast.success('Tessera removed from workspace');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading enhanced workspace...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold">Enhanced Workspace</h1>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <span>Template: {templateDimensions.width}×{templateDimensions.height}</span>
              <span>|</span>
              <span>Tessera Size: {hexieSize}px</span>
              <span>|</span>
              <span>Placed: {placedTesseras.length}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTesseraLibrary(!showTesseraLibrary)}
            >
              <Layers className="h-4 w-4 mr-2" />
              {showTesseraLibrary ? 'Hide' : 'Show'} Library
            </Button>
            <UserNav />
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Tessera Library Sidebar */}
        {showTesseraLibrary && (
          <div className="w-80 bg-gray-800 border-r border-gray-700 p-4 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Tessera Library</h3>
            
            <div className="space-y-3">
              {tesseraLibrary.map((tessera) => {
                const hasAccess = authService.hasSubscriptionAccess(
                  user?.subscription_tier || 'free', 
                  tessera.subscription_tier_required
                );
                const colorScheme = tessera.color_scheme || { 
                  primary: '#6b7280', 
                  secondary: '#4b5563', 
                  text: '#ffffff' 
                };
                
                return (
                  <Card 
                    key={tessera.id} 
                    className="bg-gray-700 border-gray-600 hover:border-gray-500 transition-all cursor-pointer"
                    style={{ boxShadow: 'none' }}
                    onClick={() => hasAccess && handleTesseraClick(tessera)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start space-x-3">
                        <div 
                          className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: colorScheme.primary }}
                        >
                          <span className="text-white text-xs font-bold">
                            {tessera.title.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-white truncate">
                            {tessera.title}
                          </h4>
                          <p className="text-xs text-gray-400 truncate">
                            {tessera.category}
                          </p>
                          {!hasAccess && (
                            <p className="text-xs text-yellow-400 mt-1">
                              Requires {tessera.subscription_tier_required}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Workspace */}
        <div className="flex-1 p-4">
          <ResizableWorkspaceTemplate
            initialWidth={templateDimensions.width}
            initialHeight={templateDimensions.height}
            onResize={handleTemplateResize}
            hexieSize={hexieSize}
            onHexieSizeChange={handleHexieSizeChange}
            className="mx-auto"
          >
            {/* Template Background */}
            <EstuarineMapTemplate 
              width={templateDimensions.width} 
              height={templateDimensions.height}
            />
            
            {/* Placed Tesseras */}
            {placedTesseras.map((placedTessera) => {
              const colorScheme = placedTessera.tesseraCard.color_scheme || { 
                primary: '#6b7280', 
                secondary: '#4b5563', 
                text: '#ffffff' 
              };
              
              return (
                <div
                  key={placedTessera.id}
                  className="absolute cursor-pointer transition-all hover:scale-105 hexie-instance"
                  style={{
                    left: placedTessera.position.x,
                    top: placedTessera.position.y,
                    width: hexieSize,
                    height: hexieSize,
                    transform: `rotate(${placedTessera.rotation}deg) scale(${placedTessera.scale})`,
                    zIndex: selectedTessera === placedTessera.id ? 10 : 1
                  }}
                  onContextMenu={(e) => handleTesseraRightClick(e, placedTessera)}
                  onClick={() => setSelectedTessera(
                    selectedTessera === placedTessera.id ? null : placedTessera.id
                  )}
                >
                  <div 
                    className="w-full h-full rounded-lg flex items-center justify-center text-white text-xs font-bold p-1 text-center"
                    style={{ 
                      background: `linear-gradient(135deg, ${colorScheme.primary}, ${colorScheme.secondary})`,
                      boxShadow: 'none',
                      border: selectedTessera === placedTessera.id ? '2px solid #3b82f6' : 'none'
                    }}
                  >
                    {placedTessera.isFlipped 
                      ? placedTessera.tesseraCard.back_text || placedTessera.tesseraCard.title
                      : placedTessera.tesseraCard.title
                    }
                  </div>
                </div>
              );
            })}
          </ResizableWorkspaceTemplate>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu.tesseraId && (
        <HexieContextMenu
          hexieId={contextMenu.tesseraId}
          hexieInstanceId={contextMenu.tesseraId}
          tesseraCardId={placedTesseras.find(t => t.id === contextMenu.tesseraId)?.tesseraCard.id || ''}
          title={placedTesseras.find(t => t.id === contextMenu.tesseraId)?.tesseraCard.title || ''}
          isVisible={contextMenu.isVisible}
          position={contextMenu.position}
          referenceCount={0}
          annotationCount={0}
          userTier={user?.subscription_tier || 'free'}
          userId={user?.id}
          onClose={closeContextMenu}
          onAnnotate={() => console.log('Add annotation')}
          onViewReferences={() => console.log('View references')}
          onRateSeverity={() => console.log('Rate severity')}
          onShare={() => console.log('Share tessera')}
          onEdit={() => console.log('Edit tessera')}
          onContest={() => console.log('Contest card')}
          onDelete={() => {
            if (contextMenu.tesseraId) {
              handleDeleteTessera(contextMenu.tesseraId);
            }
          }}
        />
      )}

      {/* Instructions */}
      <div className="bg-gray-800 border-t border-gray-700 p-3">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-400">
          <span>💡 Click tesseras from the library to add them • Right-click placed tesseras for options • Drag template corners to resize • All tesseras maintain uniform size</span>
        </div>
      </div>
    </div>
  );
}