'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Hexagon, 
  Users, 
  ArrowLeft,
  Wifi,
  WifiOff,
  Target,
  Award
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { getShareSession, isValidShareSession, joinShareSession } from '@/lib/collaboration';

// Import our components
import { GameifiedWorkspaceBoard } from '@/components/workspace/GameifiedWorkspaceBoard';
import { HoneycombHexieMenu } from '@/components/workspace/HoneycombHexieMenu';

// Demo tesseras for collaboration
const COLLAB_DEMO_TESSERAS = [
  {
    id: 'collab-1',
    title: 'Silent Participants',
    front_text: 'Team members who never speak up in meetings',
    back_text: 'Strategies: Direct questions, breakout rooms, anonymous input tools',
    category: 'Meetings',
    subscription_tier_required: 'free' as const,
    color_scheme: { primary: '#ef4444', secondary: '#dc2626', text: '#ffffff' },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_active: true
  },
  {
    id: 'collab-2', 
    title: 'Information Hoarding',
    front_text: 'Key information is held by single individuals',
    back_text: 'Solutions: Knowledge sharing sessions, documentation requirements, redundancy planning',
    category: 'Communication',
    subscription_tier_required: 'free' as const,
    color_scheme: { primary: '#f59e0b', secondary: '#d97706', text: '#ffffff' },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_active: true
  },
  {
    id: 'collab-3',
    title: 'Meeting Overload',
    front_text: 'Too many meetings with unclear purposes',
    back_text: 'Solutions: Meeting audits, standing agenda templates, time blocking',
    category: 'Meetings', 
    subscription_tier_required: 'free' as const,
    color_scheme: { primary: '#8b5cf6', secondary: '#7c3aed', text: '#ffffff' },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_active: true
  }
];

export default function CollaborationPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  
  const [loading, setLoading] = useState(true);
  const [validSession, setValidSession] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'workspace' | 'gameplay'>('workspace');
  const [participantCount, setParticipantCount] = useState(1);
  
  // Collaboration state
  const [tesseraInstances, setTesseraInstances] = useState<any[]>([]);
  const [availableTesseras] = useState(COLLAB_DEMO_TESSERAS);
  const [selectedTesseraForAdd, setSelectedTesseraForAdd] = useState<any>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  
  // Mock user for collaboration
  const [userName] = useState(() => {
    const adjectives = ['Creative', 'Innovative', 'Focused', 'Agile', 'Collaborative'];
    const nouns = ['Thinker', 'Builder', 'Designer', 'Explorer', 'Architect'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    return `${adj} ${noun}`;
  });

  const currentBoard = {
    id: 'collab-board',
    name: 'Shared Workspace',
    description: 'Collaborative tesseras workspace',
    game_settings: {
      difficulty_level: 'beginner' as const,
      safety_level: 'high' as const,
      intervention_mode: 'collaborative' as const,
      progress_tracking: true,
      anonymous_mode: false
    },
    access_level: 'free' as const,
    max_tesseras: 15,
    max_annotations: 5
  };

  const userCompetency = {
    primary_role: 'explorer' as const,
    competency_scores: {
      pattern_recognition: 5,
      emotional_intelligence: 8,
      systems_thinking: 3,
      intervention_design: 0,
      psychological_safety: 10,
      group_facilitation: 5
    },
    total_experience: 50,
    current_level: 1,
    badges_earned: []
  };

  useEffect(() => {
    validateSession();
  }, [sessionId]);

  const validateSession = async () => {
    try {
      if (!sessionId || typeof sessionId !== 'string') {
        toast.error('Invalid session ID');
        router.push('/demo');
        return;
      }

      const isValid = isValidShareSession(sessionId);
      const sessionData = getShareSession(sessionId);
      
      if (!isValid || !sessionData) {
        toast.error('Session expired or invalid');
        router.push('/demo');
        return;
      }

      // Join the session
      const joined = joinShareSession(sessionId, userName);
      if (!joined) {
        toast.error('Failed to join session');
        router.push('/demo');
        return;
      }

      setValidSession(true);
      setSession(sessionData);
      setParticipantCount(sessionData.participants.length);
      toast.success(`🎉 Joined collaborative session! Welcome ${userName}`);
    } catch (error) {
      console.error('Session validation error:', error);
      toast.error('Failed to validate session');
      router.push('/demo');
    } finally {
      setLoading(false);
    }
  };

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

  const handleTesseraSelect = (tessera: any) => {
    setSelectedTesseraForAdd(tessera);
    toast(`Selected: ${tessera.title}. Click in workspace to place it.`, {
      icon: '👆',
      duration: 3000,
    });
  };

  const handleAddTessera = (tessera: any) => {
    if (tesseraInstances.length >= currentBoard.max_tesseras) {
      toast.error(`Collaboration limit: Maximum ${currentBoard.max_tesseras} tesseras.`);
      return;
    }

    // Calculate center of visible workspace area, avoiding the tessera library area
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const libraryWidth = 320; // Approximate width of tessera library
    const headerHeight = 64; // Header height
    
    // Center position in the workspace area (excluding library and header)
    const centerX = libraryWidth + (viewportWidth - libraryWidth) / 2 - 60; // Offset for tessera size
    const centerY = headerHeight + (viewportHeight - headerHeight) / 2 - 60; // Offset for tessera size
    
    // Add slight randomization to prevent exact overlap
    const offsetX = (Math.random() - 0.5) * 100; // ±50px variation
    const offsetY = (Math.random() - 0.5) * 100; // ±50px variation

    const newInstance = {
      id: `collab_instance_${Date.now()}`,
      tessera_card_id: tessera.id,
      position: { 
        x: Math.max(libraryWidth + 50, centerX + offsetX), // Ensure it's not under library
        y: Math.max(headerHeight + 50, centerY + offsetY) // Ensure it's not under header
      },
      rotation: 0,
      scale: 1,
      is_flipped: false,
      z_index: tesseraInstances.length,
      annotations: [],
      antipattern_severity: Math.random() * 3 + 1,
      card_data: tessera
    };

    setTesseraInstances(prev => [...prev, newInstance]);
    toast.success(`${tessera.title} added by ${userName}!`);
  };

  const handleTesseraUpdate = (updatedTessera: any) => {
    setTesseraInstances(prev => 
      prev.map(h => h.id === updatedTessera.id ? updatedTessera : h)
    );
  };

  const handleAnnotationAdd = (tesseraId: string, annotation: any) => {
    setTesseraInstances(prev => 
      prev.map(tessera => 
        tessera.id === tesseraId 
          ? { ...tessera, annotations: [...tessera.annotations, { ...annotation, id: `collab_ann_${Date.now()}` }] }
          : tessera
      )
    );
    toast.success(`Annotation added by ${userName}`);
  };

  const handleSafetyAlert = (alert: any) => {
    console.log('Collaboration Safety Alert:', alert);
    toast(`Safety reminder: ${alert.type.replace('_', ' ')}`, {
      icon: '🛡️',
      duration: 4000,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-gray-400 mb-2">Joining Collaboration Session...</h3>
          <p className="text-gray-500">Connecting to shared workspace</p>
        </div>
      </div>
    );
  }

  if (!validSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-red-400 mb-2">Session Invalid</h3>
          <p className="text-gray-400 mb-4">This collaboration session has expired or is invalid.</p>
          <Link href="/demo">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Demo
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/demo">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Leave Session
                </Button>
              </Link>
              
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Hexagon className="h-8 w-8 text-blue-400" />
                  <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-xl"></div>
                </div>
                <div>
                  <span className="text-xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                    Collaborative Session
                  </span>
                  <div className="text-xs text-blue-300/80 font-medium tracking-wide">
                    LIVE COLLABORATION • {participantCount} PARTICIPANT{participantCount !== 1 ? 'S' : ''}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {isConnected ? (
                  <Wifi className="h-4 w-4 text-green-400" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-400" />
                )}
                <span className="text-sm text-gray-300">{userName}</span>
              </div>
              
              <Badge variant="outline" className="text-green-300 border-green-500/50">
                <Users className="h-3 w-3 mr-1" />
                Live Session
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-6 py-2">
        <div className="flex space-x-1 p-1 bg-gray-800/50 rounded-lg mb-4">
          {[
            { id: 'workspace', label: 'Collaborative Workspace', icon: Target },
            { id: 'gameplay', label: 'Session Stats', icon: Award },
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

        {/* Content based on active tab */}
        {activeTab === 'workspace' && (
          <div className="h-[calc(100vh-200px)] flex space-x-4">
            {/* Honeycomb Tesseras Menu */}
            <HoneycombHexieMenu
              hexieCards={availableTesseras}
              userTier="free"
              favorites={favorites}
              onHexieSelect={handleTesseraSelect}
              onToggleFavorite={handleToggleFavorite}
              onAddToCanvas={handleAddTessera}
              isCollapsed={isMenuCollapsed}
              onCollapsedChange={setIsMenuCollapsed}
            />

            {/* Main Workspace Area */}
            <div className="flex-1 flex flex-col space-y-4">
              {/* Workspace Header */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <h3 className="text-lg font-semibold text-white">Live Collaboration Canvas</h3>
                      <Badge variant="outline" className="text-gray-300">
                        {tesseraInstances.length}/{currentBoard.max_tesseras} tesseras placed
                      </Badge>
                      {selectedTesseraForAdd && (
                        <Badge variant="secondary" className="bg-blue-600/20 text-blue-300">
                          Ready to place: {selectedTesseraForAdd.title}
                        </Badge>
                      )}
                      
                      {/* Real-time activity feed */}
                      <Badge variant="outline" className="text-yellow-300 border-yellow-500/50 animate-pulse">
                        🟡 Live Activity
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-green-300">
                        <Users className="h-3 w-3 mr-1" />
                        {participantCount} Connected
                      </Badge>
                      
                      {/* Voice/Video call button for premium collaboration */}
                      <Button
                        onClick={() => toast.success('🎥 Video call initiated!')}
                        size="sm"
                        variant="outline"
                        className="border-blue-500/50 text-blue-300 hover:bg-blue-500/10"
                      >
                        🎥 Call
                      </Button>
                    </div>
                  </div>

                  {/* Real-time collaboration indicators */}
                  <div className="mt-3 flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1 text-green-400">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span>Creative Thinker typing...</span>
                    </div>
                    <div className="flex items-center space-x-1 text-blue-400">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span>Focused Builder moved tessera</span>
                    </div>
                    <div className="flex items-center space-x-1 text-purple-400">
                      <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                      <span>Agile Explorer added annotation</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Main Canvas */}
              <div className="flex-1">
                <GameifiedWorkspaceBoard
                  board={currentBoard}
                  userCompetency={userCompetency}
                  onHexieAdd={handleAddTessera}
                  onHexieUpdate={handleTesseraUpdate}
                  onAnnotationAdd={handleAnnotationAdd}
                  onSafetyAlert={handleSafetyAlert}
                  hexieInstances={tesseraInstances}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'gameplay' && (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Collaboration Stats</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-700/50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-400">{tesseraInstances.length}</div>
                  <div className="text-sm text-gray-400">Tesseras Placed</div>
                </div>
                <div className="text-center p-4 bg-gray-700/50 rounded-lg">
                  <div className="text-2xl font-bold text-green-400">{participantCount}</div>
                  <div className="text-sm text-gray-400">Participants</div>
                </div>
                <div className="text-center p-4 bg-gray-700/50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-400">{favorites.length}</div>
                  <div className="text-sm text-gray-400">Total Favorites</div>
                </div>
                <div className="text-center p-4 bg-gray-700/50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-400">
                    {session ? Math.round((new Date().getTime() - new Date(session.createdAt).getTime()) / 60000) : 0}
                  </div>
                  <div className="text-sm text-gray-400">Minutes Active</div>
                </div>
              </div>

              <div className="text-center p-6 bg-gradient-to-r from-green-600/20 to-blue-600/20 rounded-lg border border-green-500/30">
                <h4 className="text-lg font-semibold text-white mb-2">🎉 Collaboration Active!</h4>
                <p className="text-gray-300 mb-4">
                  You're collaborating with others in real-time. Share the session link to invite more participants.
                </p>
                <div className="text-xs text-gray-400">
                  Session ID: {sessionId}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}