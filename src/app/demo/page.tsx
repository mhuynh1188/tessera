'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Hexagon, 
  Plus, 
  Settings, 
  ArrowRight,
  Target,
  Brain,
  Users,
  Lightbulb,
  Award,
  Shield,
  MessageSquare,
  Zap,
  Save,
  Share2,
  BookOpen
} from 'lucide-react';
import Link from 'next/link';
import { TesseraCard } from '@/types';
import { db } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { generateShareLink, copyToClipboard } from '@/lib/collaboration';

// Import our restored components
import { GameifiedWorkspaceBoard } from '@/components/workspace/GameifiedWorkspaceBoard';
import { TesseraAnnotationSystem } from '@/components/workspace/TesseraAnnotationSystem';
import { AntipatternSeveritySystem } from '@/components/workspace/AntipatternSeveritySystem';
import { HoneycombHexieMenu } from '@/components/workspace/HoneycombHexieMenu';
import { CustomHexieCreator } from '@/components/workspace/CustomHexieCreator';
import { ScenarioLibrary } from '@/components/scenarios/ScenarioLibrary';
import { ScenarioCard } from '@/components/workspace/ScenarioCard';
import { Tooltip } from '@/components/ui/tooltip';
import { DemoWorkspaceTour } from '@/components/tours/DemoWorkspaceTour';
import { WorkspaceToolsTour } from '@/components/tours/WorkspaceToolsTour';
import { TourTrigger } from '@/components/tours/ProductTour';

// Demo tesseras (fallback if database is empty)
const DEMO_TESSERAS: TesseraCard[] = [
  {
    id: 'demo-1',
    title: 'Silent Participants',
    front_text: 'Team members who never speak up in meetings',
    back_text: 'Strategies: Direct questions, breakout rooms, anonymous input tools',
    category: 'Meetings',
    tags: ['communication', 'meetings', 'team-dynamics'],
    subscription_tier_required: 'free',
    color_scheme: { primary: '#ef4444', secondary: '#dc2626', text: '#ffffff' },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: 'admin',
    is_active: true,
    references: [
      {
        id: 'ref-1',
        title: 'The Silent Treatment: Why Some Team Members Don\'t Speak Up',
        url: 'https://hbr.org/2019/06/the-silent-treatment',
        type: 'article',
        authors: 'Amy Edmondson',
        publication: 'Harvard Business Review',
        year: 2019,
        description: 'Research on psychological safety and how to encourage participation in team meetings.'
      },
      {
        id: 'ref-2',
        title: 'Psychological Safety and Learning in Work Teams',
        url: 'https://web.mit.edu/curhan/www/docs/Articles/15341_Readings/Group_Performance/Edmondson%20Psychological%20safety.pdf',
        type: 'research',
        authors: 'Amy Edmondson',
        publication: 'Administrative Science Quarterly',
        year: 1999,
        description: 'Foundational research on psychological safety and its impact on team learning and performance.'
      }
    ]
  },
  {
    id: 'demo-2', 
    title: 'Information Hoarding',
    front_text: 'Key information is held by single individuals',
    back_text: 'Solutions: Knowledge sharing sessions, documentation requirements, redundancy planning',
    category: 'Communication',
    tags: ['communication', 'information-sharing', 'productivity'],
    subscription_tier_required: 'free',
    color_scheme: { primary: '#f59e0b', secondary: '#d97706', text: '#ffffff' },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: 'admin',
    is_active: true
  },
  {
    id: 'demo-3',
    title: 'Meeting Overload',
    front_text: 'Too many meetings with unclear purposes',
    back_text: 'Solutions: Meeting audits, standing agenda templates, time blocking',
    category: 'Meetings',
    tags: ['meetings', 'productivity', 'time-management'],
    subscription_tier_required: 'free',
    color_scheme: { primary: '#8b5cf6', secondary: '#7c3aed', text: '#ffffff' },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: 'admin',
    is_active: true
  },
  {
    id: 'demo-4',
    title: 'Micromanagement',
    front_text: 'Leaders who control every detail and decision',
    back_text: 'Approaches: Trust-building exercises, delegation frameworks, regular check-ins',
    category: 'Leadership',
    tags: ['leadership', 'management', 'trust'],
    subscription_tier_required: 'free', // Changed to free for demo
    color_scheme: { primary: '#10b981', secondary: '#059669', text: '#ffffff' },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: 'admin',
    is_active: true,
    references: [
      {
        id: 'ref-3',
        title: 'The Micromanagement Trap: How to Avoid It and Lead Effectively',
        url: 'https://www.mckinsey.com/business-functions/people-and-organizational-performance/our-insights/the-micromanagement-trap',
        type: 'article',
        authors: 'McKinsey & Company',
        publication: 'McKinsey Insights',
        year: 2020,
        description: 'Practical strategies for leaders to overcome micromanagement tendencies and build trust with their teams.'
      },
      {
        id: 'ref-4',
        title: 'The Trust Factor: The Science of Creating High-Performance Companies',
        url: 'https://www.amazon.com/Trust-Factor-Creating-High-Performance-Companies/dp/0814437540',
        type: 'book',
        authors: 'Paul J. Zak',
        year: 2017,
        description: 'Neuroscientific research on how trust impacts workplace performance and practical approaches to building it.'
      },
      {
        id: 'ref-5',
        title: 'Delegation: The Hidden Art of Leadership',
        url: 'https://www.youtube.com/watch?v=VZkOEZzd5hE',
        type: 'video',
        authors: 'Simon Sinek',
        year: 2018,
        description: 'TEDx talk on effective delegation strategies and overcoming the urge to micromanage.'
      }
    ]
  },
  {
    id: 'demo-5',
    title: 'Analysis Paralysis',
    front_text: 'Over-analyzing decisions instead of taking action',
    back_text: 'Methods: Time-boxed decisions, 70% rule, fail-fast mentality',
    category: 'Decision Making',
    tags: ['decision-making', 'productivity', 'problem-solving'],
    subscription_tier_required: 'free',
    color_scheme: { primary: '#06b6d4', secondary: '#0891b2', text: '#ffffff' },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: 'admin',
    is_active: true
  },
  {
    id: 'demo-6',
    title: 'Blame Culture',
    front_text: 'Focus on finding fault rather than solving problems',
    back_text: 'Solutions: Blameless post-mortems, learning culture, psychological safety',
    category: 'Culture',
    tags: ['culture', 'communication', 'psychological-safety'],
    subscription_tier_required: 'free',
    color_scheme: { primary: '#ec4899', secondary: '#db2777', text: '#ffffff' },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: 'admin',
    is_active: true
  }
];

// Demo workspace configuration
interface DemoWorkspaceBoard {
  id: string;
  name: string;
  description: string;
  session_id?: string;
  game_settings: {
    difficulty_level: 'beginner' | 'intermediate' | 'advanced';
    safety_level: 'high' | 'medium' | 'low';
    intervention_mode: 'individual' | 'collaborative' | 'guided';
    progress_tracking: boolean;
    anonymous_mode: boolean;
  };
  access_level: 'free' | 'basic' | 'premium';
  max_tesseras: number;
  max_annotations: number;
}

interface DemoTesseraInstance {
  id: string;
  tessera_card_id: string;
  position?: { x: number; y: number }; // For legacy support
  q?: number; // HexGrid coordinate
  r?: number; // HexGrid coordinate
  s?: number; // HexGrid coordinate
  rotation: number;
  scale: number;
  is_flipped: boolean;
  z_index: number;
  annotations: any[];
  antipattern_severity?: number;
  card_data: TesseraCard;
}

interface DemoUserCompetency {
  primary_role: 'explorer' | 'analyst' | 'facilitator' | 'architect' | 'mentor';
  competency_scores: {
    pattern_recognition: number;
    emotional_intelligence: number;
    systems_thinking: number;
    intervention_design: number;
    psychological_safety: number;
    group_facilitation: number;
  };
  total_experience: number;
  current_level: number;
  badges_earned: string[];
}

export default function DemoPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'workspace' | 'gameplay' | 'safety' | 'combinations' | 'scenarios'>('workspace');
  
  // Demo workspace state
  const [currentBoard] = useState<DemoWorkspaceBoard>({
    id: 'demo-board',
    name: 'Demo Workspace',
    description: 'Try out tesseras functionality with free antipatterns',
    game_settings: {
      difficulty_level: 'beginner',
      safety_level: 'high',
      intervention_mode: 'individual',
      progress_tracking: true,
      anonymous_mode: false
    },
    access_level: 'free',
    max_tesseras: 10,
    max_annotations: 3
  });
  
  const [tesseraInstances, setTesseraInstances] = useState<DemoTesseraInstance[]>([]);
  const [availableTesseras, setAvailableTesseras] = useState<TesseraCard[]>([]);
  const [selectedTesseraForAdd, setSelectedTesseraForAdd] = useState<TesseraCard | null>(null);
  
  // Demo user state
  const [userCompetency] = useState<DemoUserCompetency>({
    primary_role: 'explorer',
    competency_scores: {
      pattern_recognition: 5,
      emotional_intelligence: 8,
      systems_thinking: 3,
      intervention_design: 0,
      psychological_safety: 10,
      group_facilitation: 0
    },
    total_experience: 50,
    current_level: 1,
    badges_earned: []
  });
  
  // Demo menu state
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false);
  const [showCustomTesseraCreator, setShowCustomTesseraCreator] = useState(false);
  
  // Drag and drop state
  const [draggedTessera, setDraggedTessera] = useState<TesseraCard | null>(null);
  
  // Scenario state
  const [showScenarioLibrary, setShowScenarioLibrary] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<any>(null);
  const [isScenarioMinimized, setIsScenarioMinimized] = useState(false);
  
  // Selection and keyboard state
  const [selectedTesseraInstances, setSelectedTesseraInstances] = useState<string[]>([]);
  
  // Tour state
  const [showTour, setShowTour] = useState(false);
  const [showWorkspaceToolsTour, setShowWorkspaceToolsTour] = useState(false);
  
  const [sessionProgress, setSessionProgress] = useState({
    tesseras_placed: 0,
    patterns_identified: 0,
    interventions_created: 0,
    insights_shared: 0
  });

  useEffect(() => {
    loadDemoData();
  }, []);

  // Keyboard event handling
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle delete/backspace if we're focused on the workspace (not in a form)
      if ((event.key === 'Delete' || event.key === 'Backspace') && 
          selectedTesseraInstances.length > 0 &&
          !['INPUT', 'TEXTAREA', 'SELECT'].includes((event.target as HTMLElement)?.tagName)) {
        
        event.preventDefault();
        handleDeleteSelectedTesseras();
      }

      // ESC to clear selection
      if (event.key === 'Escape') {
        setSelectedTesseraInstances([]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedTesseraInstances]);

  const loadDemoData = async () => {
    try {
      // Try to load free tesseras from database
      let tesseras = await db.getTesseraCards({
        subscription_tier: 'free',
        is_active: true
      });
      
      // If no tesseras in database, use demo data
      if (tesseras.length === 0) {
        tesseras = DEMO_TESSERAS;
        toast('Demo mode: Using sample tesseras data', {
          icon: '🎮',
          duration: 3000,
        });
      } else {
        // Filter to only free tesseras for demo
        tesseras = tesseras.filter(t => t.subscription_tier_required === 'free');
        toast.success('Loaded free tesseras from database!');
      }
      
      setAvailableTesseras(tesseras);
    } catch (error) {
      console.error('Failed to load demo data:', error);
      // Fallback to demo data
      setAvailableTesseras(DEMO_TESSERAS);
      toast.error('Using offline demo data');
    } finally {
      setLoading(false);
    }
  };

  // Handle favorites
  const handleToggleFavorite = (tesseraId: string) => {
    setFavorites(prev => {
      const isFavorite = prev.includes(tesseraId);
      if (isFavorite) {
        return prev.filter(id => id !== tesseraId);
      } else {
        return [...prev, tesseraId];
      }
    });
  };

  // Handle tessera selection from menu
  const handleTesseraMenuSelect = (tessera: TesseraCard) => {
    setSelectedTesseraForAdd(tessera);
    toast(`Selected: ${tessera.title}. Click in workspace to place it.`, {
      icon: '👆',
      duration: 3000,
    });
  };

  // Add tessera to workspace
  const handleAddTessera = (tessera: TesseraCard) => {
    if (tesseraInstances.length >= currentBoard.max_tesseras) {
      toast.error(`Demo limit: Maximum ${currentBoard.max_tesseras} tesseras.`);
      return;
    }

    // Add to free workspace (default mode)
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const libraryWidth = 448;
    const headerHeight = 64;
    
    const centerX = libraryWidth + (viewportWidth - libraryWidth) / 2 - 108;
    const centerY = headerHeight + (viewportHeight - headerHeight) / 2 - 108;
    
    const offsetX = (Math.random() - 0.5) * 100;
    const offsetY = (Math.random() - 0.5) * 100;

    const newInstance: DemoTesseraInstance = {
      id: crypto.randomUUID(), // Generate proper UUID for database compatibility
      tessera_card_id: tessera.id,
      position: { 
        x: Math.max(libraryWidth + 50, centerX + offsetX),
        y: Math.max(headerHeight + 50, centerY + offsetY)
      },
      rotation: 0,
      scale: 1,
      is_flipped: false,
      z_index: tesseraInstances.length,
      annotations: [],
      antipattern_severity: undefined,
      card_data: tessera
    };

    setTesseraInstances(prev => [...prev, newInstance]);
    setSessionProgress(prev => ({
      ...prev,
      tesseras_placed: prev.tesseras_placed + 1
    }));

    toast.success(`${tessera.title} added to demo workspace!`);
  };

  // Drag and drop handlers
  const handleDragStart = (tessera: TesseraCard) => {
    setDraggedTessera(tessera);
  };

  const handleDragEnd = () => {
    setDraggedTessera(null);
  };

  // Handle tessera update
  const handleTesseraUpdate = (updatedTessera: DemoTesseraInstance) => {
    setTesseraInstances(prev => 
      prev.map(t => t.id === updatedTessera.id ? updatedTessera : t)
    );
  };

  // Handle tessera selection
  const handleTesseraSelect = (tesseraId: string, isMultiSelect: boolean = false) => {
    setSelectedTesseraInstances(prev => {
      if (isMultiSelect) {
        // Toggle selection with Ctrl/Cmd
        return prev.includes(tesseraId) 
          ? prev.filter(id => id !== tesseraId)
          : [...prev, tesseraId];
      } else {
        // Single selection
        return [tesseraId];
      }
    });
  };

  // Handle deletion of selected tesseras
  const handleDeleteSelectedTesseras = () => {
    if (selectedTesseraInstances.length === 0) return;

    const tesserasToDelete = selectedTesseraInstances.length;
    
    setTesseraInstances(prev => 
      prev.filter(tessera => !selectedTesseraInstances.includes(tessera.id))
    );
    
    setSelectedTesseraInstances([]);
    
    toast.success(`Removed ${tesserasToDelete} tessera${tesserasToDelete > 1 ? 's' : ''} from workspace`, {
      icon: '🗑️',
      duration: 2000,
    });
  };

  // Handle single tessera deletion
  const handleDeleteTessera = (tesseraId: string) => {
    setTesseraInstances(prev => prev.filter(h => h.id !== tesseraId));
    setSelectedTesseraInstances(prev => prev.filter(id => id !== tesseraId));
    
    toast.success('Tessera removed from workspace', {
      icon: '🗑️',
      duration: 2000,
    });
  };

  // Handle annotation add
  const handleAnnotationAdd = (tesseraId: string, annotation: any) => {
    setTesseraInstances(prev => 
      prev.map(tessera => 
        tessera.id === tesseraId 
          ? { ...tessera, annotations: [...tessera.annotations, { ...annotation, id: crypto.randomUUID() }] }
          : tessera
      )
    );
    
    setSessionProgress(prev => ({
      ...prev,
      insights_shared: prev.insights_shared + 1
    }));
  };

  // Handle safety alert
  const handleSafetyAlert = (alert: any) => {
    console.log('Demo Safety Alert:', alert);
    toast(`Safety reminder: ${alert.type.replace('_', ' ')}`, {
      icon: '🛡️',
      duration: 4000,
    });
  };

  // Handle custom tessera creation
  const handleCustomTesseraCreated = (tessera: TesseraCard) => {
    // Add to available tesseras list
    setAvailableTesseras(prev => [tessera, ...prev]);
    
    // Automatically add to workspace
    handleAddTessera(tessera);
    
    toast.success('Custom tessera created and added to workspace!');
  };

  // Handle scenario selection
  const handleScenarioSelect = (scenario: any) => {
    setSelectedScenario(scenario);
    setShowScenarioLibrary(false);
    setIsScenarioMinimized(false);
    
    // Create tesseras from scenario antipatterns
    createScenarioHexies(scenario);
    
    toast.success(`Scenario loaded: ${scenario.title}`);
  };

  // Create tesseras from scenario antipatterns
  const createScenarioHexies = (scenario: any) => {
    // Clear any existing scenario tesseras first
    setAvailableTesseras(prev => prev.filter(tessera => !tessera.id.startsWith('scenario_')));
    setTesseraInstances(prev => prev.filter(instance => !instance.tessera_card_id.startsWith('scenario_')));

    if (!scenario.key_antipatterns || scenario.key_antipatterns.length === 0) {
      return;
    }

    // Create tesseras for each antipattern
    scenario.key_antipatterns.forEach((antipattern: string, index: number) => {
      // Create a tessera card for each antipattern
      const scenarioTessera: TesseraCard = {
        id: `scenario_${scenario.id}_antipattern_${index}`,
        title: antipattern,
        front_text: `From scenario: ${scenario.title}`,
        back_text: `Antipattern: ${antipattern}\n\nThis pattern commonly appears in ${scenario.setting}`,
        category: 'Scenario',
        tags: ['scenario', 'antipattern', ...scenario.complexity_tags || []],
        subscription_tier_required: 'free',
        color_scheme: { 
          primary: '#dc2626', 
          secondary: '#b91c1c', 
          text: '#ffffff' 
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'scenario',
        is_active: true
      };

      // Add to available tesseras
      setAvailableTesseras(prev => [scenarioTessera, ...prev]);

      // Auto-place the first few antipatterns on the workspace
      if (index < 3 && tesseraInstances.length + index < currentBoard.max_tesseras) {
        setTimeout(() => {
          handleAddTessera(scenarioTessera);
        }, index * 500); // Stagger the placement
      }
    });

    toast.success(`Added ${Math.min(scenario.key_antipatterns.length, 3)} scenario tesseras to workspace!`, {
      icon: '📚',
      duration: 4000,
    });
  };

  // Handle scenario session start
  const handleScenarioSessionStart = (scenario: any) => {
    // In demo mode, minimize the scenario card and add suggested tesseras
    setIsScenarioMinimized(true);
    
    // Add suggested tesseras to the library if they exist
    if (scenario.suggested_tesseras && scenario.suggested_tesseras.length > 0) {
      scenario.suggested_tesseras.forEach((tesseraName: string, index: number) => {
        const suggestedTessera: TesseraCard = {
          id: `scenario_${scenario.id}_suggested_${index}`,
          title: tesseraName,
          front_text: `Suggested for: ${scenario.title}`,
          back_text: `This tessera is recommended for addressing challenges in this scenario. Apply it to navigate workplace dynamics effectively.`,
          category: 'Suggested',
          tags: ['scenario', 'suggested', 'intervention'],
          subscription_tier_required: 'free',
          color_scheme: { 
            primary: '#059669', 
            secondary: '#047857', 
            text: '#ffffff' 
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: 'scenario',
          is_active: true
        };

        setAvailableTesseras(prev => [suggestedTessera, ...prev]);
      });

      toast.success(`Added ${scenario.suggested_tesseras.length} suggested tesseras to library!`, {
        icon: '💡',
        duration: 3000,
      });
    }
    
    toast.success(`Started working with scenario: ${scenario.title}`, {
      icon: '🎯',
      duration: 3000,
    });
  };

  // Handle create custom scenario
  const handleCreateCustomScenario = () => {
    toast('Custom scenario creation available in Premium version!', {
      icon: '⭐',
      duration: 4000,
    });
    
    // Show upgrade prompt after a delay
    setTimeout(() => {
      toast('Upgrade to create unlimited custom scenarios for your team', {
        icon: '🚀',
        duration: 6000,
      });
    }, 2000);
  };

  // Handle share functionality
  const handleShare = async () => {
    try {
      const shareLink = generateShareLink(currentBoard.id, 'demo-user');
      const success = await copyToClipboard(shareLink);
      
      if (success) {
        toast.success('🔗 Share link copied to clipboard!');
        console.log('Share link:', shareLink);
      } else {
        toast.error('Failed to copy link to clipboard');
      }
    } catch (error) {
      console.error('Share error:', error);
      toast.error('Failed to generate share link');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-gray-400 mb-2">Loading Demo Workspace...</h3>
          <p className="text-gray-500">Preparing your tesseras experience</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white overflow-hidden">
      {activeTab === 'workspace' ? (
        <div className="h-full relative">
          {/* Floating Top Bar */}
          <div className="absolute top-0 left-0 right-0 z-30 bg-black/40 backdrop-blur-xl border-b border-white/20 shadow-lg">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Hexagon className="h-6 w-6 text-blue-400" />
                </div>
                <span className="text-lg font-bold text-white">Tessera Demo</span>
                <Badge variant="outline" className="text-yellow-300 border-yellow-500/50 text-xs">
                  Demo Mode
                </Badge>
                <Badge variant="outline" className="text-gray-300 text-xs" data-tour="tessera-stats">
                  {tesseraInstances.length}/{currentBoard.max_tesseras} tesseras
                </Badge>
                {selectedTesseraForAdd && (
                  <Badge variant="secondary" className="bg-blue-600/20 text-blue-300 text-xs">
                    Ready: {selectedTesseraForAdd.title}
                  </Badge>
                )}
                {selectedScenario && (
                  <Badge variant="outline" className="text-orange-300 border-orange-500/50 text-xs">
                    Scenario: {selectedScenario.title}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Tooltip content="Create custom tessera cards">
                  <Button 
                    onClick={() => setShowCustomTesseraCreator(true)}
                    variant="outline" 
                    size="sm" 
                    className="border-green-500 bg-green-500/10 text-green-200 hover:bg-green-500/20 hover:text-green-100 text-sm font-medium"
                    data-tour="create-button"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Create
                  </Button>
                </Tooltip>
                <Tooltip content="Browse and load workplace scenarios">
                  <Button 
                    onClick={() => setActiveTab('scenarios')}
                    variant="outline" 
                    size="sm" 
                    className="border-blue-500 bg-blue-500/10 text-blue-200 hover:bg-blue-500/20 hover:text-blue-100 text-sm font-medium"
                    data-tour="scenarios-button"
                  >
                    <BookOpen className="h-4 w-4 mr-1" />
                    Scenarios
                  </Button>
                </Tooltip>
                <Tooltip content="View demo progress and achievements">
                  <Button 
                    onClick={() => setActiveTab('gameplay')}
                    variant="outline" 
                    size="sm" 
                    className="border-gray-500 bg-gray-500/10 text-gray-200 hover:bg-gray-500/20 hover:text-white text-sm font-medium"
                  >
                    <Award className="h-4 w-4 mr-1" />
                    Progress
                  </Button>
                </Tooltip>
                <Tooltip content="Save workspace (Premium feature)">
                  <Button 
                    onClick={() => toast('Demo mode: Saving not available', {
                      icon: '💾',
                      duration: 2000,
                    })}
                    variant="outline" 
                    size="sm" 
                    className="border-purple-500 bg-purple-500/10 text-purple-200 hover:bg-purple-500/20 hover:text-purple-100 text-sm font-medium"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                </Tooltip>
                <Tooltip content="Share workspace with others">
                  <Button 
                    onClick={handleShare}
                    variant="outline" 
                    size="sm" 
                    className="border-blue-500 bg-blue-500/10 text-blue-200 hover:bg-blue-500/20 hover:text-blue-100 text-sm font-medium"
                  >
                    <Share2 className="h-4 w-4 mr-1" />
                    Share
                  </Button>
                </Tooltip>
                <TourTrigger
                  onStartTour={() => setShowTour(true)}
                  tourKey="demo-workspace"
                  variant="icon"
                  size="sm"
                  className="mr-2"
                />
                <TourTrigger
                  onStartTour={() => setShowWorkspaceToolsTour(true)}
                  tourKey="workspace-tools"
                  variant="button"
                  size="sm"
                  className="mr-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 border-purple-400 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                />
                <Tooltip content="Upgrade to unlock all features">
                  <Link href="/auth/register">
                    <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium shadow-md" data-tour="upgrade-button">
                      <ArrowRight className="h-4 w-4 mr-1" />
                      Upgrade
                    </Button>
                  </Link>
                </Tooltip>
              </div>
            </div>
          </div>

          {/* Floating Hexies Library */}
          <div className="absolute top-16 left-0 bottom-0 z-20" data-tour="tesseras-library">
            <HoneycombHexieMenu
              hexieCards={availableTesseras}
              userTier="free"
              favorites={favorites}
              onHexieSelect={handleTesseraMenuSelect}
              onToggleFavorite={handleToggleFavorite}
              onAddToCanvas={handleAddTessera}
              isCollapsed={isMenuCollapsed}
              onCollapsedChange={setIsMenuCollapsed}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            />
          </div>

          {/* Full Screen Workspace */}
          <div className={`h-full pt-16 ${isMenuCollapsed ? 'pl-16' : 'pl-[28rem]'}`} data-tour="workspace-canvas">
            <GameifiedWorkspaceBoard
              board={currentBoard}
              userCompetency={userCompetency}
              onHexieAdd={handleAddTessera}
              onHexieUpdate={handleTesseraUpdate}
              onAnnotationAdd={handleAnnotationAdd}
              onSafetyAlert={handleSafetyAlert}
              hideHeader={true}
              hexieInstances={tesseraInstances}
              selectedHexieInstances={selectedTesseraInstances}
              onHexieSelect={handleTesseraSelect}
              onHexieDelete={handleDeleteTessera}
            />
          </div>
        </div>
      ) : (
        <div className="h-full flex flex-col">
          {/* Header for other tabs */}
          <div className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Hexagon className="h-8 w-8 text-blue-400" />
                    <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-xl"></div>
                  </div>
                  <div>
                    <span className="text-xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                      Tessera Demo
                    </span>
                    <div className="text-xs text-blue-300/80 font-medium tracking-wide">
                      TESSERA WORKSPACE • LEVEL {userCompetency.current_level}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <Badge variant="outline" className="text-yellow-300 border-yellow-500/50">
                  Demo Mode
                </Badge>
                <Link href="/auth/register">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Get Full Access
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="px-6 py-2">
            <div className="flex space-x-1 p-1 bg-gray-800/50 rounded-lg mb-4">
              {[
                { id: 'workspace', label: 'Workspace', icon: Target },
                { id: 'scenarios', label: 'Scenarios', icon: BookOpen },
                { id: 'gameplay', label: 'Progress', icon: Award },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md transition-all text-sm ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  <tab.icon className="h-3 w-3" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 px-6 overflow-y-auto scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600">
            {activeTab === 'scenarios' && (
              <ScenarioLibrary
                onScenarioSelect={handleScenarioSelect}
                onCreateCustom={handleCreateCustomScenario}
                userTier="free"
              />
            )}

            {activeTab === 'gameplay' && (
              <Card className="bg-gray-800/50 border-gray-700">
                  <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Demo Progress</h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-gray-700/50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-400">{sessionProgress.tesseras_placed}</div>
                      <div className="text-sm text-gray-400">Tesseras Placed</div>
                    </div>
                    <div className="text-center p-4 bg-gray-700/50 rounded-lg">
                      <div className="text-2xl font-bold text-green-400">{sessionProgress.insights_shared}</div>
                      <div className="text-sm text-gray-400">Insights Shared</div>
                    </div>
                    <div className="text-center p-4 bg-gray-700/50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-400">{favorites.length}</div>
                      <div className="text-sm text-gray-400">Favorites</div>
                    </div>
                    <div className="text-center p-4 bg-gray-700/50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-400">{userCompetency.current_level}</div>
                      <div className="text-sm text-gray-400">Demo Level</div>
                    </div>
                  </div>

                  <div className="text-center p-6 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg border border-blue-500/30">
                    <h4 className="text-lg font-semibold text-white mb-2">🚀 Unlock Premium Features</h4>
                    <div className="text-left text-gray-300 mb-4 space-y-2">
                      <p className="flex items-center"><span className="text-purple-400 mr-2">🧠</span> AI-powered pattern analysis & insights</p>
                      <p className="flex items-center"><span className="text-blue-400 mr-2">📊</span> Advanced analytics & reporting</p>
                      <p className="flex items-center"><span className="text-green-400 mr-2">👥</span> Real-time team collaboration</p>
                      <p className="flex items-center"><span className="text-yellow-400 mr-2">⚡</span> Unlimited tesseras & workspaces</p>
                      <p className="flex items-center"><span className="text-red-400 mr-2">🎯</span> Custom intervention templates</p>
                      <p className="flex items-center"><span className="text-indigo-400 mr-2">📹</span> Video collaboration & screen sharing</p>
                    </div>
                    <Link href="/auth/register">
                      <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold">
                        Upgrade to Premium
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Custom Tessera Creator Modal */}
      <CustomHexieCreator
        userTier="free"
        onHexieCreated={handleCustomTesseraCreated}
        onClose={() => setShowCustomTesseraCreator(false)}
        isOpen={showCustomTesseraCreator}
      />

      {/* Scenario Card Overlay */}
      {selectedScenario && (
        <ScenarioCard
          scenario={selectedScenario}
          onClose={() => setSelectedScenario(null)}
          onStartSession={handleScenarioSessionStart}
          isMinimized={isScenarioMinimized}
          onToggleMinimize={() => setIsScenarioMinimized(!isScenarioMinimized)}
        />
      )}

      {/* Product Tour */}
      <DemoWorkspaceTour
        isOpen={showTour}
        onClose={() => setShowTour(false)}
        onComplete={() => {
          console.log('Demo tour completed!');
          setShowTour(false);
        }}
      />

      {/* Workspace Tools Tour */}
      <WorkspaceToolsTour
        isOpen={showWorkspaceToolsTour}
        onClose={() => setShowWorkspaceToolsTour(false)}
        onComplete={() => {
          console.log('Workspace tools tour completed!');
          setShowWorkspaceToolsTour(false);
        }}
      />
    </div>
  );
}