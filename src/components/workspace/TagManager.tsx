'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Tag as TagIcon,
  Plus,
  X,
  Search,
  Hash,
  Check,
  AlertCircle,
  Loader2,
  Edit2,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tag } from '@/types';
import { db } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface TagManagerProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  userTier: 'free' | 'basic' | 'premium';
  className?: string;
}

interface TagSuggestion extends Tag {
  isNew?: boolean;
}

const TAG_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#6b7280', // gray
  '#84cc16', // lime
];

const TAG_LIMITS = {
  free: { maxTags: 3, canCreateTags: false },
  basic: { maxTags: 10, canCreateTags: true },
  premium: { maxTags: 50, canCreateTags: true }
};

export const TagManager: React.FC<TagManagerProps> = ({
  selectedTags,
  onTagsChange,
  userTier,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<TagSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  
  const searchRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const limits = TAG_LIMITS[userTier];

  // Mock data for demo - replace with actual Supabase calls
  const mockTags: Tag[] = [
    {
      id: '1',
      name: 'problem-solving',
      description: 'Techniques and methods for solving workplace problems',
      color: '#3b82f6',
      is_enabled: true,
      created_by: 'admin',
      usage_count: 15,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      name: 'communication',
      description: 'Communication-related patterns and solutions',
      color: '#22c55e',
      is_enabled: true,
      created_by: 'admin',
      usage_count: 23,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '3',
      name: 'leadership',
      description: 'Leadership and management antipatterns',
      color: '#8b5cf6',
      is_enabled: true,
      created_by: 'admin',
      usage_count: 18,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '4',
      name: 'team-dynamics',
      description: 'Team interaction and collaboration issues',
      color: '#ec4899',
      is_enabled: true,
      created_by: 'admin',
      usage_count: 12,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '5',
      name: 'meetings',
      description: 'Meeting-related problems and solutions',
      color: '#f97316',
      is_enabled: true,
      created_by: 'admin',
      usage_count: 20,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '6',
      name: 'productivity',
      description: 'Productivity and efficiency patterns',
      color: '#22c55e',
      is_enabled: true,
      created_by: 'admin',
      usage_count: 16,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '7',
      name: 'culture',
      description: 'Workplace culture and environment issues',
      color: '#06b6d4',
      is_enabled: true,
      created_by: 'admin',
      usage_count: 14,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '8',
      name: 'decision-making',
      description: 'Decision-making processes and patterns',
      color: '#eab308',
      is_enabled: true,
      created_by: 'admin',
      usage_count: 9,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ];

  // Load tags on component mount
  useEffect(() => {
    loadTags();
  }, []);

  // Filter suggestions based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSuggestions(allTags.filter(tag => !selectedTags.includes(tag.name)));
      return;
    }

    const filtered = allTags.filter(tag => 
      tag.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !selectedTags.includes(tag.name)
    );

    // Add "create new tag" suggestion if user can create tags and search doesn't match exactly
    const exactMatch = allTags.some(tag => 
      tag.name.toLowerCase() === searchTerm.toLowerCase()
    );

    if (!exactMatch && limits.canCreateTags && searchTerm.trim()) {
      const newTagSuggestion: TagSuggestion = {
        id: 'new',
        name: searchTerm.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        description: `Create new tag: ${searchTerm}`,
        color: TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)],
        is_enabled: true,
        created_by: 'current_user',
        usage_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        isNew: true
      };
      setSuggestions([newTagSuggestion, ...filtered]);
    } else {
      setSuggestions(filtered);
    }
  }, [searchTerm, allTags, selectedTags, limits.canCreateTags]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const loadTags = async () => {
    setIsLoading(true);
    try {
      const tags = await db.getTags({ 
        enabled_only: true, 
        order_by: 'usage_count' 
      });
      setAllTags(tags);
      console.log('Loaded tags from database:', tags);
    } catch (error) {
      console.error('Failed to load tags:', error);
      // Fallback to mock data for demo
      setAllTags(mockTags);
      console.log('Using mock tags:', mockTags);
      toast('Using demo tags - database not connected', {
        icon: '🏷️',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createTag = async (name: string): Promise<Tag | null> => {
    if (!limits.canCreateTags) {
      toast.error('Tag creation available in Basic tier and above');
      return null;
    }

    setIsCreating(true);
    try {
      const newTag = await db.createTag({
        name,
        description: `User-created tag: ${name}`,
        color: TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)],
        created_by: 'current_user' // TODO: Replace with actual user ID
      });

      setAllTags(prev => [newTag, ...prev]);
      toast.success(`Tag "${newTag.name}" created successfully!`);
      return newTag;
    } catch (error) {
      console.error('Failed to create tag:', error);
      // Fallback to local creation for demo
      const fallbackTag: Tag = {
        id: `demo_${Date.now()}`,
        name: name.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        description: `Demo tag: ${name}`,
        color: TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)],
        is_enabled: true,
        created_by: 'current_user',
        usage_count: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setAllTags(prev => [fallbackTag, ...prev]);
      toast.success(`Tag "${fallbackTag.name}" created locally (demo mode)!`);
      console.log('Created fallback tag:', fallbackTag);
      return fallbackTag;
    } finally {
      setIsCreating(false);
    }
  };

  const handleTagSelect = async (tag: TagSuggestion) => {
    if (selectedTags.length >= limits.maxTags) {
      toast.error(`Maximum ${limits.maxTags} tags allowed for ${userTier} tier`);
      return;
    }

    let tagToAdd = tag;

    if (tag.isNew) {
      const createdTag = await createTag(tag.name);
      if (!createdTag) return;
      tagToAdd = createdTag;
    }

    const newTags = [...selectedTags, tagToAdd.name];
    onTagsChange(newTags);
    setSearchTerm('');
    
    // Update usage count
    if (!tag.isNew) {
      // TODO: Update usage count in Supabase
      setAllTags(prev => prev.map(t => 
        t.id === tag.id ? { ...t, usage_count: t.usage_count + 1 } : t
      ));
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    const newTags = selectedTags.filter(tag => tag !== tagToRemove);
    onTagsChange(newTags);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedTags.map((tagName) => {
            const tag = allTags.find(t => t.name === tagName);
            return (
              <Badge
                key={tagName}
                variant="secondary"
                className="flex items-center space-x-1 pr-1"
                style={{ 
                  backgroundColor: tag?.color ? `${tag.color}20` : '#6b728020',
                  color: tag?.color || '#6b7280',
                  border: `1px solid ${tag?.color || '#6b7280'}40`
                }}
              >
                <TagIcon className="h-3 w-3" />
                <span>{tagName}</span>
                <button
                  onClick={() => handleTagRemove(tagName)}
                  className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}

      {/* Tag Input */}
      <div ref={dropdownRef} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            ref={searchRef}
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            placeholder={selectedTags.length >= limits.maxTags 
              ? `Maximum ${limits.maxTags} tags reached` 
              : "Search or create tags..."
            }
            disabled={selectedTags.length >= limits.maxTags}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
          )}
        </div>

        {/* Tag Suggestions Dropdown */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl max-h-64 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                Loading tags...
              </div>
            ) : suggestions.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                {searchTerm ? (
                  limits.canCreateTags ? (
                    <div>
                      <AlertCircle className="h-4 w-4 mx-auto mb-2" />
                      No matching tags found
                    </div>
                  ) : (
                    <div>
                      <AlertCircle className="h-4 w-4 mx-auto mb-2" />
                      No matching tags found
                      <p className="text-xs mt-1">Tag creation available in Basic tier+</p>
                    </div>
                  )
                ) : (
                  <div>
                    <TagIcon className="h-4 w-4 mx-auto mb-2" />
                    Start typing to search tags
                  </div>
                )}
              </div>
            ) : (
              <div className="py-2">
                {suggestions.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => handleTagSelect(tag)}
                    disabled={isCreating && tag.isNew}
                    className="w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: tag.color }}
                        />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-white font-medium">
                              {tag.isNew ? tag.name : tag.name}
                            </span>
                            {tag.isNew && (
                              <Badge variant="outline" className="text-xs border-green-500 text-green-400">
                                New
                              </Badge>
                            )}
                          </div>
                          {tag.description && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              {tag.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-400">
                        {!tag.isNew && (
                          <span>{tag.usage_count} uses</span>
                        )}
                        {isCreating && tag.isNew && (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Tier Limitation Notice */}
            {userTier === 'free' && (
              <div className="border-t border-gray-600 p-3 bg-blue-500/10">
                <div className="flex items-center space-x-2 text-xs text-blue-300">
                  <AlertCircle className="h-3 w-3" />
                  <span>
                    Free tier: Max {limits.maxTags} tags, no custom creation
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Usage Stats */}
      <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
        <span>
          {selectedTags.length}/{limits.maxTags} tags
        </span>
        <span className="capitalize">
          {userTier} tier
        </span>
      </div>
    </div>
  );
};

export default TagManager;