'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  Heart, 
  AlertTriangle, 
  CheckCircle,
  Eye,
  EyeOff,
  MessageCircle,
  Brain,
  Pause,
  RotateCcw,
  Users,
  Lock,
  Clock,
  Activity,
  TrendingDown,
  TrendingUp,
  HelpCircle,
  Phone,
  BookOpen,
  Wind
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';

interface SafetyIndicators {
  comfort_level: number; // 1-5
  engagement_level: number; // 1-5
  safety_score: number; // 1-5
  stress_indicators: string[];
  session_health: 'healthy' | 'concerning' | 'alert';
}

interface SafetyAlert {
  id: string;
  type: 'stress_pattern' | 'negative_spiral' | 'isolation_behavior' | 'overwhelming_content' | 'rapid_exit' | 'help_request';
  severity: 1 | 2 | 3; // low, moderate, high
  timestamp: number;
  context: any;
  resolved: boolean;
}

interface SupportResource {
  id: string;
  resource_type: 'breathing_exercise' | 'grounding_technique' | 'reframe_prompt' | 'break_suggestion' | 'peer_support' | 'professional_referral';
  title: string;
  content: string;
  trigger_conditions: string[];
  estimated_duration?: string;
  difficulty_level?: 'easy' | 'moderate' | 'advanced';
}

interface PsychologicalSafetyFrameworkProps {
  userId: string;
  sessionId: string;
  currentIndicators: SafetyIndicators;
  onIndicatorsUpdate: (indicators: SafetyIndicators) => void;
  onSafetyAlert: (alert: SafetyAlert) => void;
  onSupportRequest: (resourceType: string) => void;
  subscriptionTier: 'free' | 'basic' | 'premium';
  anonymousMode?: boolean;
}

export const PsychologicalSafetyFramework: React.FC<PsychologicalSafetyFrameworkProps> = ({
  userId,
  sessionId,
  currentIndicators,
  onIndicatorsUpdate,
  onSafetyAlert,
  onSupportRequest,
  subscriptionTier,
  anonymousMode = false
}) => {
  const [safetyAlerts, setSafetyAlerts] = useState<SafetyAlert[]>([]);
  const [showSafetyPanel, setShowSafetyPanel] = useState(false);
  const [activeResource, setActiveResource] = useState<SupportResource | null>(null);
  const [monitoringEnabled, setMonitoringEnabled] = useState(true);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [lastInteractionTime, setLastInteractionTime] = useState(Date.now());
  
  // Behavioral pattern tracking
  const [behaviorTracking] = useState({
    rapidClicks: 0,
    focusLost: 0,
    inactivityPeriods: 0,
    negativePatterns: [] as string[]
  });

  const sessionStartRef = useRef(Date.now());
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Predefined support resources
  const supportResources: SupportResource[] = [
    {
      id: 'breathing-478',
      resource_type: 'breathing_exercise',
      title: '4-7-8 Breathing',
      content: 'Breathe in for 4 counts, hold for 7, exhale for 8. This activates your parasympathetic nervous system and naturally calms your mind. Repeat 3-4 times.',
      trigger_conditions: ['stress_pattern', 'overwhelming_content'],
      estimated_duration: '2 minutes',
      difficulty_level: 'easy'
    },
    {
      id: 'grounding-54321',
      resource_type: 'grounding_technique',
      title: '5-4-3-2-1 Grounding',
      content: 'Notice 5 things you can see, 4 things you can touch, 3 things you can hear, 2 things you can smell, and 1 thing you can taste. This brings you into the present moment.',
      trigger_conditions: ['negative_spiral', 'isolation_behavior'],
      estimated_duration: '3 minutes',
      difficulty_level: 'easy'
    },
    {
      id: 'reframe-perspective',
      resource_type: 'reframe_prompt',
      title: 'Perspective Shift',
      content: 'Ask yourself: "What would I tell a good friend in this situation?" Often we\'re kinder to others than ourselves. What would that voice of compassion say right now?',
      trigger_conditions: ['negative_spiral', 'stress_pattern'],
      estimated_duration: '1 minute',
      difficulty_level: 'moderate'
    },
    {
      id: 'mindful-break',
      resource_type: 'break_suggestion',
      title: 'Mindful Pause',
      content: 'Take 5 minutes away from this session. Step outside if possible, or simply look out a window. Move your body gently. You\'ll return with fresh perspective.',
      trigger_conditions: ['overwhelming_content', 'rapid_exit'],
      estimated_duration: '5 minutes',
      difficulty_level: 'easy'
    },
    {
      id: 'peer-connection',
      resource_type: 'peer_support',
      title: 'Connect with Support',
      content: 'Consider reaching out to a trusted colleague, friend, or mentor. Sometimes talking through workplace challenges with someone who understands can provide clarity.',
      trigger_conditions: ['isolation_behavior', 'help_request'],
      estimated_duration: '10-30 minutes',
      difficulty_level: 'moderate'
    }
  ];

  // Session monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const duration = Math.floor((now - sessionStartRef.current) / 1000 / 60); // minutes
      setSessionDuration(duration);
      
      // Check for concerning patterns
      checkBehavioralPatterns();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Inactivity monitoring
  useEffect(() => {
    const resetInactivityTimer = () => {
      setLastInteractionTime(Date.now());
      
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      
      inactivityTimerRef.current = setTimeout(() => {
        if (monitoringEnabled) {
          handleInactivityDetected();
        }
      }, 120000); // 2 minutes of inactivity
    };

    // Add global event listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetInactivityTimer, true);
    });

    // Initial timer
    resetInactivityTimer();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetInactivityTimer, true);
      });
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [monitoringEnabled]);

  // Check for behavioral patterns that might indicate distress
  const checkBehavioralPatterns = () => {
    const indicators = currentIndicators;
    
    // Multiple stress indicators
    if (indicators.stress_indicators.length >= 3) {
      triggerSafetyAlert('stress_pattern', 2, {
        indicators: indicators.stress_indicators,
        session_duration: sessionDuration
      });
    }
    
    // Low engagement + low comfort
    if (indicators.engagement_level <= 2 && indicators.comfort_level <= 2) {
      triggerSafetyAlert('negative_spiral', 2, {
        engagement: indicators.engagement_level,
        comfort: indicators.comfort_level
      });
    }
    
    // Extended session with declining indicators
    if (sessionDuration > 45 && indicators.safety_score < 3) {
      triggerSafetyAlert('overwhelming_content', 1, {
        duration: sessionDuration,
        safety_score: indicators.safety_score
      });
    }
  };

  const handleInactivityDetected = () => {
    const timeSinceLastInteraction = Date.now() - lastInteractionTime;
    
    if (timeSinceLastInteraction > 120000) { // 2 minutes
      triggerSafetyAlert('isolation_behavior', 1, {
        inactivity_duration: timeSinceLastInteraction,
        session_duration: sessionDuration
      });
    }
  };

  const triggerSafetyAlert = (type: SafetyAlert['type'], severity: SafetyAlert['severity'], context: any) => {
    const alert: SafetyAlert = {
      id: `alert_${Date.now()}`,
      type,
      severity,
      timestamp: Date.now(),
      context,
      resolved: false
    };

    setSafetyAlerts(prev => [...prev, alert]);
    onSafetyAlert(alert);

    // Auto-suggest resources for moderate/high severity alerts
    if (severity >= 2) {
      const relevantResources = supportResources.filter(resource =>
        resource.trigger_conditions.includes(type)
      );
      
      if (relevantResources.length > 0 && !activeResource) {
        setActiveResource(relevantResources[0]);
        setShowSafetyPanel(true);
      }
    }
  };

  const updateSafetyIndicator = (indicator: keyof SafetyIndicators, value: any) => {
    const updated = { ...currentIndicators, [indicator]: value };
    
    // Calculate overall session health
    const avgScore = (updated.comfort_level + updated.engagement_level + updated.safety_score) / 3;
    updated.session_health = 
      avgScore >= 4 ? 'healthy' :
      avgScore >= 3 ? 'concerning' : 'alert';
    
    onIndicatorsUpdate(updated);
  };

  const addStressIndicator = (indicator: string) => {
    const updated = [...currentIndicators.stress_indicators];
    if (!updated.includes(indicator)) {
      updated.push(indicator);
      updateSafetyIndicator('stress_indicators', updated);
    }
  };

  const removeStressIndicator = (indicator: string) => {
    const updated = currentIndicators.stress_indicators.filter(i => i !== indicator);
    updateSafetyIndicator('stress_indicators', updated);
  };

  const resolveAlert = (alertId: string) => {
    setSafetyAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, resolved: true } : alert
      )
    );
  };

  const getHealthColor = (health: SafetyIndicators['session_health']) => {
    switch (health) {
      case 'healthy': return 'text-green-400 bg-green-400/10';
      case 'concerning': return 'text-yellow-400 bg-yellow-400/10';
      case 'alert': return 'text-red-400 bg-red-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getSeverityColor = (severity: number) => {
    switch (severity) {
      case 1: return 'text-blue-400';
      case 2: return 'text-yellow-400';
      case 3: return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const unresolvedAlerts = safetyAlerts.filter(alert => !alert.resolved);

  return (
    <div className="space-y-4">
      {/* Safety Status Bar */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className={`h-5 w-5 ${
                  currentIndicators.session_health === 'healthy' ? 'text-green-400' :
                  currentIndicators.session_health === 'concerning' ? 'text-yellow-400' :
                  'text-red-400'
                }`} />
                <Badge className={getHealthColor(currentIndicators.session_health)}>
                  {currentIndicators.session_health}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-3 text-sm text-gray-400">
                <span>Safety: {currentIndicators.safety_score}/5</span>
                <span>•</span>
                <span>Comfort: {currentIndicators.comfort_level}/5</span>
                <span>•</span>
                <span>{sessionDuration}m session</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {unresolvedAlerts.length > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  {unresolvedAlerts.length} alert{unresolvedAlerts.length !== 1 ? 's' : ''}
                </Badge>
              )}
              
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowSafetyPanel(!showSafetyPanel)}
                className="text-gray-400 hover:text-white"
              >
                {showSafetyPanel ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setMonitoringEnabled(!monitoringEnabled)}
                className={`${monitoringEnabled ? 'text-green-400' : 'text-gray-400'}`}
                title={`Safety monitoring ${monitoringEnabled ? 'enabled' : 'disabled'}`}
              >
                <Activity className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expanded Safety Panel */}
      {showSafetyPanel && (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Quick Check-in */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Heart className="h-5 w-5 mr-2 text-red-400" />
                  How are you feeling?
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Comfort Level</label>
                    <div className="flex items-center space-x-2">
                      <TrendingDown className="h-4 w-4 text-gray-400" />
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={currentIndicators.comfort_level}
                        onChange={(e) => updateSafetyIndicator('comfort_level', parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <TrendingUp className="h-4 w-4 text-gray-400" />
                      <span className="text-white w-6">{currentIndicators.comfort_level}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Engagement</label>
                    <div className="flex items-center space-x-2">
                      <TrendingDown className="h-4 w-4 text-gray-400" />
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={currentIndicators.engagement_level}
                        onChange={(e) => updateSafetyIndicator('engagement_level', parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <TrendingUp className="h-4 w-4 text-gray-400" />
                      <span className="text-white w-6">{currentIndicators.engagement_level}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Safety</label>
                    <div className="flex items-center space-x-2">
                      <TrendingDown className="h-4 w-4 text-gray-400" />
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={currentIndicators.safety_score}
                        onChange={(e) => updateSafetyIndicator('safety_score', parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <TrendingUp className="h-4 w-4 text-gray-400" />
                      <span className="text-white w-6">{currentIndicators.safety_score}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stress Indicators */}
              <div>
                <h5 className="text-md font-semibold text-white mb-3">Current Stress Indicators</h5>
                <div className="flex flex-wrap gap-2 mb-3">
                  {currentIndicators.stress_indicators.map(indicator => (
                    <Badge 
                      key={indicator}
                      variant="destructive"
                      className="flex items-center space-x-1 cursor-pointer"
                      onClick={() => removeStressIndicator(indicator)}
                    >
                      <span>{indicator}</span>
                      <button className="ml-1 hover:bg-red-600 rounded-full p-0.5">
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {['Overwhelmed', 'Frustrated', 'Anxious', 'Confused', 'Tired', 'Rushed'].map(indicator => (
                    <Button
                      key={indicator}
                      size="sm"
                      variant="outline"
                      onClick={() => addStressIndicator(indicator)}
                      disabled={currentIndicators.stress_indicators.includes(indicator)}
                      className="text-xs border-gray-600 text-gray-300"
                    >
                      {indicator}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Quick Support Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setActiveResource(supportResources.find(r => r.id === 'breathing-478') || null);
                    onSupportRequest('breathing_exercise');
                  }}
                  className="flex items-center space-x-2 border-blue-600 text-blue-400 hover:bg-blue-600/10"
                >
                  <Wind className="h-4 w-4" />
                  <span>Breathing</span>
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    setActiveResource(supportResources.find(r => r.id === 'grounding-54321') || null);
                    onSupportRequest('grounding_technique');
                  }}
                  className="flex items-center space-x-2 border-green-600 text-green-400 hover:bg-green-600/10"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Grounding</span>
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    setActiveResource(supportResources.find(r => r.id === 'mindful-break') || null);
                    onSupportRequest('break_suggestion');
                  }}
                  className="flex items-center space-x-2 border-purple-600 text-purple-400 hover:bg-purple-600/10"
                >
                  <Pause className="h-4 w-4" />
                  <span>Take Break</span>
                </Button>
              </div>

              {/* Recent Alerts */}
              {unresolvedAlerts.length > 0 && (
                <div>
                  <h5 className="text-md font-semibold text-white mb-3 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2 text-yellow-400" />
                    Active Safety Alerts
                  </h5>
                  <div className="space-y-2">
                    {unresolvedAlerts.slice(0, 3).map(alert => (
                      <div key={alert.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded border border-gray-600">
                        <div className="flex items-center space-x-3">
                          <AlertTriangle className={`h-4 w-4 ${getSeverityColor(alert.severity)}`} />
                          <div>
                            <span className="text-white text-sm capitalize">
                              {alert.type.replace('_', ' ')}
                            </span>
                            <div className="text-xs text-gray-400">
                              {new Date(alert.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => resolveAlert(alert.id)}
                          className="text-green-400 hover:text-green-300"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Emergency Resources */}
              {subscriptionTier !== 'free' && (
                <div className="border-t border-gray-700 pt-4">
                  <h5 className="text-md font-semibold text-white mb-3 flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-red-400" />
                    Need More Support?
                  </h5>
                  <div className="flex space-x-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onSupportRequest('peer_support')}
                      className="border-blue-600 text-blue-400"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Peer Support
                    </Button>
                    
                    {subscriptionTier === 'premium' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onSupportRequest('professional_referral')}
                        className="border-purple-600 text-purple-400"
                      >
                        <HelpCircle className="h-4 w-4 mr-2" />
                        Professional Help
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Support Resource Modal */}
      {activeResource && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="w-96 bg-gray-900 border-gray-700 max-h-[80vh] overflow-y-auto">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">{activeResource.title}</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setActiveResource(null)}
                  className="text-gray-400"
                >
                  ×
                </Button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{activeResource.estimated_duration}</span>
                  </div>
                  {activeResource.difficulty_level && (
                    <Badge variant="outline" className="text-xs">
                      {activeResource.difficulty_level}
                    </Badge>
                  )}
                </div>

                <p className="text-gray-300 leading-relaxed">
                  {activeResource.content}
                </p>

                <div className="flex items-center space-x-3 pt-4">
                  <Button
                    onClick={() => {
                      setActiveResource(null);
                      toast.success('Resource completed. Take your time to transition back.');
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Done
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => setActiveResource(null)}
                    className="border-gray-600 text-gray-300"
                  >
                    Maybe Later
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PsychologicalSafetyFramework;