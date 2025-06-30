'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HexagonShape } from '@/components/HexagonShape';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  Star, 
  Plus, 
  Filter,
  Search,
  Grid3X3,
  Hexagon,
  ChevronDown,
  Minimize2,
  Maximize2,
  Brain,
  Hash
} from 'lucide-react';
import { TesseraCard } from '@/types';
import { authService } from '@/lib/auth';
import { db } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface HoneycombTesseraMenuProps {
  tesseraCards: TesseraCard[];
  userTier: 'free' | 'basic' | 'premium';
  favorites: string[];
  onTesseraSelect: (tessera: TesseraCard) => void;
  onToggleFavorite: (tesseraId: string) => void;
  onAddToCanvas: (tessera: TesseraCard) => void;
  isCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  onDragStart?: (tessera: TesseraCard) => void;
  onDragEnd?: () => void;
}

interface HexPosition {
  x: number;
  y: number;
  row: number;
  col: number;
}

export const HoneycombTesseraMenu: React.FC<HoneycombTesseraMenuProps> = ({
  tesseraCards,
  userTier,
  favorites,
  onTesseraSelect,
  onToggleFavorite,
  onAddToCanvas,
  isCollapsed = false,
  onCollapsedChange,
  onDragStart,
  onDragEnd
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [zoomedTessera, setZoomedTessera] = useState<string | null>(null);
  const [hoveredTesseras, setHoveredTesseras] = useState<Set<string>>(new Set());
  const [tesseraPositions, setTesseraPositions] = useState<Map<string, HexPosition>>(new Map());
  const [flippedTesseras, setFlippedTesseras] = useState<Set<string>>(new Set());
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | 'left' | 'right' | null>(null);
  const [scrollPosition, setScrollPosition] = useState({ current: 0, max: 0 });
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Constants for honeycomb layout - increased by 1.8x for better text readability
  const HEX_SIZE = 162; // 90 * 1.8
  const HEX_SPACING = 12;
  const ZOOMED_HEX_SIZE = 374; // 160 * 1.8 * 1.3 (additional 30%)
  const ROWS_VISIBLE = 8;
  const HEXES_PER_ROW = 6;

  // Filter tesseras based on current filters
  const filteredTesseras = React.useMemo(() => {
    let filtered = tesseraCards;

    // Filter to show only free tier tesseras (as requested)
    filtered = filtered.filter(tessera => 
      tessera.subscription_tier_required === 'free'
    );

    // Filter by favorites
    if (showFavoritesOnly) {
      filtered = filtered.filter(tessera => favorites.includes(tessera.id));
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(tessera => tessera.category === selectedCategory);
    }

    // Filter by tag
    if (selectedTag !== 'all') {
      filtered = filtered.filter(tessera => 
        tessera.tags?.includes(selectedTag)
      );
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(tessera => 
        tessera.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tessera.front_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tessera.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    return filtered;
  }, [tesseraCards, userTier, favorites, showFavoritesOnly, selectedCategory, selectedTag, searchTerm]);

  // Calculate honeycomb positions
  const calculateHoneycombPositions = useCallback(() => {
    const positions = new Map<string, HexPosition>();
    const hexWidth = HEX_SIZE + HEX_SPACING;
    const hexHeight = (HEX_SIZE * Math.sqrt(3) / 2) + HEX_SPACING;
    
    filteredTesseras.forEach((tessera, index) => {
      const row = Math.floor(index / HEXES_PER_ROW);
      const col = index % HEXES_PER_ROW;
      
      // Offset every other row for honeycomb pattern
      const offsetX = (row % 2) * (hexWidth / 2);
      const x = col * hexWidth + offsetX;
      const y = row * hexHeight * 0.75; // Overlap rows for honeycomb effect
      
      positions.set(tessera.id, { x, y, row, col });
    });
    
    setTesseraPositions(positions);
  }, [filteredTesseras, HEX_SIZE, HEX_SPACING]);

  useEffect(() => {
    calculateHoneycombPositions();
  }, [calculateHoneycombPositions]);

  // Load categories from database
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCategories(true);
        const categories = await db.getCategories();
        setDbCategories(categories || []);
      } catch (error) {
        console.error('Failed to load categories:', error);
        // Fallback to extracting from tessera cards
        const fallbackCats = [...new Set(tesseraCards.map(h => h.category))].filter(Boolean);
        setDbCategories(fallbackCats.map(name => ({ name, id: name, color: '#6b7280' })));
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, [tesseraCards]);

  // Get categories from database or fallback to extracted categories
  const categories = React.useMemo(() => {
    if (dbCategories.length > 0) {
      return dbCategories.map(cat => cat.name).sort();
    }
    // Fallback to extracted categories if database categories not loaded
    const cats = [...new Set(tesseraCards.map(h => h.category))].filter(Boolean);
    return cats.sort();
  }, [dbCategories, tesseraCards]);

  // Get unique tags
  const allTags = React.useMemo(() => {
    const tags = new Set<string>();
    tesseraCards.forEach(tessera => {
      tessera.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [tesseraCards]);

  // Handle tessera click for zoom
  const handleTesseraClickZoom = (tesseraId: string) => {
    if (zoomedTessera === tesseraId) {
      // If already zoomed, close zoom
      setZoomedTessera(null);
    } else {
      // Zoom into the clicked tessera
      setZoomedTessera(tesseraId);
    }
  };
  
  // Handle click outside to close zoom
  const handleBackgroundClick = () => {
    if (zoomedTessera) {
      setZoomedTessera(null);
    }
  };

  const handleAddToCanvas = (tessera: TesseraCard, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCanvas(tessera);
    toast.success(`${tessera.title} added to canvas`);
  };

  const handleToggleFavorite = (tesseraId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleFavorite(tesseraId);
    const tessera = tesseraCards.find(h => h.id === tesseraId);
    const isFavorite = favorites.includes(tesseraId);
    toast.success(isFavorite ? `💔 Removed ${tessera?.title} from favorites` : `❤️ Added ${tessera?.title} to favorites`);
  };

  const handleFlipTessera = (tesseraId: string) => {
    setFlippedTesseras(prev => {
      const newFlipped = new Set(prev);
      if (newFlipped.has(tesseraId)) {
        newFlipped.delete(tesseraId);
      } else {
        newFlipped.add(tesseraId);
      }
      return newFlipped;
    });
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, tessera: TesseraCard) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(tessera));
    e.dataTransfer.effectAllowed = 'copy';
    onDragStart?.(tessera);
    toast(`Dragging ${tessera.title}`, { duration: 1000 });
  };

  const handleDragEnd = (e: React.DragEvent) => {
    onDragEnd?.();
  };

  // Enhanced auto-scroll functionality with 4-directional scrolling
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const container = scrollContainerRef.current;
    if (!container || zoomedTessera) return; // Don't scroll when zoomed

    const rect = container.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const x = e.clientX - rect.left;
    const threshold = 60;

    // Check for edge zones for 4-directional scrolling
    const nearLeft = x < threshold;
    const nearRight = x > rect.width - threshold;
    const nearTop = y < threshold;
    const nearBottom = y > rect.height - threshold;

    if (nearLeft && container.scrollLeft > 0) {
      setScrollDirection('left');
    } else if (nearRight && container.scrollLeft < container.scrollWidth - container.clientWidth) {
      setScrollDirection('right');
    } else if (nearTop && container.scrollTop > 0) {
      setScrollDirection('up');
    } else if (nearBottom && container.scrollTop < container.scrollHeight - container.clientHeight) {
      setScrollDirection('down');
    } else {
      setScrollDirection(null);
    }
  }, [zoomedTessera]);

  // Scroll position tracking
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const current = container.scrollTop;
      const max = container.scrollHeight - container.clientHeight;
      setScrollPosition({ current, max });
    };

    container.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial call

    return () => container.removeEventListener('scroll', handleScroll);
  }, [filteredTesseras]);

  // Enhanced auto-scroll effect with 4-directional support
  useEffect(() => {
    if (!scrollDirection || !scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const scrollSpeed = 8;
    
    const scroll = () => {
      switch (scrollDirection) {
        case 'up':
          container.scrollTop = Math.max(0, container.scrollTop - scrollSpeed);
          break;
        case 'down':
          container.scrollTop = Math.min(
            container.scrollHeight - container.clientHeight,
            container.scrollTop + scrollSpeed
          );
          break;
        case 'left':
          container.scrollLeft = Math.max(0, container.scrollLeft - scrollSpeed);
          break;
        case 'right':
          container.scrollLeft = Math.min(
            container.scrollWidth - container.clientWidth,
            container.scrollLeft + scrollSpeed
          );
          break;
      }
    };

    const interval = setInterval(scroll, 16); // ~60fps
    return () => clearInterval(interval);
  }, [scrollDirection]);


  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!scrollContainerRef.current || filteredTesseras.length === 0) return;

      const container = scrollContainerRef.current;
      const hexHeight = (HEX_SIZE * Math.sqrt(3) / 2) + HEX_SPACING;

      switch (e.key) {
        case 'ArrowDown':
        case 'PageDown':
          e.preventDefault();
          const scrollDownAmount = e.key === 'PageDown' ? container.clientHeight * 0.8 : hexHeight;
          container.scrollTop = Math.min(
            container.scrollHeight - container.clientHeight,
            container.scrollTop + scrollDownAmount
          );
          break;

        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault();
          const scrollUpAmount = e.key === 'PageUp' ? container.clientHeight * 0.8 : hexHeight;
          container.scrollTop = Math.max(0, container.scrollTop - scrollUpAmount);
          break;

        case 'Escape':
          e.preventDefault();
          setZoomedTessera(null);
          break;
        case 'Enter':
        case ' ':
          if (zoomedTessera) {
            e.preventDefault();
            const tessera = filteredTesseras.find(h => h.id === zoomedTessera);
            if (tessera) {
              onTesseraSelect(tessera);
            }
          }
          break;
        case 'f':
        case 'F':
          if (zoomedTessera) {
            e.preventDefault();
            handleFlipTessera(zoomedTessera);
          }
          break;
        case 'Home':
          e.preventDefault();
          container.scrollTop = 0;
          break;

        case 'End':
          e.preventDefault();
          container.scrollTop = container.scrollHeight - container.clientHeight;
          break;
      }
    };

    // Only add event listeners when the menu is focused or hovered
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('keydown', handleKeyDown);
      return () => container.removeEventListener('keydown', handleKeyDown);
    }
  }, [filteredTesseras, HEX_SIZE, HEX_SPACING, zoomedTessera]);

  const containerHeight = ROWS_VISIBLE * (HEX_SIZE * Math.sqrt(3) / 2 + HEX_SPACING) * 0.75;

  if (isCollapsed) {
    return (
      <Card className="w-16 h-full bg-gray-900/95 border-gray-700 flex flex-col z-30" data-tessera-library>
        <CardContent className="p-2 flex flex-col items-center space-y-2">
          <Button
            onClick={() => onCollapsedChange?.(false)}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
            title="Expand tessera menu"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          <div className="text-xs text-gray-500 writing-mode-vertical">
            Tessera Menu
          </div>
          <Badge variant="outline" className="text-xs">
            {filteredTesseras.length}
          </Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-[28rem] h-full bg-gray-900/95 border-gray-700 flex flex-col z-30" data-tessera-library>
      {/* Header */}
      <div className="p-4 border-b border-gray-700 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Tessera Library</h3>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              variant="ghost"
              size="sm"
              className={`${showFavoritesOnly ? 'text-red-400' : 'text-gray-400'} hover:text-red-300`}
              title={showFavoritesOnly ? 'Show all tesseras' : 'Show favorites only'}
            >
              <Heart className={`h-4 w-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
            </Button>
            <Button
              onClick={() => onCollapsedChange?.(true)}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
              title="Collapse menu"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tesseras..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
            data-tour="search-input"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            disabled={loadingCategories}
            className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50"
          >
            <option value="all">{loadingCategories ? 'Loading Categories...' : 'All Categories'}</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        {/* Tag Filter */}
        {allTags.length > 0 && (
          <div className="flex items-center space-x-2">
            <Hash className="h-4 w-4 text-gray-400" />
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Tags</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>#{tag}</option>
              ))}
            </select>
          </div>
        )}

        {/* Stats and Navigation Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>{filteredTesseras.length} tesseras available</span>
            <span>{favorites.length} favorites</span>
          </div>
          
          {/* Scroll progress bar */}
          {scrollPosition.max > 0 && (
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <div 
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-200"
                style={{ 
                  width: `${Math.min(100, (scrollPosition.current / scrollPosition.max) * 100)}%` 
                }}
              />
            </div>
          )}
          
          {/* Navigation hints */}
          {filteredTesseras.length > 20 && (
            <div className="text-xs text-gray-500 text-center">
              💡 Hover near edges to auto-scroll • Use mouse wheel or drag scrollbar
            </div>
          )}
        </div>
      </div>

      {/* Honeycomb Grid */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-auto scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600 relative focus:outline-none"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setScrollDirection(null)}
        onClick={handleBackgroundClick}
        tabIndex={0}
        role="grid"
        aria-label="Tessera library grid"
        style={{
          filter: zoomedTessera ? 'blur(1px)' : 'none',
          transition: 'filter 0.3s ease',
          overflowX: 'auto',
          overflowY: 'auto'
        }}
      >
        {/* Scroll indicators for all directions */}
        {scrollDirection === 'up' && (
          <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-blue-500/30 to-transparent z-10 flex items-center justify-center">
            <div className="text-blue-300 text-xs font-medium">▲ Scrolling Up</div>
          </div>
        )}
        {scrollDirection === 'down' && (
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-blue-500/30 to-transparent z-10 flex items-center justify-center">
            <div className="text-blue-300 text-xs font-medium">▼ Scrolling Down</div>
          </div>
        )}
        {scrollDirection === 'left' && (
          <div className="absolute top-0 left-0 bottom-0 w-12 bg-gradient-to-r from-blue-500/30 to-transparent z-10 flex items-center justify-center">
            <div className="text-blue-300 text-xs font-medium transform -rotate-90">◄ Left</div>
          </div>
        )}
        {scrollDirection === 'right' && (
          <div className="absolute top-0 right-0 bottom-0 w-12 bg-gradient-to-l from-blue-500/30 to-transparent z-10 flex items-center justify-center">
            <div className="text-blue-300 text-xs font-medium transform -rotate-90">► Right</div>
          </div>
        )}
      
        <div 
          className="relative p-4"
          style={{ 
            height: Math.max(containerHeight, filteredTesseras.length > 0 ? 
              Math.ceil(filteredTesseras.length / HEXES_PER_ROW) * (HEX_SIZE * Math.sqrt(3) / 2 + HEX_SPACING) * 0.75 + 100 
              : 200),
            width: Math.max(800, HEXES_PER_ROW * (HEX_SIZE + HEX_SPACING) + 200), // Ensure horizontal scrolling
            filter: zoomedTessera ? 'blur(0.5px)' : 'none',
            transition: 'filter 0.3s ease'
          }}
        >
          {filteredTesseras.length === 0 ? (
            <div className="text-center py-12">
              <Hexagon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-400 mb-2">No Tesseras Found</h4>
              <p className="text-gray-500 text-sm">
                {showFavoritesOnly 
                  ? 'No favorites yet. Heart some tesseras to save them here!'
                  : searchTerm || selectedCategory !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'No tesseras available for your subscription tier'
                }
              </p>
            </div>
          ) : (
            filteredTesseras.map((tessera) => {
              const position = tesseraPositions.get(tessera.id);
              if (!position) return null;

              const isZoomed = zoomedTessera === tessera.id;
              const isFavorite = favorites.includes(tessera.id);
              const isFlipped = flippedTesseras.has(tessera.id);
              const isHovered = hoveredTesseras.has(tessera.id);

              return (
                <div
                  key={tessera.id}
                  className={`absolute transition-all duration-200 cursor-pointer group ${
                    isZoomed ? 'opacity-30' : 'opacity-100'
                  }`}
                  style={{
                    left: position.x,
                    top: position.y,
                    zIndex: isZoomed ? 5 : isHovered ? 15 : 10,
                  }}
                  draggable={!isZoomed && !isHovered}
                  onDragStart={(e) => handleDragStart(e, tessera)}
                  onDragEnd={handleDragEnd}
                  onMouseEnter={() => setHoveredTesseras(prev => new Set([...prev, tessera.id]))}
                  onMouseLeave={() => setHoveredTesseras(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(tessera.id);
                    return newSet;
                  })}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isHovered) {
                      handleTesseraClickZoom(tessera.id);
                    }
                  }}
                  onMouseDown={(e) => {
                    // Only handle selection if not zoomed
                    if (!zoomedTessera && !isHovered) {
                      onTesseraSelect(tessera);
                    }
                  }}
                >
                  <div className="relative">
                    <HexagonShape
                      size={HEX_SIZE}
                      color={tessera.color_scheme?.primary || '#3b82f6'}
                      borderColor={tessera.color_scheme?.secondary || '#1e40af'}
                      shadowColor="none"
                      title={tessera.title}
                      frontText={tessera.front_text}
                      backText={tessera.back_text}
                      references={tessera.references || tessera.card_references || []}
                      showFlipButton={false}
                      isFlipped={isFlipped}
                      onFlip={() => handleFlipTessera(tessera.id)}
                      className={`transition-all duration-300 ${
                        isHovered ? 'brightness-110 scale-105' : ''
                      }`}
                    />

                    {/* Quick Action Buttons on Hover */}
                    {isHovered && !isZoomed && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex space-x-1 bg-black/70 backdrop-blur-sm rounded-lg p-1.5">
                          <Button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleToggleFavorite(tessera.id, e);
                            }}
                            size="sm"
                            variant="ghost"
                            className={`h-7 w-7 p-0 rounded-md ${
                              isFavorite 
                                ? 'bg-red-500 text-white hover:bg-red-600' 
                                : 'bg-white/20 text-white hover:bg-white/30'
                            }`}
                            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                          >
                            <Heart className={`h-3 w-3 ${isFavorite ? 'fill-current' : ''}`} />
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleAddToCanvas(tessera, e);
                            }}
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 bg-blue-500 text-white hover:bg-blue-600 rounded-md"
                            title="Add to workspace"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleTesseraClickZoom(tessera.id);
                            }}
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 bg-white/20 text-white hover:bg-white/30 rounded-md"
                            title="Zoom to read more"
                          >
                            <Search className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Favorite indicator */}
                    {isFavorite && !isZoomed && !isHovered && (
                      <div className="absolute -top-0.5 -right-0.5">
                        <Heart className="h-3 w-3 text-red-400 fill-current drop-shadow-lg" />
                      </div>
                    )}

                    {/* Subscription tier indicator */}
                    {tessera.subscription_tier_required !== 'free' && !isZoomed && !isHovered && (
                      <div className="absolute -top-0.5 -left-0.5">
                        <div className={`h-3 w-3 rounded-full ${
                          tessera.subscription_tier_required === 'premium' 
                            ? 'bg-yellow-400' 
                            : 'bg-blue-400'
                        } flex items-center justify-center`}>
                          {tessera.subscription_tier_required === 'premium' ? (
                            <Star className="h-1.5 w-1.5 text-white" />
                          ) : (
                            <div className="h-0.5 w-0.5 bg-white rounded-full" />
                          )}
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Zoomed Tessera Overlay - Fixed Position with Background Blur */}
      {zoomedTessera && (() => {
        const tessera = filteredTesseras.find(h => h.id === zoomedTessera);
        if (!tessera) return null;
        
        const isFlipped = flippedTesseras.has(tessera.id);
        const isFavorite = favorites.includes(tessera.id);

        return (
          <div 
            className="absolute inset-0 z-50 flex items-center justify-center"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              backdropFilter: 'blur(2px)'
            }}
            onClick={handleBackgroundClick}
          >
            <div 
              className="animate-in fade-in zoom-in-95 duration-200"
              onClick={(e) => {
                e.stopPropagation();
                onTesseraSelect(tessera);
              }}
            >
              <HexagonShape
                size={ZOOMED_HEX_SIZE}
                color={tessera.color_scheme?.primary || '#3b82f6'}
                borderColor={tessera.color_scheme?.secondary || '#1e40af'}
                shadowColor="none"
                title={tessera.title}
                frontText={tessera.front_text}
                backText={tessera.back_text}
                references={tessera.references || tessera.card_references || []}
                showFlipButton={true}
                isFlipped={isFlipped}
                onFlip={() => handleFlipTessera(tessera.id)}
                className="cursor-pointer"
              />
              
              {/* Centered Action Buttons with proper handlers */}
              <div className="absolute -bottom-20 left-1/2 transform -translate-x-1/2 flex space-x-2 z-50">
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleFlipTessera(tessera.id);
                  }}
                  variant="outline"
                  size="sm"
                  className="bg-white/95 text-gray-900 border-gray-300 hover:bg-gray-100 shadow-lg font-medium"
                  title={isFlipped ? 'Show front text' : 'Show back text'}
                >
                  {isFlipped ? 'Front' : 'Back'}
                </Button>
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleToggleFavorite(tessera.id, e);
                  }}
                  variant="outline"
                  size="sm"
                  className={`shadow-lg font-medium ${
                    isFavorite 
                      ? 'bg-red-500/95 text-white border-red-400 hover:bg-red-600'
                      : 'bg-white/95 text-gray-900 border-gray-300 hover:bg-gray-100'
                  }`}
                  title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Heart className={`h-3 w-3 ${isFavorite ? 'fill-current' : ''}`} />
                  {isFavorite ? ' Remove' : ' Favorite'}
                </Button>
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAddToCanvas(tessera, e);
                  }}
                  size="sm"
                  className="bg-blue-600/95 hover:bg-blue-700 text-white shadow-lg font-medium"
                  title="Add tessera to workspace"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add to Workspace
                </Button>
              </div>

              {/* Category Badge */}
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                <Badge 
                  variant="secondary" 
                  className="text-sm bg-gray-900/90 text-gray-200 border border-gray-600 shadow-lg"
                >
                  {tessera.category}
                </Badge>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Footer with instructions */}
      <div className="p-3 border-t border-gray-700 bg-gray-800/50">
        <div className="text-xs text-gray-400 space-y-1">
          <p>• Hover tesseras: Quick actions (♥ Favorite, + Add to Workspace, 🔍 Zoom)</p>
          <p>• Click tesseras: Zoom to read full text and flip front/back</p>
          <p>• Auto-scroll: Move mouse near edges (↑↓←→) • Drag tesseras to workspace</p>
        </div>
      </div>
    </Card>
  );
};

export default HoneycombTesseraMenu;