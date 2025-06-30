'use client';

import { useState, useMemo } from 'react';
import { Search, Filter, Lock, Crown, Star, Grid3X3, Hexagon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HexieCard } from '@/types';
import { authService } from '@/lib/auth';

interface HexieLibraryProps {
  hexieCards: HexieCard[];
  userTier: 'free' | 'basic' | 'premium';
  onHexieSelect: (hexie: HexieCard) => void;
}

interface CategoryGroup {
  name: string;
  hexies: HexieCard[];
  color: string;
  icon: string;
}

export default function HexieLibrary({ hexieCards, userTier, onHexieSelect }: HexieLibraryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const categoryGroups = useMemo<CategoryGroup[]>(() => {
    const categories = hexieCards.reduce((acc, hexie) => {
      const category = hexie.category || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(hexie);
      return acc;
    }, {} as Record<string, HexieCard[]>);

    return Object.entries(categories).map(([name, hexies]) => ({
      name,
      hexies,
      color: getColorForCategory(name),
      icon: getIconForCategory(name),
    }));
  }, [hexieCards]);

  const filteredHexies = useMemo(() => {
    let filtered = hexieCards;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(hexie => hexie.category === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(hexie => 
        hexie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hexie.front_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hexie.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    return filtered;
  }, [hexieCards, selectedCategory, searchTerm]);

  const canAccessHexie = (hexie: HexieCard) => {
    return authService.hasSubscriptionAccess(userTier, hexie.subscription_tier_required);
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'premium': return <Crown className="h-3 w-3 text-yellow-500" />;
      case 'basic': return <Star className="h-3 w-3 text-blue-500" />;
      default: return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Library Header */}
      <div className="p-4 border-b space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Hexie Library</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search hexies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Category Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Categories</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Categories</option>
            {categoryGroups.map(group => (
              <option key={group.name} value={group.name}>
                {group.name} ({group.hexies.length})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Hexie Grid/List */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-premium">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredHexies.map((hexie) => {
              const hasAccess = canAccessHexie(hexie);
              return (
                <Card 
                  key={hexie.id} 
                  className={`group cursor-pointer transition-all duration-200 hover:shadow-md ${
                    hasAccess ? 'hover:scale-105' : 'opacity-60'
                  }`}
                  onClick={() => hasAccess && onHexieSelect(hexie)}
                >
                  <CardHeader className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm font-medium truncate">
                          {hexie.title}
                        </CardTitle>
                        <div className="flex items-center mt-1 space-x-1">
                          {getTierIcon(hexie.subscription_tier_required)}
                          <span className="text-xs text-muted-foreground capitalize">
                            {hexie.subscription_tier_required}
                          </span>
                          {!hasAccess && (
                            <Lock className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                      <div 
                        className="w-8 h-8 rounded hexagon flex-shrink-0"
                        style={{ 
                          backgroundColor: hexie.color_scheme?.primary || '#3b82f6',
                          transform: 'scale(0.3)'
                        }}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {hexie.front_text}
                    </p>
                    {hexie.tags && hexie.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {hexie.tags.slice(0, 2).map((tag, index) => (
                          <span 
                            key={index}
                            className="inline-block px-2 py-1 text-xs bg-muted rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                        {hexie.tags.length > 2 && (
                          <span className="text-xs text-muted-foreground">
                            +{hexie.tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredHexies.map((hexie) => {
              const hasAccess = canAccessHexie(hexie);
              return (
                <Card 
                  key={hexie.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-sm ${
                    hasAccess ? 'hover:bg-muted/50' : 'opacity-60'
                  }`}
                  onClick={() => hasAccess && onHexieSelect(hexie)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-6 h-6 rounded hexagon flex-shrink-0"
                        style={{ 
                          backgroundColor: hexie.color_scheme?.primary || '#3b82f6',
                          transform: 'scale(0.4)'
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-medium truncate">{hexie.title}</h3>
                          {getTierIcon(hexie.subscription_tier_required)}
                          {!hasAccess && <Lock className="h-3 w-3 text-muted-foreground" />}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {hexie.front_text}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {filteredHexies.length === 0 && (
          <div className="text-center py-12">
            <Hexagon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Hexies Found</h3>
            <p className="text-muted-foreground text-sm">
              {searchTerm || selectedCategory !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'No hexies available for your subscription tier'
              }
            </p>
          </div>
        )}
      </div>

      {/* Subscription Upsell */}
      {userTier !== 'premium' && (
        <div className="p-4 border-t bg-muted/50">
          <div className="text-center">
            <Crown className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <h3 className="text-sm font-medium mb-1">Unlock More Hexies</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Upgrade to access {userTier === 'free' ? 'basic and premium' : 'premium'} hexies
            </p>
            <Button size="sm" className="btn-primary w-full">
              Upgrade Plan
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function getColorForCategory(category: string): string {
  const colors = {
    'Strategy': '#3b82f6',
    'Innovation': '#8b5cf6',
    'Leadership': '#f59e0b',
    'Communication': '#10b981',
    'Problem Solving': '#ef4444',
    'Team Building': '#06b6d4',
    'default': '#6b7280'
  };
  return colors[category as keyof typeof colors] || colors.default;
}

function getIconForCategory(category: string): string {
  const icons = {
    'Strategy': '🎯',
    'Innovation': '💡',
    'Leadership': '👑',
    'Communication': '💬',
    'Problem Solving': '🔧',
    'Team Building': '🤝',
    'default': '⬡'
  };
  return icons[category as keyof typeof icons] || icons.default;
}