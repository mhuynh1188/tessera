'use client';

import React, { useState } from 'react';
import { 
  BookOpen, 
  Users, 
  Clock, 
  Target, 
  AlertTriangle, 
  Lightbulb,
  Play,
  Pause,
  RotateCcw,
  MessageSquare,
  CheckCircle,
  Star,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import toast from 'react-hot-toast';

interface Character {
  name: string;
  role: string;
  personality: string;
  background?: string;
}

interface Scenario {
  id: string;
  title: string;
  subtitle?: string;
  difficulty_level: number;
  estimated_time_minutes: number;
  setting: string;
  situation: string;
  characters: Character[];
  background_context?: string;
  underlying_tensions?: string;
  learning_objectives: string[];
  key_antipatterns: string[];
  discussion_prompts?: string[];
  intervention_hints?: string[];
  success_indicators?: string[];
  complexity_tags: string[];
  category_name: string;
}

interface ScenarioViewerProps {
  scenario: Scenario;
  onClose: () => void;
  onStartPractice: (scenario: Scenario) => void;
  isInWorkspace?: boolean;
}

export const ScenarioViewer: React.FC<ScenarioViewerProps> = ({
  scenario,
  onClose,
  onStartPractice,
  isInWorkspace = false
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'characters' | 'learning' | 'facilitator'>('overview');
  const [isStarted, setIsStarted] = useState(false);
  const [timer, setTimer] = useState(0);
  const [sessionNotes, setSessionNotes] = useState('');
  const [expandedCharacter, setExpandedCharacter] = useState<string | null>(null);

  // Timer functionality
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isStarted) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isStarted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (level: number) => {
    const colors = ['text-green-500', 'text-blue-500', 'text-yellow-500', 'text-orange-500', 'text-red-500'];
    return colors[level - 1] || 'text-gray-500';
  };

  const getDifficultyLabel = (level: number) => {
    const labels = ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Master'];
    return labels[level - 1] || 'Unknown';
  };

  const handleStartPractice = () => {
    setIsStarted(true);
    onStartPractice(scenario);
    toast.success('Scenario started! Begin placing hexies to explore the situation.');
  };

  const handleEndSession = () => {
    setIsStarted(false);
    setTimer(0);
    toast.success('Session ended. Great work exploring this scenario!');
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'characters', label: 'Characters', icon: Users },
    { id: 'learning', label: 'Learning', icon: Target },
    { id: 'facilitator', label: 'Facilitator', icon: MessageSquare }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto bg-gray-900 text-white rounded-xl shadow-2xl">
      {/* Header */}
      <div className="border-b border-gray-700 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <Badge variant="outline" className="text-blue-400 border-blue-400">
                {scenario.category_name}
              </Badge>
              <Badge 
                variant="outline" 
                className={`${getDifficultyColor(scenario.difficulty_level)} border-current`}
              >
                {getDifficultyLabel(scenario.difficulty_level)}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">
              {scenario.title}
            </h1>
            {scenario.subtitle && (
              <p className="text-gray-400 text-lg">
                {scenario.subtitle}
              </p>
            )}
            <div className="flex items-center space-x-4 mt-3 text-sm text-gray-400">
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{scenario.estimated_time_minutes}m estimated</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>{scenario.characters.length} characters</span>
              </div>
              {isStarted && (
                <div className="flex items-center space-x-1 text-green-400">
                  <Play className="h-4 w-4" />
                  <span>{formatTime(timer)}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {!isStarted ? (
              <Button
                onClick={handleStartPractice}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Practice
              </Button>
            ) : (
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => setIsStarted(false)}
                  variant="outline"
                  className="border-yellow-600 text-yellow-400 hover:bg-yellow-600/10"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
                <Button
                  onClick={handleEndSession}
                  variant="outline"
                  className="border-red-600 text-red-400 hover:bg-red-600/10"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  End Session
                </Button>
              </div>
            )}
            {!isInWorkspace && (
              <Button
                variant="ghost"
                onClick={onClose}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-700">
        <div className="flex space-x-1 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Setting */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-blue-400" />
                  Setting
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 leading-relaxed">
                  {scenario.setting}
                </p>
              </CardContent>
            </Card>

            {/* Main Situation */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-orange-400" />
                  The Situation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 leading-relaxed">
                  {scenario.situation}
                </p>
              </CardContent>
            </Card>

            {/* Background Context */}
            {scenario.background_context && (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Lightbulb className="h-5 w-5 mr-2 text-yellow-400" />
                    Background Context
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 leading-relaxed">
                    {scenario.background_context}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Key Antipatterns */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Target className="h-5 w-5 mr-2 text-red-400" />
                  Key Antipatterns to Explore
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {scenario.key_antipatterns.map((pattern, index) => (
                    <Badge 
                      key={index} 
                      variant="outline" 
                      className="text-red-400 border-red-400/50 bg-red-400/10"
                    >
                      {pattern}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'characters' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              Meet the Characters
            </h3>
            {scenario.characters.map((character, index) => (
              <Card key={index} className="bg-gray-800/50 border-gray-700">
                <CardHeader className="pb-3">
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedCharacter(
                      expandedCharacter === character.name ? null : character.name
                    )}
                  >
                    <div>
                      <CardTitle className="text-white text-lg">
                        {character.name}
                      </CardTitle>
                      <p className="text-blue-400 text-sm font-medium">
                        {character.role}
                      </p>
                    </div>
                    {expandedCharacter === character.name ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </CardHeader>
                {expandedCharacter === character.name && (
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-medium text-gray-400 mb-1">Personality</h4>
                        <p className="text-gray-300 text-sm">
                          {character.personality}
                        </p>
                      </div>
                      {character.background && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-400 mb-1">Background</h4>
                          <p className="text-gray-300 text-sm">
                            {character.background}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'learning' && (
          <div className="space-y-6">
            {/* Learning Objectives */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Target className="h-5 w-5 mr-2 text-green-400" />
                  Learning Objectives
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {scenario.learning_objectives.map((objective, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300">{objective}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Complexity Tags */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Star className="h-5 w-5 mr-2 text-purple-400" />
                  Complexity Areas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {scenario.complexity_tags.map((tag, index) => (
                    <Badge 
                      key={index} 
                      variant="outline" 
                      className="text-purple-400 border-purple-400/50 bg-purple-400/10 capitalize"
                    >
                      {tag.replace('-', ' ')}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Session Notes */}
            {isStarted && (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2 text-blue-400" />
                    Session Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    placeholder="Record your observations, insights, and hexie placements..."
                    className="bg-gray-700 border-gray-600 text-white min-h-32"
                  />
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'facilitator' && (
          <div className="space-y-6">
            {/* Discussion Prompts */}
            {scenario.discussion_prompts && (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2 text-blue-400" />
                    Discussion Prompts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {scenario.discussion_prompts.map((prompt, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center mt-0.5 flex-shrink-0">
                          {index + 1}
                        </div>
                        <span className="text-gray-300">{prompt}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Underlying Tensions */}
            {scenario.underlying_tensions && (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-orange-400" />
                    Underlying Tensions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 leading-relaxed">
                    {scenario.underlying_tensions}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Success Indicators */}
            {scenario.success_indicators && (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-400" />
                    Success Indicators
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {scenario.success_indicators.map((indicator, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">{indicator}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};