'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Palette,
  Type,
  FileText,
  Tag,
  Save,
  Eye,
  Wand2,
  Crown,
  Lock,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HexagonShape } from '@/components/HexagonShape';
import { TagManager } from './TagManager';
import { HexieCard } from '@/types';
import { db } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

interface CustomHexieCreatorProps {
  userTier: 'free' | 'basic' | 'premium';
  onHexieCreated: (hexie: HexieCard) => void;
  onClose: () => void;
  isOpen: boolean;
}

interface CustomHexieData {
  title: string;
  frontText: string;
  backText: string;
  category: string;
  tags: string[];
  colorScheme: {
    primary: string;
    secondary: string;
    text: string;
  };
}

const predefinedColors = [
  { name: 'Blue', primary: '#3b82f6', secondary: '#1e40af', text: '#ffffff' },
  { name: 'Red', primary: '#ef4444', secondary: '#dc2626', text: '#ffffff' },
  { name: 'Green', primary: '#10b981', secondary: '#059669', text: '#ffffff' },
  { name: 'Purple', primary: '#8b5cf6', secondary: '#7c3aed', text: '#ffffff' },
  { name: 'Orange', primary: '#f59e0b', secondary: '#d97706', text: '#ffffff' },
  { name: 'Pink', primary: '#ec4899', secondary: '#db2777', text: '#ffffff' },
  { name: 'Indigo', primary: '#6366f1', secondary: '#4f46e5', text: '#ffffff' },
  { name: 'Teal', primary: '#14b8a6', secondary: '#0d9488', text: '#ffffff' },
];

const fallbackCategories = [
  'Communication',
  'Meetings', 
  'Leadership',
  'Productivity',
  'Collaboration',
  'Innovation',
  'Culture',
  'Process',
  'Quality',
  'Custom'
];

const aiSuggestions = {
  titles: [
    'Silent Voices',
    'Information Bottleneck',
    'Meeting Fatigue',
    'Decision Paralysis',
    'Scope Creep',
    'Technical Debt',
    'Burnout Pattern',
    'Communication Gap'
  ],
  frontTexts: [
    'Team members avoiding difficult conversations',
    'Critical information trapped in silos',
    'Endless meetings without clear outcomes',
    'Analysis paralysis preventing action',
    'Project requirements constantly expanding'
  ],
  backTexts: [
    'Create safe spaces for open dialogue',
    'Implement knowledge sharing protocols',
    'Establish meeting effectiveness metrics',
    'Set decision-making deadlines and frameworks',
    'Define clear scope boundaries and change processes'
  ]
};

export const CustomHexieCreator: React.FC<CustomHexieCreatorProps> = ({
  userTier,
  onHexieCreated,
  onClose,
  isOpen
}) => {
  const [hexieData, setHexieData] = useState<CustomHexieData>({
    title: '',
    frontText: '',
    backText: '',
    category: 'Custom',
    tags: [],
    colorScheme: predefinedColors[0]
  });

  const [isFlipped, setIsFlipped] = useState(false);
  const [activeStep, setActiveStep] = useState<'content' | 'design' | 'preview'>('content');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Load categories from database
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCategories(true);
        const categories = await db.getCategories();
        setDbCategories(categories || []);
      } catch (error) {
        console.error('Failed to load categories:', error);
        // Fallback to predefined categories
        setDbCategories(fallbackCategories.map(name => ({ name, id: name, color: '#6b7280' })));
        toast.error('Using fallback categories');
      } finally {
        setLoadingCategories(false);
      }
    }
    loadCategories();
  }, []);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setHexieData({
        title: '',
        frontText: '',
        backText: '',
        category: 'Custom',
        tags: [],
        colorScheme: predefinedColors[0]
      });
      setIsFlipped(false);
      setActiveStep('content');
      setErrors({});
    }
  }, [isOpen]);

  // Get categories from database or fallback
  const availableCategories = React.useMemo(() => {
    if (dbCategories.length > 0) {
      return dbCategories.map(cat => cat.name).sort();
    }
    // Fallback to predefined categories
    return fallbackCategories.sort();
  }, [dbCategories]);

  if (!isOpen) return null;

  const getSubscriptionLimits = () => {
    switch (userTier) {
      case 'free':
        return {
          maxCustomHexies: 1,
          maxTitleLength: 30,
          maxTextLength: 100,
          canSavePermanently: false,
          hasAiSuggestions: false,
          hasCustomColors: false
        };
      case 'basic':
        return {
          maxCustomHexies: 5,
          maxTitleLength: 50,
          maxTextLength: 200,
          canSavePermanently: true,
          hasAiSuggestions: true,
          hasCustomColors: false
        };
      case 'premium':
        return {
          maxCustomHexies: 50,
          maxTitleLength: 100,
          maxTextLength: 500,
          canSavePermanently: true,
          hasAiSuggestions: true,
          hasCustomColors: true
        };
    }
  };

  const limits = getSubscriptionLimits();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!hexieData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (hexieData.title.length > limits.maxTitleLength) {
      newErrors.title = `Title must be ${limits.maxTitleLength} characters or less`;
    }

    if (!hexieData.frontText.trim()) {
      newErrors.frontText = 'Front text is required';
    } else if (hexieData.frontText.length > limits.maxTextLength) {
      newErrors.frontText = `Front text must be ${limits.maxTextLength} characters or less`;
    }

    if (!hexieData.backText.trim()) {
      newErrors.backText = 'Back text is required';
    } else if (hexieData.backText.length > limits.maxTextLength) {
      newErrors.backText = `Back text must be ${limits.maxTextLength} characters or less`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      toast.error('Please fix the errors before saving');
      return;
    }

    const newHexie: HexieCard = {
      id: `custom-${Date.now()}`,
      title: hexieData.title,
      front_text: hexieData.frontText,
      back_text: hexieData.backText,
      category: hexieData.category,
      tags: hexieData.tags,
      subscription_tier_required: 'free',
      color_scheme: hexieData.colorScheme,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'current_user',
      is_active: true
    };

    onHexieCreated(newHexie);
    
    if (limits.canSavePermanently) {
      toast.success('Custom hexie created and saved!');
    } else {
      toast.success('Custom hexie created temporarily (upgrade to save permanently)');
    }
    
    onClose();
  };

  const handleAiSuggestion = (field: 'title' | 'frontText' | 'backText') => {
    if (!limits.hasAiSuggestions) {
      toast.error('AI suggestions available in Basic tier and above');
      return;
    }

    const suggestions = field === 'title' ? aiSuggestions.titles :
                      field === 'frontText' ? aiSuggestions.frontTexts :
                      aiSuggestions.backTexts;
    
    const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
    
    setHexieData(prev => ({
      ...prev,
      [field]: randomSuggestion
    }));
    
    toast.success('AI suggestion applied!');
  };

  const renderContentStep = () => (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-white">
            Title *
          </label>
          {limits.hasAiSuggestions && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAiSuggestion('title')}
              className="h-6 text-xs border-gray-600"
            >
              <Wand2 className="h-3 w-3 mr-1" />
              AI Suggest
            </Button>
          )}
        </div>
        <input
          type="text"
          value={hexieData.title}
          onChange={(e) => setHexieData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="e.g., Meeting Overload"
          className="w-full p-3 bg-gray-800 border border-gray-600 rounded text-white"
          maxLength={limits.maxTitleLength}
        />
        <div className="flex justify-between text-xs mt-1">
          <span className={errors.title ? 'text-red-400' : 'text-gray-400'}>
            {errors.title || `${hexieData.title.length}/${limits.maxTitleLength} characters`}
          </span>
        </div>
      </div>

      {/* Front Text */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-white">
            Front Text (Problem Description) *
          </label>
          {limits.hasAiSuggestions && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAiSuggestion('frontText')}
              className="h-6 text-xs border-gray-600"
            >
              <Wand2 className="h-3 w-3 mr-1" />
              AI Suggest
            </Button>
          )}
        </div>
        <textarea
          value={hexieData.frontText}
          onChange={(e) => setHexieData(prev => ({ ...prev, frontText: e.target.value }))}
          placeholder="Describe the workplace challenge or antipattern..."
          className="w-full p-3 bg-gray-800 border border-gray-600 rounded text-white h-24 resize-none"
          maxLength={limits.maxTextLength}
        />
        <div className="flex justify-between text-xs mt-1">
          <span className={errors.frontText ? 'text-red-400' : 'text-gray-400'}>
            {errors.frontText || `${hexieData.frontText.length}/${limits.maxTextLength} characters`}
          </span>
        </div>
      </div>

      {/* Back Text */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-white">
            Back Text (Solution/Strategy) *
          </label>
          {limits.hasAiSuggestions && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAiSuggestion('backText')}
              className="h-6 text-xs border-gray-600"
            >
              <Wand2 className="h-3 w-3 mr-1" />
              AI Suggest
            </Button>
          )}
        </div>
        <textarea
          value={hexieData.backText}
          onChange={(e) => setHexieData(prev => ({ ...prev, backText: e.target.value }))}
          placeholder="Describe solutions, strategies, or interventions..."
          className="w-full p-3 bg-gray-800 border border-gray-600 rounded text-white h-24 resize-none"
          maxLength={limits.maxTextLength}
        />
        <div className="flex justify-between text-xs mt-1">
          <span className={errors.backText ? 'text-red-400' : 'text-gray-400'}>
            {errors.backText || `${hexieData.backText.length}/${limits.maxTextLength} characters`}
          </span>
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Category
        </label>
        <select
          value={hexieData.category}
          onChange={(e) => setHexieData(prev => ({ ...prev, category: e.target.value }))}
          disabled={loadingCategories}
          className="w-full p-3 bg-gray-800 border border-gray-600 rounded text-white disabled:opacity-50"
        >
          {loadingCategories ? (
            <option value="Custom">Loading Categories...</option>
          ) : (
            availableCategories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))
          )}
        </select>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Tags
        </label>
        <TagManager
          selectedTags={hexieData.tags}
          onTagsChange={(tags) => setHexieData(prev => ({ ...prev, tags }))}
          userTier={userTier}
        />
        <p className="text-xs text-gray-400 mt-1">
          Add tags to help categorize and search for this hexie
        </p>
      </div>
    </div>
  );

  const renderDesignStep = () => (
    <div className="space-y-6">
      {/* Color Selection */}
      <div>
        <label className="block text-sm font-medium text-white mb-3">
          Color Scheme
        </label>
        <div className="grid grid-cols-4 gap-3">
          {predefinedColors.map((color, index) => (
            <button
              key={index}
              onClick={() => setHexieData(prev => ({ ...prev, colorScheme: color }))}
              className={`p-3 rounded-lg border-2 transition-all ${
                hexieData.colorScheme.primary === color.primary
                  ? 'border-white scale-105'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
              style={{ backgroundColor: color.primary }}
            >
              <div className="text-white text-xs font-medium">{color.name}</div>
            </button>
          ))}
        </div>
        
        {!limits.hasCustomColors && (
          <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-center">
              <Crown className="h-4 w-4 text-blue-400 mr-2" />
              <div>
                <p className="text-xs text-blue-300 font-medium">Custom Colors</p>
                <p className="text-xs text-gray-400">Available in Premium tier</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderPreviewStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-white mb-4">Preview Your Hexie</h3>
        
        <div className="flex justify-center items-center space-x-4 mb-6">
          <HexagonShape
            size={288}
            title={hexieData.title || 'Your Title'}
            frontText={hexieData.frontText || 'Front text will appear here'}
            backText={hexieData.backText || 'Back text will appear here'}
            color={hexieData.colorScheme.primary}
            borderColor={hexieData.colorScheme.secondary}
            isFlipped={isFlipped}
            onFlip={() => setIsFlipped(!isFlipped)}
          />
        </div>

        <Button
          variant="outline"
          onClick={() => setIsFlipped(!isFlipped)}
          className="border-gray-600 mb-6"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Flip to {isFlipped ? 'Front' : 'Back'}
        </Button>

        {/* Summary */}
        <div className="bg-gray-800/50 rounded-lg p-4 text-left">
          <h4 className="font-semibold text-white mb-2">Hexie Details</h4>
          <div className="space-y-2 text-sm">
            <div><span className="text-gray-400">Title:</span> <span className="text-white">{hexieData.title || 'Not set'}</span></div>
            <div><span className="text-gray-400">Category:</span> <span className="text-white">{hexieData.category}</span></div>
            <div><span className="text-gray-400">Tags:</span> <span className="text-white">{hexieData.tags.length > 0 ? hexieData.tags.join(', ') : 'None'}</span></div>
            <div><span className="text-gray-400">Color:</span> <span className="text-white">{predefinedColors.find(c => c.primary === hexieData.colorScheme.primary)?.name}</span></div>
            <div><span className="text-gray-400">Storage:</span> 
              <span className={limits.canSavePermanently ? 'text-green-400' : 'text-yellow-400'}>
                {limits.canSavePermanently ? ' Permanent' : ' Temporary (session only)'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <CardHeader className="border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl text-white flex items-center">
                <Plus className="h-5 w-5 mr-2" />
                Create Custom Hexie
              </CardTitle>
              <p className="text-gray-400 text-sm mt-1">
                {userTier === 'free' && 'Free tier: 1 temporary hexie'}
                {userTier === 'basic' && 'Basic tier: 5 permanent hexies with AI'}
                {userTier === 'premium' && 'Premium tier: 50 permanent hexies with full features'}
              </p>
            </div>
            <Button variant="ghost" onClick={onClose} className="text-gray-400 hover:text-white">
              ×
            </Button>
          </div>

          {/* Steps */}
          <div className="flex space-x-4 mt-4">
            {[
              { id: 'content', label: 'Content', icon: FileText },
              { id: 'design', label: 'Design', icon: Palette },
              { id: 'preview', label: 'Preview', icon: Eye }
            ].map((step) => {
              const Icon = step.icon;
              return (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(step.id as any)}
                  className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-sm ${
                    activeStep === step.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{step.label}</span>
                </button>
              );
            })}
          </div>
        </CardHeader>

        <CardContent className="p-6 overflow-y-auto max-h-96">
          {activeStep === 'content' && renderContentStep()}
          {activeStep === 'design' && renderDesignStep()}
          {activeStep === 'preview' && renderPreviewStep()}
        </CardContent>

        <div className="border-t border-gray-700 p-4 flex justify-between items-center">
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            {!limits.canSavePermanently && (
              <>
                <Lock className="h-4 w-4" />
                <span>Temporary hexie (upgrade to save permanently)</span>
              </>
            )}
            {limits.canSavePermanently && (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Will be saved permanently</span>
              </>
            )}
          </div>

          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose} className="border-gray-600">
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              <Save className="h-4 w-4 mr-2" />
              Create Hexie
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomHexieCreator;