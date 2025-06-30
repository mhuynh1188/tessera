'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Hexagon, 
  Users, 
  Timer, 
  Share2, 
  Vote,
  Group,
  MousePointer2,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Workspace, User, HexieInstance, HexieCard } from '@/types';
import { db } from '@/lib/supabase';
import { tessellation } from '@/lib/tessellation';
import toast from 'react-hot-toast';

interface CollaborativeWorkspaceProps {
  workspace: Workspace;
  user: User | null;
  hexieCards: HexieCard[];
  shareToken?: string;
}

interface Participant {
  id: string;
  session_name: string;
  cursor_position: { x: number; y: number };
  user_id?: string;
  is_active: boolean;
}

interface Vote {
  id: string;
  vote_type: 'agree' | 'disagree' | 'neutral';
  severity_level?: number;
  participant_name: string;
}

interface HexieWithVotes extends HexieInstance {
  votes: Vote[];
  hexie_card: HexieCard;
}

export default function CollaborativeWorkspace({ 
  workspace, 
  user, 
  hexieCards,
  shareToken 
}: CollaborativeWorkspaceProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [hexieInstances, setHexieInstances] = useState<HexieWithVotes[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedHexie, setSelectedHexie] = useState<string | null>(null);
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    hexieId: string | null;
    startPos: { x: number; y: number };
    offset: { x: number; y: number };
  }>({
    isDragging: false,
    hexieId: null,
    startPos: { x: 0, y: 0 },
    offset: { x: 0, y: 0 }
  });
  
  const [viewTransform, setViewTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [showTessellationGrid, setShowTessellationGrid] = useState(true);
  const [currentParticipant, setCurrentParticipant] = useState<Participant | null>(null);
  const [sessionName, setSessionName] = useState('');
  const [timer, setTimer] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Initialize session
  useEffect(() => {
    initializeSession();
    loadHexieInstances();
    loadTimer();
  }, [workspace.id]);

  const initializeSession = async () => {
    try {
      const name = sessionName || (user?.name || `User ${Math.floor(Math.random() * 1000)}`);
      const participant = await db.joinSession(
        workspace.id, 
        name, 
        shareToken, 
        user?.id
      );
      setCurrentParticipant(participant);
      
      // Subscribe to real-time updates
      const participantsSubscription = db.subscribeToParticipants(workspace.id, (payload) => {
        loadParticipants();
      });

      const hexiesSubscription = db.subscribeToWorkspace(workspace.id, (payload) => {
        loadHexieInstances();
      });

      const votesSubscription = db.subscribeToVotes(workspace.id, (payload) => {
        loadHexieInstances(); // Reload to get updated votes
      });

      const timerSubscription = db.subscribeToTimer(workspace.id, (payload) => {
        loadTimer();
      });

      return () => {
        participantsSubscription.unsubscribe();
        hexiesSubscription.unsubscribe();
        votesSubscription.unsubscribe();
        timerSubscription.unsubscribe();
      };
    } catch (error) {
      console.error('Failed to initialize session:', error);
      toast.error('Failed to join session');
    }
  };

  const loadParticipants = async () => {
    try {
      const activeParticipants = await db.getActiveParticipants(workspace.id);
      setParticipants(activeParticipants);
    } catch (error) {
      console.error('Failed to load participants:', error);
    }
  };

  const loadHexieInstances = async () => {
    try {
      const instances = await db.getHexieInstances(workspace.id);
      
      // Load votes for each hexie
      const instancesWithVotes = await Promise.all(
        instances.map(async (instance) => {
          const votes = await db.getHexieVotes(instance.id);
          const hexieCard = hexieCards.find(card => card.id === instance.hexie_card_id);
          
          return {
            ...instance,
            votes: votes.map(vote => ({
              id: vote.id,
              vote_type: vote.vote_type,
              severity_level: vote.severity_level,
              participant_name: vote.session_participants?.session_name || 'Unknown'
            })),
            hexie_card: hexieCard || {
              id: instance.hexie_card_id,
              title: 'Unknown Hexie',
              front_text: 'Loading...',
              back_text: '',
              category: 'Unknown',
              subscription_tier_required: 'free',
              color_scheme: { primary: '#6b7280', secondary: '#4b5563', text: '#ffffff' },
              created_at: '',
              updated_at: '',
              created_by: '',
              is_public: true
            }
          };
        })
      );
      
      setHexieInstances(instancesWithVotes);
    } catch (error) {
      console.error('Failed to load hexie instances:', error);
    }
  };

  const loadTimer = async () => {
    try {
      const activeTimer = await db.getActiveTimer(workspace.id);
      if (activeTimer) {
        setTimer(activeTimer);
        const now = new Date().getTime();
        const endTime = new Date(activeTimer.ends_at).getTime();
        setTimeRemaining(Math.max(0, endTime - now));
      }
    } catch (error) {
      console.error('Failed to load timer:', error);
    }
  };

  // Timer countdown
  useEffect(() => {
    if (timeRemaining > 0) {
      const interval = setInterval(() => {
        setTimeRemaining(prev => Math.max(0, prev - 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timeRemaining]);

  // Mouse tracking for cursor sharing
  const handleMouseMove = useCallback(async (e: React.MouseEvent) => {
    if (currentParticipant) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Throttled cursor position updates
        if (Date.now() - (window as any).lastCursorUpdate > 100) {
          try {
            await db.updateCursorPosition(currentParticipant.id, x, y);
            (window as any).lastCursorUpdate = Date.now();
          } catch (error) {
            // Silently fail cursor updates
          }
        }
      }
    }
    
    // Handle drag logic
    if (dragState.isDragging && dragState.hexieId) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const newPos = {
          x: x - dragState.offset.x,
          y: y - dragState.offset.y
        };

        // Check for tessellation snapping
        const snapResult = tessellation.shouldSnap(newPos.x, newPos.y);
        const finalPos = snapResult.shouldSnap ? snapResult.snapPosition! : newPos;

        setHexieInstances(prev => prev.map(hexie => 
          hexie.id === dragState.hexieId 
            ? { ...hexie, position: finalPos }
            : hexie
        ));
      }
    }
  }, [dragState, currentParticipant]);

  const handleMouseDown = useCallback((e: React.MouseEvent, hexieId: string) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const hexie = hexieInstances.find(h => h.id === hexieId);
      
      if (hexie) {
        setDragState({
          isDragging: true,
          hexieId,
          startPos: { x, y },
          offset: {
            x: x - hexie.position.x,
            y: y - hexie.position.y
          }
        });
        setSelectedHexie(hexieId);
      }
    }
  }, [hexieInstances]);

  const handleMouseUp = useCallback(async () => {
    if (dragState.isDragging && dragState.hexieId) {
      const hexie = hexieInstances.find(h => h.id === dragState.hexieId);
      if (hexie) {
        try {
          await db.updateHexieWithTessellation(hexie.id, {
            position: hexie.position,
            is_snapped: true
          });
          toast.success('Hexie snapped to grid! 🔷');
        } catch (error) {
          console.error('Failed to update hexie position:', error);
        }
      }
    }
    
    setDragState({
      isDragging: false,
      hexieId: null,
      startPos: { x: 0, y: 0 },
      offset: { x: 0, y: 0 }
    });
  }, [dragState, hexieInstances]);

  // Voting functions
  const castVote = async (hexieId: string, voteType: 'agree' | 'disagree' | 'neutral', severity?: number) => {
    if (!currentParticipant) return;
    
    try {
      await db.castVote(hexieId, currentParticipant.id, voteType, severity);
      toast.success(`Vote cast: ${voteType.toUpperCase()}`);
      loadHexieInstances(); // Reload to show updated votes
    } catch (error) {
      console.error('Failed to cast vote:', error);
      toast.error('Failed to cast vote');
    }
  };

  // Share workspace
  const shareWorkspace = async () => {
    if (!user) return;
    
    try {
      const share = await db.createWorkspaceShare(workspace.id, user.id, 24);
      const shareUrl = `${window.location.origin}/shared/${share.share_token}`;
      
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Share link copied! Expires in 24 hours 🔗');
    } catch (error) {
      console.error('Failed to create share link:', error);
      toast.error('Failed to create share link');
    }
  };

  // Start timer
  const startTimer = async (minutes: number) => {
    if (!user) return;
    
    try {
      const newTimer = await db.createTimer(workspace.id, 'Session Timer', minutes, user.id);
      await db.startTimer(newTimer.id);
      toast.success(`Timer started: ${minutes} minutes ⏱️`);
      loadTimer();
    } catch (error) {
      console.error('Failed to start timer:', error);
      toast.error('Failed to start timer');
    }
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Render tessellation grid
  const renderTessellationGrid = () => {
    if (!showTessellationGrid || !canvasRef.current) return null;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const gridPoints = tessellation.generateGridOverlay({
      width: rect.width,
      height: rect.height,
      offsetX: viewTransform.x,
      offsetY: viewTransform.y
    });

    return (
      <svg className="absolute inset-0 pointer-events-none opacity-20">
        {gridPoints.map((point, i) => (
          <circle
            key={i}
            cx={point.x + viewTransform.x}
            cy={point.y + viewTransform.y}
            r="2"
            fill="currentColor"
            className="text-blue-400"
          />
        ))}
      </svg>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Collaboration Header */}
      <div className="bg-black/50 backdrop-blur border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <h1 className="text-xl font-bold text-white flex items-center">
              <Hexagon className="h-6 w-6 mr-2 text-blue-400" />
              {workspace.name}
            </h1>
            
            {/* Participants */}
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-gray-400" />
              <span className="text-gray-300 text-sm">{participants.length} online</span>
              <div className="flex -space-x-2">
                {participants.slice(0, 5).map((participant, i) => (
                  <div
                    key={participant.id}
                    className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center text-white text-xs font-semibold border-2 border-gray-900"
                    title={participant.session_name}
                  >
                    {participant.session_name.charAt(0).toUpperCase()}
                  </div>
                ))}
                {participants.length > 5 && (
                  <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-xs font-semibold border-2 border-gray-900">
                    +{participants.length - 5}
                  </div>
                )}
              </div>
            </div>

            {/* Timer */}
            {timer && timeRemaining > 0 && (
              <div className="flex items-center space-x-2 bg-orange-600 text-white px-3 py-1 rounded-lg">
                <Clock className="h-4 w-4" />
                <span className="font-mono font-bold">{formatTime(timeRemaining)}</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setShowTessellationGrid(!showTessellationGrid)}
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-300"
            >
              Grid {showTessellationGrid ? 'On' : 'Off'}
            </Button>
            
            {user && (
              <>
                <Button onClick={shareWorkspace} variant="outline" size="sm" className="border-gray-600 text-gray-300">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                
                <Button onClick={() => startTimer(5)} variant="outline" size="sm" className="border-gray-600 text-gray-300">
                  <Timer className="h-4 w-4 mr-2" />
                  5min Timer
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <div
          ref={canvasRef}
          className="w-full h-full relative cursor-move"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          {/* Tessellation Grid */}
          {renderTessellationGrid()}

          {/* Hexie Instances */}
          {hexieInstances.map((hexie) => {
            const isSelected = selectedHexie === hexie.id;
            const colorScheme = hexie.hexie_card.color_scheme || { primary: '#6b7280', secondary: '#4b5563', text: '#ffffff' };
            
            return (
              <div
                key={hexie.id}
                className={`absolute cursor-pointer transition-all duration-200 ${
                  isSelected ? 'ring-4 ring-blue-400 ring-opacity-50' : ''
                }`}
                style={{
                  left: hexie.position.x - 30,
                  top: hexie.position.y - 30,
                  width: 60,
                  height: 60,
                  zIndex: hexie.z_index + (isSelected ? 1000 : 0)
                }}
                onMouseDown={(e) => handleMouseDown(e, hexie.id)}
              >
                {/* Hexagon */}
                <div 
                  className="w-full h-full rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg"
                  style={{ backgroundColor: colorScheme.primary }}
                  title={hexie.hexie_card.title}
                >
                  <Hexagon className="h-8 w-8" />
                </div>

                {/* Voting Interface */}
                {isSelected && (
                  <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 bg-gray-800 rounded-lg p-2 shadow-xl border border-gray-600">
                    <div className="flex items-center space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => castVote(hexie.id, 'agree', 5)}
                        className="border-green-500 text-green-400 hover:bg-green-500/20"
                      >
                        <ThumbsUp className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => castVote(hexie.id, 'neutral', 3)}
                        className="border-gray-500 text-gray-400 hover:bg-gray-500/20"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => castVote(hexie.id, 'disagree', 1)}
                        className="border-red-500 text-red-400 hover:bg-red-500/20"
                      >
                        <ThumbsDown className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    {/* Vote Summary */}
                    {hexie.votes.length > 0 && (
                      <div className="mt-2 text-xs text-gray-300 text-center">
                        {hexie.votes.filter(v => v.vote_type === 'agree').length} agree, {' '}
                        {hexie.votes.filter(v => v.vote_type === 'disagree').length} disagree
                      </div>
                    )}
                  </div>
                )}

                {/* Vote Indicators */}
                {hexie.votes.length > 0 && (
                  <div className="absolute -top-2 -right-2 flex space-x-1">
                    {hexie.votes.filter(v => v.vote_type === 'agree').length > 0 && (
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
                        {hexie.votes.filter(v => v.vote_type === 'agree').length}
                      </div>
                    )}
                    {hexie.votes.filter(v => v.vote_type === 'disagree').length > 0 && (
                      <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
                        {hexie.votes.filter(v => v.vote_type === 'disagree').length}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Other Participants' Cursors */}
          {participants
            .filter(p => p.id !== currentParticipant?.id)
            .map((participant) => (
              <div
                key={participant.id}
                className="absolute pointer-events-none z-50"
                style={{
                  left: participant.cursor_position.x,
                  top: participant.cursor_position.y,
                  transform: 'translate(-2px, -2px)'
                }}
              >
                <MousePointer2 className="h-4 w-4 text-blue-400" />
                <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded ml-2 -mt-1">
                  {participant.session_name}
                </div>
              </div>
            ))}

          {/* Empty State */}
          {hexieInstances.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <Hexagon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">Ready to Collaborate</h3>
                <p className="text-gray-500">
                  {participants.length} participant{participants.length !== 1 ? 's' : ''} online
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Session rename input */}
      {!sessionName && (
        <div className="fixed bottom-4 right-4 bg-gray-800 border border-gray-600 rounded-lg p-4 shadow-xl">
          <h3 className="text-white font-semibold mb-2">Set Your Session Name</h3>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Enter your name..."
              className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 text-sm"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  setSessionName(e.currentTarget.value);
                  initializeSession();
                }
              }}
            />
            <Button size="sm" onClick={() => {
              const input = document.querySelector('input') as HTMLInputElement;
              setSessionName(input.value || `User ${Math.floor(Math.random() * 1000)}`);
              initializeSession();
            }}>
              Join
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}