'use client';

import React, { useState, useRef, useEffect } from 'react';
import { HexagonShape } from '@/components/HexagonShape';
import { Heart, Star, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HexieCard {
  id: string;
  title: string;
  front_text: string;
  back_text: string;
  category: string;
  subscription_tier_required: 'free' | 'basic' | 'premium';
  color_scheme: {
    primary: string;
    secondary: string;
    text: string;
  };
  references?: any[];
  created_at: string;
  updated_at: string;
  created_by?: string;
  is_active: boolean;
}

interface PhysicalHexieLibraryProps {
  hexieLibrary: HexieCard[];
  selectedHexie: string | null;
  onSelectHexie: (hexieId: string | null) => void;
  favorites: string[];
  onToggleFavorite: (hexieId: string) => void;
  onCreateCustom: () => void;
  userTier: 'free' | 'basic' | 'premium';
}

export const PhysicalHexieLibrary: React.FC<PhysicalHexieLibraryProps> = ({
  hexieLibrary,
  selectedHexie,
  onSelectHexie,
  favorites,
  onToggleFavorite,
  onCreateCustom,
  userTier
}) => {
  const [hoveredHexie, setHoveredHexie] = useState<string | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Filter hexies based on current view
  const displayedHexies = showFavorites 
    ? hexieLibrary.filter(h => favorites.includes(h.id))
    : hexieLibrary;

  // Group hexies by category for organization
  const categorizedHexies = displayedHexies.reduce((acc, hexie) => {
    if (!acc[hexie.category]) {
      acc[hexie.category] = [];
    }
    acc[hexie.category].push(hexie);
    return acc;
  }, {} as Record<string, HexieCard[]>);

  return (
    <div className="h-full bg-gradient-to-b from-gray-900 to-gray-800 border-r border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-white">Hexie Cards</h2>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setShowFavorites(!showFavorites)}
              variant="ghost"
              size="sm"
              className={`
                text-xs px-2 py-1 h-7 transition-all duration-200
                ${showFavorites 
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                  : 'text-gray-400 hover:text-red-300 hover:bg-red-500/10'
                }
              `}
            >
              <Heart className={`h-3 w-3 mr-1 ${showFavorites ? 'fill-current' : ''}`} />
              {showFavorites ? 'All' : 'Fav'}
            </Button>
            <Button
              onClick={onCreateCustom}
              variant="ghost"
              size="sm"
              className="text-xs px-2 py-1 h-7 text-blue-300 hover:text-blue-200 hover:bg-blue-500/10"
            >
              <Plus className="h-3 w-3 mr-1" />
              New
            </Button>
          </div>
        </div>
        
        <div className="text-xs text-gray-400">
          {showFavorites ? `${favorites.length} favorites` : `${hexieLibrary.length} cards available`}
        </div>
        
        {showFavorites && favorites.length === 0 && (
          <div className="text-xs text-yellow-400 mt-2">
            💡 Hover over hexies and click the heart to add favorites
          </div>
        )}
      </div>

      {/* Physical Card Layout */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-thin p-3"
        style={{ 
          // Create a physical table-like surface
          background: 'linear-gradient(145deg, #1f2937 0%, #111827 50%, #0f172a 100%)',
          backgroundImage: `
            radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)
          `
        }}
      >
        {Object.keys(categorizedHexies).length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <Heart className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No hexies to display</p>
            {showFavorites && (
              <p className="text-xs mt-1">Add some favorites first!</p>
            )}
          </div>
        ) : (
          Object.entries(categorizedHexies).map(([category, hexies]) => (
            <div key={category} className="mb-6">
              {/* Category Label */}
              <div className="text-xs font-medium text-gray-400 mb-3 px-1 uppercase tracking-wide">
                {category} ({hexies.length})
              </div>
              
              {/* Hexie Cards Grid - Physical Layout */}
              <div className="grid grid-cols-2 gap-3">
                {hexies.map((hexie) => {
                  const isHovered = hoveredHexie === hexie.id;
                  const isSelected = selectedHexie === hexie.id;
                  const isFavorite = favorites.includes(hexie.id);
                  
                  return (
                    <div
                      key={hexie.id}
                      className={`
                        relative transition-all duration-300 cursor-pointer group
                        ${isHovered ? 'z-10 scale-150 shadow-2xl' : 'scale-100'}
                        ${isSelected ? 'ring-2 ring-blue-400 ring-opacity-70' : ''}
                      `}
                      style={{
                        transformOrigin: 'center center',
                        // Add physical card drop shadow
                        filter: isHovered 
                          ? 'drop-shadow(0 10px 20px rgba(0,0,0,0.5)) drop-shadow(0 6px 6px rgba(0,0,0,0.3))'
                          : 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                      }}
                      onMouseEnter={() => setHoveredHexie(hexie.id)}
                      onMouseLeave={() => setHoveredHexie(null)}
                      onClick={() => onSelectHexie(selectedHexie === hexie.id ? null : hexie.id)}
                    >
                      {/* Hexie Card */}
                      <div className={`
                        relative bg-gray-800/90 backdrop-blur-sm rounded-lg overflow-hidden border
                        ${isSelected ? 'border-blue-400' : 'border-gray-600'}
                        ${isHovered ? 'border-blue-300' : ''}
                        transition-all duration-300
                      `}>
                        {/* Mini Hexagon */}
                        <div className="p-2">
                          <HexagonShape
                            frontText={hexie.title}
                            backText={hexie.back_text}
                            colorScheme={hexie.color_scheme}
                            size={isHovered ? 144 : 108}
                            className="mx-auto"
                            showFlipButton={isHovered}
                            isFlipped={false}
                            onFlip={() => {}}
                          />
                        </div>
                        
                        {/* Card Info - Only show when hovered */}
                        {isHovered && (
                          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm p-3 flex flex-col justify-between">
                            <div>
                              <h4 className="text-sm font-semibold text-white mb-1 leading-tight">
                                {hexie.title}
                              </h4>
                              <p className="text-xs text-gray-300 line-clamp-3 leading-relaxed">
                                {hexie.front_text}
                              </p>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex items-center justify-between mt-3">
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleFavorite(hexie.id);
                                }}
                                variant="ghost"
                                size="sm"
                                className={`
                                  h-6 w-6 p-0 transition-all duration-200
                                  ${isFavorite 
                                    ? 'text-red-400 hover:text-red-300' 
                                    : 'text-gray-400 hover:text-red-400'
                                  }
                                `}
                                title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                              >
                                <Heart className={`h-3 w-3 ${isFavorite ? 'fill-current' : ''}`} />
                              </Button>
                              
                              <div className="text-xs text-gray-500">
                                {hexie.category}
                              </div>
                              
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectHexie(hexie.id);
                                }}
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs text-blue-300 hover:text-blue-200 hover:bg-blue-500/10"
                              >
                                Use
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {/* Selection Indicator */}
                        {isSelected && !isHovered && (
                          <div className="absolute top-1 right-1 w-3 h-3 bg-blue-400 rounded-full border-2 border-white"></div>
                        )}
                        
                        {/* Favorite Indicator */}
                        {isFavorite && !isHovered && (
                          <div className="absolute top-1 left-1">
                            <Heart className="h-3 w-3 text-red-400 fill-current" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PhysicalHexieLibrary;