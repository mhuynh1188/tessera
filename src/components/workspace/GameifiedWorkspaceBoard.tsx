'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Hexagon, 
  Plus, 
  Save, 
  Share2, 
  Settings, 
  Target,
  Brain,
  Shield,
  MessageSquare,
  Lightbulb,
  Users,
  Award,
  Clock,
  AlertTriangle,
  Heart,
  Zap,
  MoreVertical,
  ThumbsUp,
  ThumbsDown,
  Layers,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import { db } from '@/lib/supabase';
import { HexieContextMenu } from './HexieContextMenu';
import { HexagonShape } from '@/components/HexagonShape';
import { StableModal } from '@/components/StableModal';
import { TemplateManager } from './TemplateManager';
import { DrawingTools } from './DrawingToolsFixed';
import EstuarineMapTemplate from './templates/EstuarineMapTemplate';
import { ExternalLink, Library, Video, Headphones, FileText, Microscope, BookOpen, Globe, X, Pen } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';
import { ContestModal } from '@/components/ContestModal';

// Types for the gamified workspace
interface HexieInstance {
  id: string;
  hexie_card_id: string;
  position: { x: number; y: number };
  rotation: number;
  scale: number;
  is_flipped: boolean;
  z_index: number;
  annotations: HexieAnnotation[];
  antipattern_severity?: number;
  card_data: {
    title: string;
    front_text: string;
    back_text: string;
    category: string;
    color_scheme: { primary: string; secondary: string; text: string };
    antipattern_type?: {
      name: string;
      category: string;
      base_severity: number;
      psychological_framework: string;
    };
  };
}

interface HexieAnnotation {
  id: string;
  content: string;
  annotation_type: 'note' | 'question' | 'insight' | 'concern' | 'solution' | 'reflection';
  position: { x: number; y: number };
  style: {
    color: string;
    fontSize: number;
    opacity: number;
    background: string;
  };
  visibility: 'private' | 'team' | 'public';
  is_anonymous: boolean;
  safety_level: 'safe' | 'sensitive' | 'private';
  created_by: string;
  created_at: string;
  votes?: {
    upvotes: number;
    downvotes: number;
    userVote?: 'up' | 'down' | null; // Current user's vote
  };
}

interface WorkspaceBoard {
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
  max_hexies: number;
  max_annotations: number;
}

interface UserCompetency {
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

interface GameifiedWorkspaceBoardProps {
  board: WorkspaceBoard;
  userCompetency: UserCompetency;
  onHexieAdd: (hexie: HexieInstance) => void;
  onHexieUpdate: (hexie: HexieInstance) => void;
  onAnnotationAdd: (hexieId: string, annotation: Omit<HexieAnnotation, 'id' | 'created_at'>) => void;
  onSafetyAlert: (alert: { type: string; severity: number; context: any }) => void;
  hideHeader?: boolean;
  hexieInstances?: HexieInstance[];
  selectedHexieInstances?: string[];
  onHexieSelect?: (hexieId: string, isMultiSelect?: boolean) => void;
  onHexieDelete?: (hexieId: string) => void;
}

export const GameifiedWorkspaceBoard: React.FC<GameifiedWorkspaceBoardProps> = ({
  board,
  userCompetency,
  onHexieAdd,
  onHexieUpdate,
  onAnnotationAdd,
  onSafetyAlert,
  hideHeader = false,
  hexieInstances = [],
  selectedHexieInstances = [],
  onHexieSelect,
  onHexieDelete
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [hexies, setHexies] = useState<HexieInstance[]>(hexieInstances);

  // Sync hexie instances from parent
  useEffect(() => {
    setHexies(hexieInstances);
  }, [hexieInstances]);
  const [selectedHexie, setSelectedHexie] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showAnnotationEditor, setShowAnnotationEditor] = useState(false);
  const [annotationContent, setAnnotationContent] = useState('');
  const [annotationType, setAnnotationType] = useState<HexieAnnotation['annotation_type']>('note');
  const [isAnonymous, setIsAnonymous] = useState(board.game_settings.anonymous_mode);
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    isVisible: boolean;
    hexieId: string | null;
    position: { x: number; y: number };
  }>({
    isVisible: false,
    hexieId: null,
    position: { x: 0, y: 0 }
  });
  
  // Severity rating modal state
  const [showSeverityModal, setShowSeverityModal] = useState(false);
  const [severityHexieId, setSeverityHexieId] = useState<string | null>(null);
  const [newSeverity, setNewSeverity] = useState(1);
  
  // References modal state
  const [showReferencesModal, setShowReferencesModal] = useState(false);
  const [referencesHexieId, setReferencesHexieId] = useState<string | null>(null);
  
  // Template manager state
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<any>(null);
  
  // Contest modal state
  const [showContestModal, setShowContestModal] = useState(false);
  const [contestHexieId, setContestHexieId] = useState<string | null>(null);
  
  // Severity rating data (simplified 1-5 system)
  const [severityRatings, setSeverityRatings] = useState<Map<string, { ratings: number[], average: number }>>(new Map());
  
  // Game state
  const [gamePhase, setGamePhase] = useState<'exploration' | 'identification' | 'analysis' | 'intervention' | 'reflection'>('exploration');
  const [sessionProgress, setSessionProgress] = useState({
    hexies_placed: 0,
    patterns_identified: 0,
    interventions_created: 0,
    insights_shared: 0
  });
  const [psychologicalState, setPsychologicalState] = useState({
    comfort_level: 5,
    engagement_level: 5,
    safety_score: 5,
    stress_indicators: [] as string[]
  });

  // Psychological safety monitoring
  const [safetyMonitor] = useState({
    rapidExitCount: 0,
    stressPatterns: [] as string[],
    lastInteractionTime: Date.now()
  });

  // Alert debouncing to prevent spam
  const [lastAlertTime, setLastAlertTime] = useState<{[key: string]: number}>({});

  // Severity filtering state
  const [severityFilter, setSeverityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'unrated'>('all');
  const [showSeverityFilter, setShowSeverityFilter] = useState(false);

  // Drawing tools state
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [showDrawingToolsPanel, setShowDrawingToolsPanel] = useState(false);

  // Snap to grid function
  const snapToGrid = useCallback((x: number, y: number, gridSize: number = 30) => {
    return {
      x: Math.round(x / gridSize) * gridSize,
      y: Math.round(y / gridSize) * gridSize
    };
  }, []);

  
  // Canvas zoom and pan state
  const [canvasTransform, setCanvasTransform] = useState({
    scale: 1,
    translateX: 0,
    translateY: 0
  });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  
  // Premium features state
  const [showPremiumFeatures, setShowPremiumFeatures] = useState(false);
  const [aiAnalysisResults, setAiAnalysisResults] = useState<any>(null);

  // Canvas zoom and pan handlers
  const handleCanvasWheel = useCallback((e: WheelEvent) => {
    // Check if preventDefault is available before calling it
    if (e.cancelable) {
      e.preventDefault();
    }
    
    const delta = e.deltaY * -0.001;
    const newScale = Math.min(Math.max(0.1, canvasTransform.scale + delta), 3);
    
    setCanvasTransform(prev => ({
      ...prev,
      scale: newScale
    }));
  }, [canvasTransform.scale]);

  // Add wheel event listener with passive: false to enable preventDefault
  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (canvasElement) {
      canvasElement.addEventListener('wheel', handleCanvasWheel, { passive: false });
      return () => {
        canvasElement.removeEventListener('wheel', handleCanvasWheel);
      };
    }
  }, [handleCanvasWheel]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    // In drawing mode, completely prevent canvas interactions
    if (isDrawingMode) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    
    // Check if we're clicking on canvas (not on a hexie or button)
    const target = e.target as HTMLElement;
    const isCanvasClick = target === canvasRef.current || 
                         target.closest('[data-canvas-background]') ||
                         (target.tagName === 'svg' || target.tagName === 'rect' || target.tagName === 'path');
    
    // Don't pan if clicking on hexie, button, or other interactive elements
    const isHexieClick = target.closest('.hexie-container') || 
                        target.closest('button') || 
                        target.closest('[role="button"]');
    
    // Enable panning with space bar pressed, canvas click, or modifier keys
    const shouldPan = (e.button === 0 && ((isSpacePressed && !isHexieClick) || (isCanvasClick && !isHexieClick))) ||
                      (e.button === 1) || 
                      (e.button === 0 && (e.ctrlKey || e.metaKey || e.altKey));
    
    if (shouldPan) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      document.body.style.cursor = 'grabbing';
    }
  }, [isSpacePressed, isDrawingMode]);

  const handleCanvasPan = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      e.preventDefault();
      const deltaX = e.clientX - panStart.x;
      const deltaY = e.clientY - panStart.y;
      
      setCanvasTransform(prev => ({
        ...prev,
        translateX: prev.translateX + deltaX,
        translateY: prev.translateY + deltaY
      }));
      
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  }, [isPanning, panStart]);

  const handleCanvasMouseUp = useCallback(() => {
    setIsPanning(false);
    document.body.style.cursor = '';
  }, []);

  // Reset canvas transform
  const resetCanvasView = useCallback(() => {
    setCanvasTransform({
      scale: 1,
      translateX: 0,
      translateY: 0
    });
  }, []);

  // Enhanced keyboard navigation with space bar grab mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if we're not in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Handle space bar for grab mode
      if (e.key === ' ' && !isSpacePressed) {
        e.preventDefault();
        setIsSpacePressed(true);
        document.body.style.cursor = 'grab';
        return;
      }

      // Handle Escape key to close context menu and clear selections
      if (e.key === 'Escape') {
        e.preventDefault();
        setContextMenu(prev => ({ ...prev, isVisible: false }));
        setSelectedHexie(null);
        setShowAnnotationEditor(false);
        return;
      }

      const panAmount = 50;
      const zoomAmount = 0.1;
      
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          setCanvasTransform(prev => ({
            ...prev,
            translateX: prev.translateX + panAmount
          }));
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          setCanvasTransform(prev => ({
            ...prev,
            translateX: prev.translateX - panAmount
          }));
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          setCanvasTransform(prev => ({
            ...prev,
            translateY: prev.translateY + panAmount
          }));
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          setCanvasTransform(prev => ({
            ...prev,
            translateY: prev.translateY - panAmount
          }));
          break;
        case '=':
        case '+':
          e.preventDefault();
          setCanvasTransform(prev => ({
            ...prev,
            scale: Math.min(3, prev.scale + zoomAmount)
          }));
          break;
        case '-':
        case '_':
          e.preventDefault();
          setCanvasTransform(prev => ({
            ...prev,
            scale: Math.max(0.1, prev.scale - zoomAmount)
          }));
          break;
        case '0':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            resetCanvasView();
          }
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault();
        setIsSpacePressed(false);
        if (!isPanning) {
          document.body.style.cursor = '';
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [resetCanvasView, isSpacePressed, isPanning]);

  // Handle clicks outside context menu to close it
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenu.isVisible) {
        // Check if click is outside context menu
        const target = e.target as HTMLElement;
        const contextMenuElement = target.closest('[data-context-menu]');
        
        if (!contextMenuElement) {
          setContextMenu(prev => ({ ...prev, isVisible: false }));
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [contextMenu.isVisible]);

  // Canvas interaction handlers
  const handleMouseDown = useCallback((e: React.MouseEvent, hexieId: string) => {
    // Don't handle hexie interactions in drawing mode
    if (isDrawingMode) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    
    // Only handle left mouse button for dragging
    if (e.button !== 0) return;
    
    // Don't start dragging if this is a right-click context menu trigger
    if (e.type === 'contextmenu') return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const hexie = hexies.find(h => h.id === hexieId);
    if (!hexie) return;

    setSelectedHexie(hexieId);
    setDragging(hexieId);
    setDragOffset({
      x: e.clientX - rect.left - hexie.position.x,
      y: e.clientY - rect.top - hexie.position.y
    });
    
    // Close context menu when dragging starts
    setContextMenu(prev => ({ ...prev, isVisible: false }));
    
    e.preventDefault();
    e.stopPropagation();
  }, [hexies, isDrawingMode]);

  // Handle right click or long press for context menu
  const handleHexieRightClick = useCallback((e: React.MouseEvent, hexieId: string) => {
    // Don't show context menu in drawing mode
    if (isDrawingMode) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    
    // Always prevent default and stop propagation for right clicks
    e.preventDefault();
    e.stopPropagation();
    
    // Close any existing context menu first
    setContextMenu(prev => ({ ...prev, isVisible: false }));
    
    // Small delay to ensure clean state transition
    setTimeout(() => {
      setContextMenu({
        isVisible: true,
        hexieId,
        position: { x: e.clientX, y: e.clientY }
      });
    }, 10);
  }, [isDrawingMode]);

  // Handle context menu actions
  const handleContextMenuAction = useCallback((action: string, hexieId: string) => {
    const hexie = hexies.find(h => h.id === hexieId);
    if (!hexie) return;

    switch (action) {
      case 'annotate':
        setSelectedHexie(hexieId);
        setShowAnnotationEditor(true);
        break;
      case 'severity':
        // Open severity rating modal
        setSeverityHexieId(hexieId);
        setNewSeverity(hexie.antipattern_severity || 1);
        setShowSeverityModal(true);
        break;
      case 'references':
        // Check if hexie has references
        const references = hexie.card_data?.references || hexie.card_data?.card_references || [];
        if (references.length === 0) {
          toast('No references available for this hexie.', {
            icon: '📚',
            duration: 2000,
          });
          break;
        }

        // Show references modal directly
        setReferencesHexieId(hexieId);
        setShowReferencesModal(true);
        break;
      case 'bookmark':
        toast.success('Hexie bookmarked!');
        break;
      case 'share':
        toast.success('Sharing link copied!');
        break;
      case 'edit':
        toast('Edit functionality coming soon!', {
          icon: '✏️',
          duration: 2000,
        });
        break;
      case 'vote':
        toast.success('Vote recorded!');
        break;
      case 'contest':
        setContestHexieId(hexieId);
        setShowContestModal(true);
        break;
    }
    
    setContextMenu(prev => ({ ...prev, isVisible: false }));
  }, [hexies]);

  // Handle severity rating
  const handleSeverityUpdate = useCallback(() => {
    if (!severityHexieId) return;
    
    const hexie = hexies.find(h => h.id === severityHexieId);
    if (!hexie) return;
    
    // Add new rating and calculate average
    const currentRatings = severityRatings.get(severityHexieId) || { ratings: [], average: 0 };
    const newRatings = [...currentRatings.ratings, newSeverity];
    const average = newRatings.reduce((sum, rating) => sum + rating, 0) / newRatings.length;
    
    setSeverityRatings(prev => new Map(prev.set(severityHexieId, { ratings: newRatings, average })));
    
    const updatedHexie = { ...hexie, antipattern_severity: average };
    setHexies(prev => prev.map(h => 
      h.id === severityHexieId ? updatedHexie : h
    ));
    onHexieUpdate(updatedHexie);
    
    setShowSeverityModal(false);
    setSeverityHexieId(null);
    
    toast.success(`Severity rated ${newSeverity}/5 (avg: ${average.toFixed(1)} from ${newRatings.length} ${newRatings.length === 1 ? 'rating' : 'ratings'})`, {
      duration: 3000,
    });
  }, [severityHexieId, newSeverity, hexies, onHexieUpdate, severityRatings]);

  // Handle voting functionality
  const handleVote = useCallback(async (hexieId: string, voteType: 'up' | 'down') => {
    try {
      // Convert vote types to match database schema (agree/disagree/neutral)
      const dbVoteType = voteType === 'up' ? 'agree' : 'disagree';
      
      // For demo purposes, create a temporary participant ID
      // In a real app, this would come from the session management system
      const participantId = 'demo-participant-' + Math.random().toString(36).substr(2, 9);
      
      // Cast vote using the database service
      await db.castVote(hexieId, participantId, dbVoteType);
      
      // Get updated vote counts to show in toast
      const votes = await db.getHexieVotes(hexieId);
      const agreeVotes = votes.filter(v => v.vote_type === 'agree').length;
      const disagreeVotes = votes.filter(v => v.vote_type === 'disagree').length;
      
      toast.success(`Vote recorded! 👍 ${agreeVotes} 👎 ${disagreeVotes}`, {
        duration: 2000,
      });
    } catch (error) {
      console.error('Failed to save vote:', error);
      toast.error('Failed to save vote. Please try again.');
    }
  }, []);

  // Handle annotation voting
  const handleAnnotationVote = useCallback((hexieId: string, annotationId: string, voteType: 'up' | 'down') => {
    setHexies(prev => prev.map(hexie => {
      if (hexie.id !== hexieId) return hexie;
      
      return {
        ...hexie,
        annotations: hexie.annotations.map(annotation => {
          if (annotation.id !== annotationId) return annotation;
          
          const currentVotes = annotation.votes || { upvotes: 0, downvotes: 0, userVote: null };
          const currentUserVote = currentVotes.userVote;
          
          let newUpvotes = currentVotes.upvotes;
          let newDownvotes = currentVotes.downvotes;
          let newUserVote: 'up' | 'down' | null = voteType;
          
          // Handle vote logic
          if (currentUserVote === voteType) {
            // User is removing their vote
            if (voteType === 'up') {
              newUpvotes--;
            } else {
              newDownvotes--;
            }
            newUserVote = null;
          } else {
            // User is changing or adding their vote
            if (currentUserVote === 'up') {
              newUpvotes--;
            } else if (currentUserVote === 'down') {
              newDownvotes--;
            }
            
            if (voteType === 'up') {
              newUpvotes++;
            } else {
              newDownvotes++;
            }
          }
          
          return {
            ...annotation,
            votes: {
              upvotes: Math.max(0, newUpvotes),
              downvotes: Math.max(0, newDownvotes),
              userVote: newUserVote
            }
          };
        })
      };
    }));
    
    toast.success(`Vote ${voteType === 'up' ? 'up' : 'down'} recorded!`);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const rawPosition = {
      x: e.clientX - rect.left - dragOffset.x,
      y: e.clientY - rect.top - dragOffset.y
    };

    // Apply snap effect
    const snappedPosition = snapToGrid(rawPosition.x, rawPosition.y);

    setHexies(prev => prev.map(hexie => 
      hexie.id === dragging 
        ? { ...hexie, position: snappedPosition }
        : hexie
    ));
    
    e.preventDefault();
  }, [dragging, dragOffset, snapToGrid]);

  const handleMouseUp = useCallback(() => {
    if (dragging) {
      const updatedHexie = hexies.find(h => h.id === dragging);
      if (updatedHexie) {
        onHexieUpdate(updatedHexie);
      }
    }
    setDragging(null);
  }, [dragging, hexies, onHexieUpdate]);

  // Annotation system
  const handleAddAnnotation = useCallback(() => {
    if (!selectedHexie || !annotationContent.trim()) return;

    const annotation: Omit<HexieAnnotation, 'id' | 'created_at'> = {
      content: annotationContent.trim(),
      annotation_type: annotationType,
      position: { x: 0.5, y: 0.5 }, // Center of hexie
      style: {
        color: getAnnotationColor(annotationType),
        fontSize: 14,
        opacity: 0.9,
        background: 'rgba(0,0,0,0.8)'
      },
      visibility: isAnonymous ? 'team' : 'public',
      is_anonymous: isAnonymous,
      safety_level: getSafetyLevel(annotationContent),
      created_by: 'current_user' // Replace with actual user ID
    };

    onAnnotationAdd(selectedHexie, annotation);
    
    // Update local state
    setHexies(prev => prev.map(hexie => 
      hexie.id === selectedHexie 
        ? { ...hexie, annotations: [...hexie.annotations, { ...annotation, id: `temp_${Date.now()}`, created_at: new Date().toISOString() }] }
        : hexie
    ));

    // Update progress
    setSessionProgress(prev => ({
      ...prev,
      insights_shared: prev.insights_shared + 1
    }));

    // Close editor
    setAnnotationContent('');
    setShowAnnotationEditor(false);
    toast.success('Annotation added successfully');
  }, [selectedHexie, annotationContent, annotationType, isAnonymous, onAnnotationAdd]);

  // Helper functions
  const getAnnotationColor = (type: HexieAnnotation['annotation_type']): string => {
    const colors = {
      note: '#fbbf24',
      question: '#3b82f6',
      insight: '#10b981',
      concern: '#ef4444',
      solution: '#8b5cf6',
      reflection: '#f59e0b'
    };
    return colors[type];
  };

  const getSafetyLevel = (content: string): 'safe' | 'sensitive' | 'private' => {
    const sensitiveKeywords = ['stress', 'anxiety', 'difficult', 'struggle', 'problem', 'conflict'];
    const privateKeywords = ['personal', 'private', 'confidential', 'intimate'];
    
    const lowerContent = content.toLowerCase();
    
    if (privateKeywords.some(keyword => lowerContent.includes(keyword))) {
      return 'private';
    }
    if (sensitiveKeywords.some(keyword => lowerContent.includes(keyword))) {
      return 'sensitive';
    }
    return 'safe';
  };

  const getSeverityColor = (severity: number): string => {
    if (severity <= 1.5) return 'text-green-400';
    if (severity <= 2.5) return 'text-yellow-400';
    if (severity <= 3.5) return 'text-orange-400';
    return 'text-red-400';
  };

  const getRoleIcon = (role: UserCompetency['primary_role']) => {
    const icons = {
      explorer: Target,
      analyst: Brain,
      facilitator: Users,
      architect: Lightbulb,
      mentor: Award
    };
    return icons[role];
  };

  // Severity filtering function
  const getFilteredHexies = useCallback(() => {
    if (severityFilter === 'all') {
      return hexies;
    }

    return hexies.filter(hexie => {
      const severity = hexie.antipattern_severity;
      
      switch (severityFilter) {
        case 'unrated':
          return !severity || severity === 0;
        case 'low':
          return severity && severity > 0 && severity <= 2;
        case 'medium':
          return severity && severity > 2 && severity <= 3.5;
        case 'high':
          return severity && severity > 3.5;
        default:
          return true;
      }
    });
  }, [hexies, severityFilter]);

  const filteredHexies = getFilteredHexies();

  // Psychological safety monitoring
  useEffect(() => {
    // Disable for demo mode to prevent spam
    if (board.name?.includes('Demo') || board.id?.includes('demo')) {
      return;
    }

    const checkPsychologicalState = () => {
      const now = Date.now();
      const timeSinceLastInteraction = now - safetyMonitor.lastInteractionTime;
      
      // Detect rapid exit pattern (only alert once per 5 minutes)
      if (timeSinceLastInteraction > 30000 && psychologicalState.engagement_level > 3) {
        const lastAlert = lastAlertTime['rapid_exit'] || 0;
        if (now - lastAlert > 300000) { // 5 minutes
          onSafetyAlert({
            type: 'rapid_exit',
            severity: 2,
            context: { timeSinceLastInteraction, sessionProgress }
          });
          setLastAlertTime(prev => ({ ...prev, rapid_exit: now }));
        }
      }

      // Monitor stress indicators (only alert once per 10 minutes)
      if (psychologicalState.stress_indicators.length > 2) {
        const lastAlert = lastAlertTime['stress_pattern'] || 0;
        if (now - lastAlert > 600000) { // 10 minutes
          onSafetyAlert({
            type: 'stress_pattern',
            severity: psychologicalState.stress_indicators.length > 4 ? 3 : 2,
            context: { indicators: psychologicalState.stress_indicators }
          });
          setLastAlertTime(prev => ({ ...prev, stress_pattern: now }));
        }
      }
    };

    const interval = setInterval(checkPsychologicalState, 30000); // Check every 30 seconds instead of 10
    return () => clearInterval(interval);
  }, [psychologicalState, safetyMonitor, onSafetyAlert, sessionProgress, board.name, board.id, lastAlertTime]);

  const RoleIcon = getRoleIcon(userCompetency.primary_role);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Header with role-based UI */}
      {!hideHeader && (
        <div className="flex items-center justify-between p-4 bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <RoleIcon className="h-6 w-6 text-blue-400" />
            <div>
              <h2 className="text-lg font-bold text-white">{board.name}</h2>
              <p className="text-sm text-gray-400 capitalize">
                {userCompetency.primary_role} • Level {userCompetency.current_level} • {gamePhase} Phase
              </p>
            </div>
          </div>
          
          <Badge 
            variant="secondary" 
            className={`${
              board.game_settings.safety_level === 'high' ? 'bg-green-500/20 text-green-300' :
              board.game_settings.safety_level === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
              'bg-red-500/20 text-red-300'
            }`}
          >
            <Shield className="h-3 w-3 mr-1" />
            {board.game_settings.safety_level} safety
          </Badge>
        </div>

        <div className="flex items-center space-x-2">
          {/* Progress indicators */}
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <Hexagon className="h-4 w-4 text-blue-400" />
              <span className="text-gray-300">{sessionProgress.hexies_placed}/{board.max_hexies}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MessageSquare className="h-4 w-4 text-green-400" />
              <span className="text-gray-300">{sessionProgress.insights_shared}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Heart className={`h-4 w-4 ${psychologicalState.safety_score >= 4 ? 'text-green-400' : psychologicalState.safety_score >= 3 ? 'text-yellow-400' : 'text-red-400'}`} />
              <span className="text-gray-300">{psychologicalState.safety_score}/5</span>
            </div>
          </div>

          <Button size="sm" variant="outline" className="border-gray-600">
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
          
          <Button size="sm" variant="outline" className="border-gray-600">
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
        </div>
        </div>
      )}

      {/* Main workspace area */}
      <div className="flex-1 flex">
        {/* Canvas area */}
        <div 
          ref={canvasRef}
          className={`flex-1 relative overflow-hidden ${
            isPanning ? 'cursor-grabbing' : 
            isSpacePressed ? 'cursor-grab' : 
            'cursor-auto'
          }`}
          onMouseMove={(e) => {
            handleCanvasPan(e);
            handleMouseMove(e);
          }}
          onMouseUp={() => {
            handleCanvasMouseUp();
            handleMouseUp();
          }}
          onMouseLeave={() => {
            handleCanvasMouseUp();
            handleMouseUp();
          }}
          onMouseDown={handleCanvasMouseDown}
          onWheel={handleCanvasWheel}
          style={{ touchAction: 'none' }}
        >
          {/* Canvas background - draggable area */}
          <div 
            className="absolute inset-0 w-full h-full cursor-grab"
            data-canvas-background="true"
            style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
          >
            {/* Static grid pattern when no template (doesn't zoom) */}
            {!currentTemplate && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10">
                <defs>
                  <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                    <path d="M 50 0 L 0 0 0 50" fill="none" stroke="currentColor" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            )}
          </div>

          {/* Canvas content container with transform */}
          <div 
            className="absolute inset-0 w-full h-full"
            style={{
              transform: `translate(${canvasTransform.translateX}px, ${canvasTransform.translateY}px) scale(${canvasTransform.scale})`,
              transformOrigin: '0 0'
            }}
          >
            {/* Template Background - scales with zoom */}
            {currentTemplate && (
              <div className="absolute inset-0 pointer-events-none" style={{ width: '2000px', height: '1500px' }}>
                {currentTemplate.url === 'estuarine-template' ? (
                  <EstuarineMapTemplate 
                    width={1200} 
                    height={800} 
                    className="opacity-40"
                  />
                ) : currentTemplate.type === 'image' || currentTemplate.type === 'svg' ? (
                  <img
                    src={currentTemplate.url}
                    alt={currentTemplate.name}
                    className="w-full h-full object-contain opacity-30"
                    style={{ 
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      zIndex: 0
                    }}
                  />
                ) : currentTemplate.type === 'pdf' ? (
                  <div className="w-full h-full bg-white/5 flex items-center justify-center">
                    <span className="text-gray-400 text-lg">PDF Template Active</span>
                  </div>
                ) : null}
              </div>
            )}
            {/* Hexie instances */}
            {filteredHexies.map((hexie) => (
            <div
              key={hexie.id}
              className={`hexie-container absolute cursor-move transition-all duration-200 group ${
                selectedHexie === hexie.id ? 'ring-2 ring-blue-400 ring-opacity-50' : ''
              } ${selectedHexieInstances.includes(hexie.id) ? 'ring-2 ring-red-400 ring-opacity-75' : ''} ${dragging === hexie.id ? 'z-50' : ''}`}
              style={{
                left: hexie.position.x,
                top: hexie.position.y,
                transform: `rotate(${hexie.rotation}deg) scale(${hexie.scale})`,
                zIndex: hexie.z_index + (selectedHexie === hexie.id ? 1000 : 0)
              }}
              onMouseDown={(e) => handleMouseDown(e, hexie.id)}
              onClick={(e) => {
                setSelectedHexie(hexie.id);
                onHexieSelect?.(hexie.id, e.ctrlKey || e.metaKey);
              }}
              onContextMenu={(e) => handleHexieRightClick(e, hexie.id)}
              onMouseEnter={() => {
                // Hover zoom effect for workspace hexies
                if (!dragging) {
                  setHexies(prev => prev.map(h => 
                    h.id === hexie.id 
                      ? { ...h, scale: 1.1 }
                      : { ...h, scale: 1 }
                  ));
                }
              }}
              onMouseLeave={() => {
                // Reset scale when not hovering
                if (!dragging) {
                  setHexies(prev => prev.map(h => ({ ...h, scale: 1 })));
                }
              }}
            >
              <HexagonShape
                size={216}
                color={hexie.card_data.color_scheme?.primary || '#3b82f6'}
                borderColor={hexie.card_data.color_scheme?.secondary || '#1e40af'}
                title={hexie.card_data.title}
                frontText={hexie.card_data.front_text}
                backText={hexie.card_data.back_text}
                references={hexie.card_data.references || hexie.card_data.card_references || []}
                isFlipped={hexie.is_flipped}
                onFlip={() => {
                  const updatedHexie = { ...hexie, is_flipped: !hexie.is_flipped };
                  setHexies(prev => prev.map(h => 
                    h.id === hexie.id ? updatedHexie : h
                  ));
                  onHexieUpdate(updatedHexie);
                }}
                showFlipButton={selectedHexie === hexie.id}
                className={`transition-all duration-300 ${
                  dragging === hexie.id ? 'opacity-80' : ''
                } ${selectedHexie === hexie.id ? '' : ''}`}
              />

              {/* Annotations indicator (moved to bottom right) */}
              {hexie.annotations.length > 0 && (
                <div className="absolute -bottom-1 -right-1 z-10">
                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold" style={{ fontSize: '10px' }}>{hexie.annotations.length}</span>
                  </div>
                </div>
              )}

              {/* Severity indicator */}
              {hexie.antipattern_severity && (
                <div className="absolute -bottom-1 -left-1 z-10">
                  <div className={`px-1 py-0.5 rounded-full font-bold  ${
                    hexie.antipattern_severity <= 1.5 ? 'bg-green-500 text-white' :
                    hexie.antipattern_severity <= 2.5 ? 'bg-yellow-500 text-black' :
                    hexie.antipattern_severity <= 3.5 ? 'bg-orange-500 text-white' :
                    'bg-red-500 text-white'
                  }`} style={{ fontSize: '10px' }}>
                    {hexie.antipattern_severity.toFixed(1)}
                  </div>
                </div>
              )}

              {/* Quick actions menu button - moved to top left */}
              <div className="absolute -top-2 -left-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <Button
                  size="sm"
                  variant="default"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleHexieRightClick(e, hexie.id);
                  }}
                  className="h-4 w-4 p-0 bg-gray-700/90 hover:bg-gray-600 border border-gray-500  rounded-full"
                  title="More actions"
                >
                  <MoreVertical className="h-2.5 w-2.5 text-white" />
                </Button>
              </div>



              {/* Premium: AI Insights indicator */}
              {board.access_level !== 'free' && hexie.card_data.category && (
                <div className="absolute -top-1 -left-1 z-10">
                  <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center ">
                    <Brain className="h-2 w-2 text-white" />
                  </div>
                </div>
              )}

              {/* Premium: Pattern matching indicator */}
              {board.access_level === 'premium' && hexie.antipattern_severity && hexie.antipattern_severity > 2.5 && (
                <div className="absolute top-0.5 right-0.5 z-10">
                  <div className="px-0.5 py-0.5 bg-yellow-500 rounded font-bold text-black animate-pulse" style={{ fontSize: '8px' }}>
                    ⚡
                  </div>
                </div>
              )}
            </div>
          ))}
          </div>

          {/* Simplified Canvas Controls - Miro style */}
          <div className="absolute bottom-6 right-6 flex flex-col space-y-1 z-40" data-tour="workspace-toolbar">
            <Tooltip content="Zoom in to workspace" position="left">
              <Button
                onClick={() => setCanvasTransform(prev => ({ ...prev, scale: Math.min(3, prev.scale * 1.2) }))}
                size="sm"
                className="bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white w-10 h-10 p-0 rounded-lg  transition-all"
                data-tour="zoom-in-button"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </Tooltip>
            <Tooltip content="Zoom out from workspace" position="left">
              <Button
                onClick={() => setCanvasTransform(prev => ({ ...prev, scale: Math.max(0.1, prev.scale / 1.2) }))}
                size="sm"
                className="bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white w-10 h-10 p-0 rounded-lg  transition-all"
                data-tour="zoom-out-button"
              >
                <span className="text-lg font-bold">−</span>
              </Button>
            </Tooltip>
            <div className="h-px bg-white/20 mx-2"></div>
            <Tooltip content="Reset view to fit all hexies" position="left">
              <Button
                onClick={resetCanvasView}
                size="sm"
                className="bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white w-10 h-10 p-0 rounded-lg  transition-all"
                data-tour="reset-view-button"
              >
                <Target className="h-4 w-4" />
              </Button>
            </Tooltip>
            <div className="h-px bg-white/20 mx-2"></div>
            <Tooltip content="Choose workspace templates and backgrounds" position="left">
              <Button
                onClick={() => setShowTemplateManager(true)}
                size="sm"
                className={`backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white w-10 h-10 p-0 rounded-lg  transition-all ${
                  currentTemplate ? 'bg-blue-500/30' : 'bg-white/10'
                }`}
                data-tour="layers-templates-button"
              >
                <Layers className="h-4 w-4" />
              </Button>
            </Tooltip>
            <div className="h-px bg-white/20 mx-2"></div>
            <Tooltip content="Filter hexies by antipattern severity" position="left">
              <Button
                onClick={() => setShowSeverityFilter(!showSeverityFilter)}
                size="sm"
                className={`backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white w-10 h-10 p-0 rounded-lg  transition-all ${
                  severityFilter !== 'all' ? 'bg-orange-500/30' : 'bg-white/10'
                }`}
                data-tour="severity-filter-button"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </Tooltip>
            <div className="h-px bg-white/20 mx-2"></div>
            <Tooltip content="Draw connections and annotations" position="left">
              <Button
                onClick={() => setShowDrawingToolsPanel(!showDrawingToolsPanel)}
                size="sm"
                className={`backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white w-10 h-10 p-0 rounded-lg  transition-all ${
                  showDrawingToolsPanel ? 'bg-green-500/30' : 'bg-white/10'
                }`}
                data-tour="drawing-tools-button"
              >
                <Pen className="h-4 w-4" />
              </Button>
            </Tooltip>
            <div className="text-xs text-white/70 text-center bg-black/20 backdrop-blur-sm px-2 py-1 rounded mt-2" data-tour="zoom-indicator">
              {Math.round(canvasTransform.scale * 100)}%
            </div>
            <Tooltip content="Delete: Remove selected hexies | Esc: Clear selection | Ctrl+Click: Multi-select" position="left" delay={500}>
              <div className="text-xs text-white/50 text-center bg-black/20 backdrop-blur-sm px-2 py-1 rounded mt-1 cursor-help" data-tour="keyboard-shortcuts">
                ⌨️ Keys
              </div>
            </Tooltip>
          </div>
        </div>

        {/* Side panel - only show when adding annotations */}
        {selectedHexie && showAnnotationEditor && (
          <div className="w-64 bg-black/30 backdrop-blur-sm border-l border-white/10 p-3 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Add Annotation</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowAnnotationEditor(false);
                    setSelectedHexie(null);
                  }}
                  className="text-gray-400 hover:text-white h-6 w-6 p-0"
                >
                  ×
                </Button>
              </div>
              
              {/* Annotation editor */}
              <div className="space-y-3">
                
                <select
                  value={annotationType}
                  onChange={(e) => setAnnotationType(e.target.value as any)}
                  className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                >
                  <option value="note">💭 Note</option>
                  <option value="question">❓ Question</option>
                  <option value="insight">💡 Insight</option>
                  <option value="concern">⚠️ Concern</option>
                  <option value="solution">✅ Solution</option>
                  <option value="reflection">🤔 Reflection</option>
                </select>

                <textarea
                  value={annotationContent}
                  onChange={(e) => setAnnotationContent(e.target.value)}
                  placeholder="Share your thoughts, insights, or questions..."
                  className="w-full p-3 bg-gray-800 border border-gray-600 rounded text-white text-sm resize-none"
                  rows={3}
                  maxLength={board.access_level === 'free' ? 100 : 500}
                />

                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 text-sm text-gray-400">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="rounded"
                    />
                    <span>Anonymous</span>
                  </label>
                  
                  <Button 
                    size="sm" 
                    onClick={handleAddAnnotation}
                    disabled={!annotationContent.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>

                <div className="text-xs text-gray-500">
                  {annotationContent.length}/{board.access_level === 'free' ? 100 : 500} characters
                </div>
              </div>

              {/* Existing annotations */}
              {(() => {
                const hexie = hexies.find(h => h.id === selectedHexie);
                return hexie?.annotations.length ? (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-300">Existing Annotations</h4>
                    {hexie.annotations.map((annotation) => (
                      <div 
                        key={annotation.id}
                        className="p-2 bg-gray-800/50 rounded border border-gray-700"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span 
                            className="text-xs px-2 py-1 rounded"
                            style={{ backgroundColor: annotation.style.color + '20', color: annotation.style.color }}
                          >
                            {annotation.annotation_type}
                          </span>
                          <span className="text-xs text-gray-500">
                            {annotation.is_anonymous ? 'Anonymous' : 'You'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 mb-2">{annotation.content}</p>
                        
                        {/* Voting buttons */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleAnnotationVote(selectedHexie!, annotation.id, 'up')}
                              className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors ${
                                annotation.votes?.userVote === 'up'
                                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                  : 'bg-gray-700/50 text-gray-400 hover:bg-green-500/10 hover:text-green-400'
                              }`}
                              title="Vote up"
                            >
                              <ThumbsUp className="h-3 w-3" />
                              <span>{annotation.votes?.upvotes || 0}</span>
                            </button>
                            <button
                              onClick={() => handleAnnotationVote(selectedHexie!, annotation.id, 'down')}
                              className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors ${
                                annotation.votes?.userVote === 'down'
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                  : 'bg-gray-700/50 text-gray-400 hover:bg-red-500/10 hover:text-red-400'
                              }`}
                              title="Vote down"
                            >
                              <ThumbsDown className="h-3 w-3" />
                              <span>{annotation.votes?.downvotes || 0}</span>
                            </button>
                          </div>
                          
                          {/* Vote score display */}
                          {annotation.votes && (annotation.votes.upvotes > 0 || annotation.votes.downvotes > 0) && (
                            <div className="text-xs text-gray-500">
                              Score: {(annotation.votes.upvotes || 0) - (annotation.votes.downvotes || 0)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null;
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Bottom status bar */}
      <div className="px-4 py-2 bg-black/30 backdrop-blur-sm border-t border-white/10 flex items-center justify-between text-sm">
        <div className="flex items-center space-x-4 text-gray-400">
          <span>{hexies.length} hexies placed</span>
          <span>•</span>
          <span className="capitalize">{gamePhase} phase</span>
          <span>•</span>
          <span>{sessionProgress.insights_shared} insights shared</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-gray-400">5 min session</span>
          </div>
          
          {psychologicalState.stress_indicators.length > 0 && (
            <div className="flex items-center space-x-1 text-yellow-400">
              <AlertTriangle className="h-4 w-4" />
              <span>Mindful moment suggested</span>
            </div>
          )}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu.isVisible && contextMenu.hexieId && (
        <HexieContextMenu
          hexieId={contextMenu.hexieId}
          title={hexies.find(h => h.id === contextMenu.hexieId)?.card_data.title || ''}
          isVisible={contextMenu.isVisible}
          position={contextMenu.position}
          referenceCount={(() => {
            const hexie = hexies.find(h => h.id === contextMenu.hexieId);
            const references = hexie?.card_data?.references || hexie?.card_data?.card_references || [];
            return references.length;
          })()}
          annotationCount={hexies.find(h => h.id === contextMenu.hexieId)?.annotations.length || 0}
          severityScore={hexies.find(h => h.id === contextMenu.hexieId)?.antipattern_severity}
          userTier={board.access_level}
          onClose={() => setContextMenu(prev => ({ ...prev, isVisible: false }))}
          onAnnotate={() => handleContextMenuAction('annotate', contextMenu.hexieId!)}
          onViewReferences={() => handleContextMenuAction('references', contextMenu.hexieId!)}
          onRateSeverity={() => handleContextMenuAction('severity', contextMenu.hexieId!)}
          onBookmark={() => handleContextMenuAction('bookmark', contextMenu.hexieId!)}
          onShare={() => handleContextMenuAction('share', contextMenu.hexieId!)}
          onEdit={() => handleContextMenuAction('edit', contextMenu.hexieId!)}
          onVote={(type) => handleVote(contextMenu.hexieId!, type)}
          onContest={() => handleContextMenuAction('contest', contextMenu.hexieId!)}
          onDelete={() => onHexieDelete?.(contextMenu.hexieId!)}
        />
      )}

      {/* Premium Features Notification */}
      {board.access_level !== 'free' && hexies.length >= 5 && (
        <div className="absolute top-4 right-4 z-50">
          <div className="bg-gradient-to-r from-purple-600/90 to-blue-600/90 backdrop-blur-sm rounded-lg p-3  border border-purple-500/30">
            <div className="flex items-center space-x-2 text-white">
              <Brain className="h-5 w-5 text-purple-300" />
              <div className="text-sm">
                <div className="font-semibold">AI Analysis Ready</div>
                <div className="text-xs text-purple-200">Premium patterns detected</div>
              </div>
              <Button
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-0 h-6 px-2 text-xs"
                onClick={() => {
                  setAiAnalysisResults({
                    patterns: ['High stress cluster', 'Communication gaps'],
                    recommendations: ['Team retrospective', 'Leadership coaching']
                  });
                }}
              >
                Analyze
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* AI Analysis Results Modal */}
      {aiAnalysisResults && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-60">
          <div className="bg-gray-800 rounded-lg p-6 m-4 max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <Brain className="h-5 w-5 mr-2 text-purple-400" />
                AI Analysis Results
              </h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setAiAnalysisResults(null)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-purple-300 mb-2">Patterns Identified:</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  {aiAnalysisResults.patterns.map((pattern: string, index: number) => (
                    <li key={index} className="flex items-center">
                      <div className="w-2 h-2 bg-purple-400 rounded-full mr-2"></div>
                      {pattern}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-blue-300 mb-2">Recommendations:</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  {aiAnalysisResults.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="flex items-center">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <Button
              className="w-full mt-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              onClick={() => setAiAnalysisResults(null)}
            >
              Got it!
            </Button>
          </div>
        </div>
      )}

      {/* Severity Rating Modal */}
      {showSeverityModal && severityHexieId && (() => {
        const hexie = hexies.find(h => h.id === severityHexieId);
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
            <div className="bg-gray-800 rounded-lg p-6 m-4 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-orange-400" />
                  Rate Severity
                </h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowSeverityModal(false);
                    setSeverityHexieId(null);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-white mb-2">{hexie?.card_data.title}</h4>
                  <p className="text-sm text-gray-300">{hexie?.card_data.front_text}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-3">
                    Rate Severity (1 = Low, 5 = High)
                  </label>
                  
                  {/* Current ratings display */}
                  {(() => {
                    const ratingsData = severityRatings.get(severityHexieId || '');
                    return ratingsData && ratingsData.ratings.length > 0 ? (
                      <div className="mb-3 p-2 bg-gray-700/50 rounded text-xs text-gray-300">
                        Current average: {ratingsData.average.toFixed(1)}/5 ({ratingsData.ratings.length} rating{ratingsData.ratings.length !== 1 ? 's' : ''})
                      </div>
                    ) : null;
                  })()}
                  
                  {/* Simple 1-5 buttons */}
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <Button
                        key={rating}
                        onClick={() => setNewSeverity(rating)}
                        variant={newSeverity === rating ? "default" : "outline"}
                        className={`flex-1 h-12 text-lg font-bold ${
                          newSeverity === rating
                            ? rating <= 2 ? 'bg-green-600 hover:bg-green-700' :
                              rating === 3 ? 'bg-yellow-600 hover:bg-yellow-700' :
                              rating === 4 ? 'bg-orange-600 hover:bg-orange-700' :
                              'bg-red-600 hover:bg-red-700'
                            : 'border-gray-600 hover:bg-gray-700'
                        }`}
                      >
                        {rating}
                      </Button>
                    ))}
                  </div>
                  
                  <div className="flex justify-between text-xs text-gray-400 mt-2">
                    <span>Low</span>
                    <span>Medium</span>
                    <span>High</span>
                  </div>
                </div>
                
                <div className={`p-3 rounded-lg border text-center ${
                  newSeverity <= 2 ? 'bg-green-500/10 border-green-500/30 text-green-300' :
                  newSeverity === 3 ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300' :
                  newSeverity === 4 ? 'bg-orange-500/10 border-orange-500/30 text-orange-300' :
                  'bg-red-500/10 border-red-500/30 text-red-300'
                }`}>
                  <p className="text-sm font-medium">
                    {newSeverity <= 2 ? 'Low severity - Minor impact' :
                     newSeverity === 3 ? 'Medium severity - Noticeable impact' :
                     newSeverity === 4 ? 'High severity - Significant impact' :
                     'Critical severity - Major impact'}
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSeverityModal(false);
                    setSeverityHexieId(null);
                  }}
                  className="flex-1 border-gray-600"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSeverityUpdate}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Update Severity
                </Button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* References Modal */}
      {showReferencesModal && referencesHexieId && (() => {
        const hexie = hexies.find(h => h.id === referencesHexieId);
        const references = hexie?.card_data?.references || hexie?.card_data?.card_references || [];
        
        return (
          <StableModal 
            isOpen={showReferencesModal} 
            onClose={() => {
              setShowReferencesModal(false);
              setReferencesHexieId(null);
            }}
          >
            <div style={{ padding: '24px' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">{hexie?.card_data?.title}</h3>
                <button
                  onClick={() => {
                    setShowReferencesModal(false);
                    setReferencesHexieId(null);
                  }}
                  className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <div className="mb-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                  <Library className="w-5 h-5 mr-2 text-blue-600" />
                  Research & References
                </h4>
                <p className="text-sm text-gray-600">Scientific research, articles, and resources supporting this content</p>
              </div>
              
              {references && references.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {references.map((ref, index) => {
                    const getTypeIcon = (type: string) => {
                      switch (type) {
                        case 'video':
                          return <Video className="w-4 h-4 text-red-500" />;
                        case 'podcast':
                          return <Headphones className="w-4 h-4 text-purple-500" />;
                        case 'article':
                          return <FileText className="w-4 h-4 text-blue-500" />;
                        case 'research':
                          return <Microscope className="w-4 h-4 text-indigo-500" />;
                        case 'book':
                          return <BookOpen className="w-4 h-4 text-green-500" />;
                        case 'website':
                          return <Globe className="w-4 h-4 text-gray-500" />;
                        default:
                          return <ExternalLink className="w-4 h-4 text-gray-500" />;
                      }
                    };
                    
                    const getTypeColor = (type: string) => {
                      switch (type) {
                        case 'video':
                          return 'bg-red-100 text-red-800';
                        case 'podcast':
                          return 'bg-purple-100 text-purple-800';
                        case 'article':
                          return 'bg-blue-100 text-blue-800';
                        case 'research':
                          return 'bg-indigo-100 text-indigo-800';
                        case 'book':
                          return 'bg-green-100 text-green-800';
                        case 'website':
                          return 'bg-gray-100 text-gray-800';
                        default:
                          return 'bg-gray-100 text-gray-800';
                      }
                    };
                    
                    return (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-1">
                            {getTypeIcon(ref.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-semibold text-gray-900 mb-2 break-words">{ref.title}</h5>
                            
                            {/* Publication and Authors */}
                            <div className="flex flex-wrap items-center gap-2 mb-2 text-sm text-gray-600">
                              {ref.publication && (
                                <span className="font-medium">{ref.publication}</span>
                              )}
                              {ref.authors && (
                                <span>• by {ref.authors}</span>
                              )}
                              {ref.year && (
                                <span>• {ref.year}</span>
                              )}
                            </div>
                            
                            {ref.description && (
                              <p className="text-gray-600 text-sm mb-3 leading-relaxed break-words">{ref.description}</p>
                            )}
                            
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              {ref.url && (
                                <a
                                  href={ref.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center text-blue-600 text-sm font-medium hover:text-blue-800 transition-colors"
                                >
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  {ref.type === 'video' ? 'Watch Video' : 
                                   ref.type === 'podcast' ? 'Listen to Podcast' :
                                   ref.type === 'research' ? 'View Research' :
                                   ref.type === 'book' ? 'View Book' :
                                   ref.type === 'article' ? 'Read Article' :
                                   'Visit Website'}
                                </a>
                              )}
                              <span className={`inline-block text-xs px-3 py-1 rounded-full font-medium ${getTypeColor(ref.type)}`}>
                                {ref.type.charAt(0).toUpperCase() + ref.type.slice(1)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Library className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-lg">No references available for this hexie.</p>
                  <p className="text-gray-400 text-sm mt-2">References may include research papers, articles, books, videos, and other evidence-based resources.</p>
                </div>
              )}
            </div>
          </StableModal>
        );
      })()}

      {/* Severity Filter Panel */}
      {showSeverityFilter && (
        <div className="absolute bottom-20 right-6 z-50">
          <div className="bg-gray-900/95 backdrop-blur-sm rounded-lg  border border-white/20 p-4 min-w-48">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">Filter by Severity</h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowSeverityFilter(false)}
                className="text-gray-400 hover:text-white h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
            
            <div className="space-y-2">
              {[
                { value: 'all', label: 'All Hexies', count: hexies.length, color: 'text-gray-300' },
                { value: 'unrated', label: 'Unrated', count: hexies.filter(h => !h.antipattern_severity || h.antipattern_severity === 0).length, color: 'text-gray-400' },
                { value: 'low', label: 'Low (1-2)', count: hexies.filter(h => h.antipattern_severity && h.antipattern_severity > 0 && h.antipattern_severity <= 2).length, color: 'text-green-400' },
                { value: 'medium', label: 'Medium (2-3.5)', count: hexies.filter(h => h.antipattern_severity && h.antipattern_severity > 2 && h.antipattern_severity <= 3.5).length, color: 'text-yellow-400' },
                { value: 'high', label: 'High (3.5+)', count: hexies.filter(h => h.antipattern_severity && h.antipattern_severity > 3.5).length, color: 'text-red-400' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setSeverityFilter(option.value as any);
                    toast.success(`Filtering: ${option.label}`);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    severityFilter === option.value
                      ? 'bg-blue-600/30 border border-blue-500/50'
                      : 'hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${option.color} ${severityFilter === option.value ? 'font-medium' : ''}`}>
                      {option.label}
                    </span>
                    <span className="text-xs text-gray-500">
                      {option.count}
                    </span>
                  </div>
                </button>
              ))}
            </div>
            
            {severityFilter !== 'all' && (
              <div className="mt-3 pt-3 border-t border-gray-700">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSeverityFilter('all');
                    toast.success('Showing all hexies');
                  }}
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Clear Filter
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Drawing Tools */}
      <DrawingTools
        canvasRef={canvasRef}
        canvasTransform={canvasTransform}
        isDrawingMode={isDrawingMode}
        onDrawingModeChange={setIsDrawingMode}
        showDrawingToolsPanel={showDrawingToolsPanel}
        onDrawingToolsPanelChange={setShowDrawingToolsPanel}
      />

      {/* Template Manager */}
      <TemplateManager
        isOpen={showTemplateManager}
        onClose={() => setShowTemplateManager(false)}
        onTemplateSelect={setCurrentTemplate}
        currentTemplate={currentTemplate}
        userTier={board.access_level}
      />

      {/* Contest Modal */}
      {contestHexieId && (
        <ContestModal
          isOpen={showContestModal}
          onClose={() => {
            setShowContestModal(false);
            setContestHexieId(null);
          }}
          hexieId={hexies.find(h => h.id === contestHexieId)?.hexie_card_id || contestHexieId}
          hexieTitle={hexies.find(h => h.id === contestHexieId)?.card_data.title || 'Hexie'}
        />
      )}
    </div>
  );
};

export default GameifiedWorkspaceBoard;