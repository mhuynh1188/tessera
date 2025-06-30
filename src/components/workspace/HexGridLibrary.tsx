'use client';

import React, { useState, useEffect } from 'react';
import { 
  HexGrid, 
  Layout, 
  Hexagon, 
  GridGenerator, 
  HexUtils,
  Text as HexText,
  Pattern
} from 'react-hexgrid';
import { HexieCard } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Heart, 
  Star, 
  Plus, 
  Search,
  Filter,
  Hash,
  Minimize2,
  Maximize2
} from 'lucide-react';
import toast from 'react-hot-toast';

interface HexGridLibraryProps {
  hexieCards: HexieCard[];
  userTier: 'free' | 'basic' | 'premium';
  favorites: string[];
  onHexieSelect: (hexie: HexieCard) => void;
  onToggleFavorite: (hexieId: string) => void;
  onAddToCanvas: (hexie: HexieCard) => void;
  isCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

interface HexieWithPosition extends HexieCard {
  q: number;
  r: number;
  s: number;
}

export const HexGridLibrary: React.FC<HexGridLibraryProps> = ({
  hexieCards,
  userTier,
  favorites,
  onHexieSelect,
  onToggleFavorite,
  onAddToCanvas,
  isCollapsed = false,
  onCollapsedChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedHexie, setSelectedHexie] = useState<string | null>(null);
  const [flippedHexies, setFlippedHexies] = useState<Set<string>>(new Set());
  const [hexiePositions, setHexiePositions] = useState<HexieWithPosition[]>([]);
  const [zoomedHexie, setZoomedHexie] = useState<string | null>(null);
  const [libraryZoom, setLibraryZoom] = useState(1);
  const [libraryPan, setLibraryPan] = useState({ x: 0, y: 0 });
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | 'left' | 'right' | null>(null);

  // Filter hexies based on current filters
  const filteredHexies = React.useMemo(() => {
    let filtered = hexieCards;

    // Filter to show only free tier hexies
    filtered = filtered.filter(hexie => 
      hexie.subscription_tier_required === 'free'
    );

    // Filter by favorites
    if (showFavoritesOnly) {
      filtered = filtered.filter(hexie => favorites.includes(hexie.id));
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(hexie => hexie.category === selectedCategory);
    }

    // Filter by tag
    if (selectedTag !== 'all') {
      filtered = filtered.filter(hexie => 
        hexie.tags?.includes(selectedTag)
      );
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(hexie => 
        hexie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hexie.front_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hexie.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    return filtered;
  }, [hexieCards, userTier, favorites, showFavoritesOnly, selectedCategory, selectedTag, searchTerm]);

  // Generate hex grid positions for filtered hexies
  useEffect(() => {
    // Create a grid layout that fits the available hexies
    const rows = Math.ceil(Math.sqrt(filteredHexies.length));
    const positions = GridGenerator.parallelogram(0, rows - 1, 0, rows - 1);
    
    const hexiesWithPositions = filteredHexies.map((hexie, index) => {
      const position = positions[index] || { q: 0, r: 0, s: 0 };
      return {
        ...hexie,
        q: position.q,
        r: position.r,
        s: position.s
      };
    });

    setHexiePositions(hexiesWithPositions);
  }, [filteredHexies]);

  // Get categories from hexie cards
  const categories = React.useMemo(() => {
    const cats = [...new Set(hexieCards.map(h => h.category))].filter(Boolean);
    return cats.sort();
  }, [hexieCards]);

  // Get unique tags
  const allTags = React.useMemo(() => {
    const tags = new Set<string>();
    hexieCards.forEach(hexie => {
      hexie.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [hexieCards]);

  // Handle hexie click (for selection and zoom)
  const handleHexieClick = (event: any, source: any) => {
    const hexie = source.data as HexieCard;
    setSelectedHexie(selectedHexie === hexie.id ? null : hexie.id);
    onHexieSelect(hexie);
  };

  // Handle hexie flip
  const handleFlipHexie = (hexieId: string) => {
    setFlippedHexies(prev => {
      const newFlipped = new Set(prev);
      if (newFlipped.has(hexieId)) {
        newFlipped.delete(hexieId);
      } else {
        newFlipped.add(hexieId);
      }
      return newFlipped;
    });
  };

  // Handle favorite toggle
  const handleToggleFavorite = (hexieId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleFavorite(hexieId);
    const hexie = hexieCards.find(h => h.id === hexieId);
    const isFavorite = favorites.includes(hexieId);
    toast.success(isFavorite ? `💔 Removed ${hexie?.title} from favorites` : `❤️ Added ${hexie?.title} to favorites`);
  };

  // Handle add to canvas
  const handleAddToCanvas = (hexie: HexieCard, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCanvas(hexie);
    toast.success(`${hexie.title} added to canvas`);
  };

  // Handle hexie click for zoom
  const handleHexieClickZoom = (hexieId: string) => {
    if (zoomedHexie === hexieId) {
      // If already zoomed, close zoom
      setZoomedHexie(null);
    } else {
      // Zoom into the clicked hexie
      setZoomedHexie(hexieId);
    }
  };

  // Handle click outside to close zoom
  const handleBackgroundClick = () => {
    if (zoomedHexie) {
      setZoomedHexie(null);
    }
  };

  // Handle zoom controls
  const handleZoomIn = () => {
    setLibraryZoom(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setLibraryZoom(prev => Math.max(prev / 1.2, 0.5));
  };

  const handleResetView = () => {
    setLibraryZoom(1);
    setLibraryPan({ x: 0, y: 0 });
  };

  // Handle mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setLibraryZoom(prev => Math.min(Math.max(prev * delta, 0.5), 3));
  };

  // Enhanced auto-scroll with left/right support
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (zoomedHexie) return; // Don't auto-scroll when zoomed

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const threshold = 60;

    // Check for edge zones
    const nearLeft = x < threshold;
    const nearRight = x > rect.width - threshold;
    const nearTop = y < threshold;
    const nearBottom = y > rect.height - threshold;

    if (nearLeft) {
      setScrollDirection('left');
    } else if (nearRight) {
      setScrollDirection('right');
    } else if (nearTop) {
      setScrollDirection('up');
    } else if (nearBottom) {
      setScrollDirection('down');
    } else {
      setScrollDirection(null);
    }
  };

  const handleMouseLeave = () => {
    setScrollDirection(null);
  };

  // Auto-scroll effect for all directions
  React.useEffect(() => {
    if (!scrollDirection) return;

    const scrollSpeed = 3;
    const interval = setInterval(() => {
      setLibraryPan(prev => {
        switch (scrollDirection) {
          case 'left':
            return { ...prev, x: prev.x + scrollSpeed };
          case 'right':
            return { ...prev, x: prev.x - scrollSpeed };
          case 'up':
            return { ...prev, y: prev.y + scrollSpeed };
          case 'down':
            return { ...prev, y: prev.y - scrollSpeed };
          default:
            return prev;
        }
      });
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [scrollDirection]);

  // Handle drag start
  const handleDragStart = (event: any, source: any) => {
    const hexie = source.data as HexieCard;
    toast(`Dragging ${hexie.title}`, { duration: 1000 });
  };

  // Handle drag end
  const handleDragEnd = (event: any, source: any, success: boolean) => {
    if (success) {
      const hexie = source.data as HexieCard;
      toast.success(`${hexie.title} added to workspace!`);
    }
  };

  if (isCollapsed) {
    return (
      <div className="w-16 h-full bg-gray-900/95 border-r border-gray-700 flex flex-col">
        <div className="p-2 flex flex-col items-center space-y-2">
          <Button
            onClick={() => onCollapsedChange?.(false)}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
            title="Expand hexies library"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          <div className="text-xs text-gray-500 writing-mode-vertical">
            Hexies Library
          </div>
          <Badge variant="outline" className="text-xs">
            {filteredHexies.length}
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[32rem] h-full bg-gray-900/95 border-r border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Hexies Library</h3>
          <div className="flex items-center space-x-2">
            {/* Zoom Controls */}
            <div className="flex items-center space-x-1 border border-gray-600 rounded px-2 py-1">
              <Button
                onClick={handleZoomOut}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white p-1 h-6 w-6"
                title="Zoom out"
              >
                -
              </Button>
              <span className="text-xs text-gray-400 min-w-[3rem] text-center">
                {Math.round(libraryZoom * 100)}%
              </span>
              <Button
                onClick={handleZoomIn}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white p-1 h-6 w-6"
                title="Zoom in"
              >
                +
              </Button>
              <Button
                onClick={handleResetView}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white p-1 h-6 w-6"
                title="Reset view"
              >
                ⌂
              </Button>
            </div>
            
            <Button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              variant="ghost"
              size="sm"
              className={`${showFavoritesOnly ? 'text-red-400' : 'text-gray-400'} hover:text-red-300`}
              title={showFavoritesOnly ? 'Show all hexies' : 'Show favorites only'}
            >
              <Heart className={`h-4 w-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
            </Button>
            <Button
              onClick={() => onCollapsedChange?.(true)}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
              title="Collapse library"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search hexies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-800 border-gray-600 text-white"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        {allTags.length > 0 && (
          <div className="flex items-center space-x-2">
            <Hash className="h-4 w-4 text-gray-400" />
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm"
            >
              <option value="all">All Tags</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>#{tag}</option>
              ))}
            </select>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>{filteredHexies.length} hexies available</span>
          <span>{favorites.length} favorites</span>
        </div>
      </div>

      {/* Hex Grid Library */}
      <div className="flex-1 overflow-hidden">
        {hexiePositions.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-400 mb-2">No Hexies Found</h4>
            <p className="text-gray-500 text-sm">
              {showFavoritesOnly 
                ? 'No favorites yet. Heart some hexies to save them here!'
                : searchTerm || selectedCategory !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'No hexies available for your subscription tier'
              }
            </p>
          </div>
        ) : (
          <div 
            className="w-full h-full relative" 
            onWheel={handleWheel}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleBackgroundClick}
            style={{ 
              cursor: zoomedHexie ? 'pointer' : 'grab',
              filter: zoomedHexie ? 'blur(2px)' : 'none',
              transition: 'filter 0.3s ease'
            }}
          >
            <HexGrid 
              width="100%" 
              height="100%" 
              viewBox={`${-15 * libraryZoom + libraryPan.x} ${-15 * libraryZoom + libraryPan.y} ${30 * libraryZoom} ${30 * libraryZoom}`}
            >
              <Layout 
                size={{ x: 3 * libraryZoom, y: 3 * libraryZoom }} 
                flat={false} 
                spacing={1.05} 
                origin={{ x: libraryPan.x, y: libraryPan.y }}
                className="hexies-library"
              >
              {hexiePositions.map((hexie) => {
                const isSelected = selectedHexie === hexie.id;
                const isFavorite = favorites.includes(hexie.id);
                const isFlipped = flippedHexies.has(hexie.id);

                return (
                  <Hexagon
                    key={hexie.id}
                    q={hexie.q}
                    r={hexie.r}
                    s={hexie.s}
                    fill={`url(#hexie-${hexie.id})`}
                    className={`hexie-tile ${isSelected ? 'selected' : ''} ${isFavorite ? 'favorite' : ''}`}
                    data={hexie}
                    onMouseDown={(e) => {
                      if (!zoomedHexie) {
                        handleHexieClick(e, { data: hexie });
                      }
                    }}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleHexieClickZoom(hexie.id);
                    }}
                    cellStyle={{
                      cursor: 'pointer',
                      stroke: isSelected ? '#3b82f6' : hexie.color_scheme?.secondary || '#1e40af',
                      strokeWidth: isSelected ? 3 : 1,
                      transition: 'all 0.2s ease',
                      filter: zoomedHexie === hexie.id ? 'brightness(1.4) drop-shadow(0 0 15px rgba(96, 165, 250, 0.8))' : 'brightness(1)',
                      transform: zoomedHexie === hexie.id ? 'scale(1.5)' : 'scale(1)',
                      zIndex: zoomedHexie === hexie.id ? 1000 : 1
                    }}
                  >
                    {/* Hexie content */}
                    <Pattern 
                      id={`hexie-${hexie.id}`} 
                      size={{ x: 4, y: 4 }}
                      fill={hexie.color_scheme?.primary || '#3b82f6'}
                    />
                    
                    {/* Title text - larger and more readable */}
                    <HexText 
                      className="hexie-title"
                      style={{ 
                        fontSize: `${1.2 / libraryZoom}px`,
                        fill: 'white',
                        fontWeight: 'bold',
                        textAnchor: 'middle',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                      }}
                    >
                      {hexie.title.length > 12 ? hexie.title.substring(0, 12) + '...' : hexie.title}
                    </HexText>

                    {/* Favorite indicator */}
                    {isFavorite && (
                      <g transform="translate(1.5, -1.5)">
                        <circle r="0.3" fill="#ef4444" />
                        <text 
                          fontSize="0.4" 
                          fill="white" 
                          textAnchor="middle" 
                          dy="0.1"
                        >
                          ♥
                        </text>
                      </g>
                    )}

                    {/* Selection indicator */}
                    {isSelected && (
                      <g transform="translate(-1.5, -1.5)">
                        <circle r="0.3" fill="#3b82f6" />
                        <text 
                          fontSize="0.4" 
                          fill="white" 
                          textAnchor="middle" 
                          dy="0.1"
                        >
                          ✓
                        </text>
                      </g>
                    )}
                  </Hexagon>
                );
              })}
            </Layout>
          </HexGrid>
          
          {/* Zoomed Hexie Overlay */}
          {zoomedHexie && (() => {
            const zoomedHexieData = hexiePositions.find(h => h.id === zoomedHexie);
            if (!zoomedHexieData) return null;
            
            const isFavorite = favorites.includes(zoomedHexieData.id);
            const isFlipped = flippedHexies.has(zoomedHexieData.id);
            
            return (
              <div 
                className="absolute inset-0 z-[1002] flex items-center justify-center"
                onClick={handleBackgroundClick}
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  backdropFilter: 'blur(4px)'
                }}
              >
                <div 
                  className="relative"
                  onClick={(e) => e.stopPropagation()}
                >
                  <HexGrid width={300} height={300}>
                    <Layout size={{ x: 40, y: 40 }} flat={false} spacing={1.05}>
                      <Hexagon
                        q={0}
                        r={0}
                        s={0}
                        fill={`url(#zoomed-hexie-${zoomedHexieData.id})`}
                        cellStyle={{
                          stroke: '#60a5fa',
                          strokeWidth: 4,
                          filter: 'brightness(1.2) drop-shadow(0 0 20px rgba(96, 165, 250, 0.6))'
                        }}
                      >
                        <Pattern 
                          id={`zoomed-hexie-${zoomedHexieData.id}`} 
                          size={{ x: 8, y: 8 }}
                          fill={zoomedHexieData.color_scheme?.primary || '#3b82f6'}
                        />
                        
                        <HexText 
                          className="zoomed-hexie-title"
                          style={{ 
                            fontSize: '3px',
                            fill: 'white',
                            fontWeight: 'bold',
                            textAnchor: 'middle',
                            textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                          }}
                        >
                          {zoomedHexieData.title}
                        </HexText>
                        
                        <HexText 
                          y={3}
                          className="zoomed-hexie-content"
                          style={{ 
                            fontSize: '1.5px',
                            fill: 'white',
                            textAnchor: 'middle',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                          }}
                        >
                          {isFlipped ? zoomedHexieData.back_text.substring(0, 50) : zoomedHexieData.front_text.substring(0, 50)}
                          {(isFlipped ? zoomedHexieData.back_text : zoomedHexieData.front_text).length > 50 ? '...' : ''}
                        </HexText>
                        
                        {/* Favorite indicator */}
                        {isFavorite && (
                          <g transform="translate(3, -3)">
                            <circle r="0.8" fill="#ef4444" />
                            <text 
                              fontSize="1" 
                              fill="white" 
                              textAnchor="middle" 
                              dy="0.3"
                            >
                              ♥
                            </text>
                          </g>
                        )}
                      </Hexagon>
                    </Layout>
                  </HexGrid>
                  
                  {/* Action buttons for zoomed hexie */}
                  <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    <Button
                      onClick={() => handleFlipHexie(zoomedHexieData.id)}
                      variant="outline"
                      size="sm"
                      className="bg-gray-800/90 text-white border-gray-600 hover:bg-gray-700"
                    >
                      {isFlipped ? 'Front' : 'Back'}
                    </Button>
                    <Button
                      onClick={(e) => handleToggleFavorite(zoomedHexieData.id, e)}
                      variant="outline"
                      size="sm"
                      className={`bg-gray-800/90 border-gray-600 hover:bg-gray-700 ${
                        isFavorite ? 'text-red-400' : 'text-white'
                      }`}
                    >
                      <Heart className={`h-3 w-3 ${isFavorite ? 'fill-current' : ''}`} />
                    </Button>
                    <Button
                      onClick={(e) => handleAddToCanvas(zoomedHexieData, e)}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            );
          })()}
          </div>
        )}
      </div>

      {/* Selected Hexie Details Panel */}
      {selectedHexie && (() => {
        const hexie = hexieCards.find(h => h.id === selectedHexie);
        if (!hexie) return null;
        
        const isFavorite = favorites.includes(hexie.id);
        const isFlipped = flippedHexies.has(hexie.id);

        return (
          <div className="border-t border-gray-700 bg-gray-800/50 p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="text-white font-semibold mb-1">{hexie.title}</h4>
                <Badge variant="outline" className="text-xs text-gray-400">
                  {hexie.category}
                </Badge>
              </div>
              <Button
                onClick={() => setSelectedHexie(null)}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                ×
              </Button>
            </div>

            <div className="text-sm text-gray-300 mb-3 line-clamp-3">
              {isFlipped ? hexie.back_text : hexie.front_text}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => handleFlipHexie(hexie.id)}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  {isFlipped ? 'Front' : 'Back'}
                </Button>
                <Button
                  onClick={(e) => handleToggleFavorite(hexie.id, e)}
                  variant="ghost"
                  size="sm"
                  className={`text-xs ${isFavorite ? 'text-red-400' : 'text-gray-400'}`}
                >
                  <Heart className={`h-3 w-3 ${isFavorite ? 'fill-current' : ''}`} />
                </Button>
              </div>
              <Button
                onClick={(e) => handleAddToCanvas(hexie, e)}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add to Canvas
              </Button>
            </div>
          </div>
        );
      })()}

      {/* Instructions */}
      <div className="p-3 border-t border-gray-700 bg-gray-800/30">
        <div className="text-xs text-gray-400 space-y-1">
          <p>• Click hexies to select and view details</p>
          <p>• Drag hexies to workspace grid to add them</p>
          <p>• Use flip button to see back text</p>
          <p>• Heart icon to add/remove favorites</p>
        </div>
      </div>
    </div>
  );
};

export default HexGridLibrary;