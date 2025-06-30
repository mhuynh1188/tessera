'use client';

import React, { useState } from 'react';
import { 
  X, 
  Users, 
  Clock, 
  Star, 
  ChevronDown, 
  ChevronUp,
  Target,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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
  background_context?: string;
  underlying_tensions?: string;
  characters: Character[];
  learning_objectives: string[];
  key_antipatterns: string[];
  complexity_tags: string[];
  suggested_hexies: string[];
  discussion_prompts?: string[];
  intervention_hints?: string[];
  success_indicators?: string[];
  average_rating: number;
  usage_count: number;
  category_name: string;
}

interface ScenarioCardProps {
  scenario: Scenario;
  onClose: () => void;
  onStartSession: (scenario: Scenario) => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

export const ScenarioCard: React.FC<ScenarioCardProps> = ({
  scenario,
  onClose,
  onStartSession,
  isMinimized = false,
  onToggleMinimize
}) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [showSpoilers, setShowSpoilers] = useState(false);

  const getDifficultyColor = (level: number) => {
    const colors = ['text-green-400', 'text-blue-400', 'text-yellow-400', 'text-orange-400', 'text-red-400'];
    return colors[level - 1] || 'text-gray-400';
  };

  const getDifficultyLabel = (level: number) => {
    const labels = ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Master'];
    return labels[level - 1] || 'Unknown';
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  if (isMinimized) {
    return (
      <Card className="fixed top-20 right-4 w-80 bg-gray-900/95 backdrop-blur-xl border-gray-700 shadow-2xl z-40">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-400" />
              <h3 className="text-lg font-bold text-white truncate">{scenario.title}</h3>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleMinimize}
                className="text-gray-400 hover:text-white p-1"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-400">
            <span className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {scenario.estimated_time_minutes}m
            </span>
            <span className="flex items-center">
              <Users className="h-3 w-3 mr-1" />
              {scenario.characters.length}
            </span>
            <Badge className={getDifficultyColor(scenario.difficulty_level)}>
              {getDifficultyLabel(scenario.difficulty_level)}
            </Badge>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="fixed top-20 right-4 w-96 max-h-[calc(100vh-100px)] bg-gray-900/95 backdrop-blur-xl border-gray-700 shadow-2xl z-40 overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 mr-3">
            <div className="flex items-center space-x-2 mb-2">
              <Target className="h-5 w-5 text-blue-400" />
              <Badge variant="outline" className="text-xs">
                {scenario.category_name}
              </Badge>
            </div>
            <h3 className="text-xl font-bold text-white mb-1">{scenario.title}</h3>
            {scenario.subtitle && (
              <p className="text-gray-300 text-sm">{scenario.subtitle}</p>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleMinimize}
              className="text-gray-400 hover:text-white p-1"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-sm text-gray-400">
          <span className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            {scenario.estimated_time_minutes} minutes
          </span>
          <span className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            {scenario.characters.length} characters
          </span>
          <span className="flex items-center">
            <Star className="h-4 w-4 mr-1 text-yellow-400" />
            {scenario.average_rating.toFixed(1)}
          </span>
          <Badge className={getDifficultyColor(scenario.difficulty_level)}>
            {getDifficultyLabel(scenario.difficulty_level)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="overflow-y-auto max-h-[calc(100vh-250px)]">
        <div className="space-y-6">
          {/* Setting */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-2">Setting</h4>
            <p className="text-gray-300 text-sm leading-relaxed">{scenario.setting}</p>
          </div>

          {/* Situation */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-2">The Situation</h4>
            <p className="text-gray-300 text-sm leading-relaxed">{scenario.situation}</p>
          </div>

          {/* Characters */}
          <div>
            <button
              onClick={() => toggleSection('characters')}
              className="flex items-center justify-between w-full text-left"
            >
              <h4 className="text-lg font-semibold text-white">Characters</h4>
              {expandedSection === 'characters' ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </button>
            {expandedSection === 'characters' && (
              <div className="mt-3 space-y-3">
                {scenario.characters.map((character, index) => (
                  <div key={index} className="p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <h5 className="font-semibold text-white">{character.name}</h5>
                      <Badge variant="outline" className="text-xs">
                        {character.role}
                      </Badge>
                    </div>
                    <p className="text-gray-300 text-xs">{character.personality}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Learning Objectives */}
          <div>
            <button
              onClick={() => toggleSection('objectives')}
              className="flex items-center justify-between w-full text-left"
            >
              <h4 className="text-lg font-semibold text-white flex items-center">
                <Target className="h-4 w-4 mr-2 text-blue-400" />
                Learning Objectives
              </h4>
              {expandedSection === 'objectives' ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </button>
            {expandedSection === 'objectives' && (
              <ul className="mt-3 space-y-2">
                {scenario.learning_objectives.map((objective, index) => (
                  <li key={index} className="flex items-start text-gray-300 text-sm">
                    <CheckCircle className="h-3 w-3 mr-2 mt-1 text-green-400 flex-shrink-0" />
                    {objective}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Key Antipatterns */}
          <div>
            <button
              onClick={() => toggleSection('antipatterns')}
              className="flex items-center justify-between w-full text-left"
            >
              <h4 className="text-lg font-semibold text-white flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2 text-orange-400" />
                Key Antipatterns
              </h4>
              {expandedSection === 'antipatterns' ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </button>
            {expandedSection === 'antipatterns' && (
              <ul className="mt-3 space-y-2">
                {scenario.key_antipatterns.map((antipattern, index) => (
                  <li key={index} className="flex items-start text-gray-300 text-sm">
                    <AlertTriangle className="h-3 w-3 mr-2 mt-1 text-orange-400 flex-shrink-0" />
                    {antipattern}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Suggested Hexies */}
          {scenario.suggested_hexies && scenario.suggested_hexies.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-white mb-2 flex items-center">
                <Lightbulb className="h-4 w-4 mr-2 text-yellow-400" />
                Suggested Hexies
              </h4>
              <div className="flex flex-wrap gap-2">
                {scenario.suggested_hexies.map((hexie, index) => (
                  <Badge key={index} variant="outline" className="text-yellow-300 border-yellow-400">
                    {hexie}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Spoiler Sections */}
          {(scenario.background_context || scenario.underlying_tensions || 
            scenario.discussion_prompts || scenario.intervention_hints) && (
            <div className="border-t border-gray-700 pt-4">
              <button
                onClick={() => setShowSpoilers(!showSpoilers)}
                className="flex items-center space-x-2 text-yellow-400 hover:text-yellow-300 transition-colors"
              >
                {showSpoilers ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span className="text-sm font-medium">
                  {showSpoilers ? 'Hide' : 'Show'} Facilitator Insights
                </span>
              </button>
              
              {showSpoilers && (
                <div className="mt-4 space-y-4 p-4 bg-yellow-400/10 border border-yellow-400/20 rounded-lg">
                  {scenario.background_context && (
                    <div>
                      <h5 className="font-semibold text-yellow-300 mb-2">Background Context</h5>
                      <p className="text-gray-300 text-sm">{scenario.background_context}</p>
                    </div>
                  )}
                  
                  {scenario.underlying_tensions && (
                    <div>
                      <h5 className="font-semibold text-yellow-300 mb-2">Underlying Tensions</h5>
                      <p className="text-gray-300 text-sm">{scenario.underlying_tensions}</p>
                    </div>
                  )}
                  
                  {scenario.intervention_hints && scenario.intervention_hints.length > 0 && (
                    <div>
                      <h5 className="font-semibold text-yellow-300 mb-2">Intervention Hints</h5>
                      <ul className="space-y-1">
                        {scenario.intervention_hints.map((hint, index) => (
                          <li key={index} className="text-gray-300 text-sm">• {hint}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Complexity Tags */}
          {scenario.complexity_tags && scenario.complexity_tags.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-400 mb-2">Complexity Tags</h4>
              <div className="flex flex-wrap gap-1">
                {scenario.complexity_tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-6 pt-4 border-t border-gray-700">
          <Button
            onClick={() => onStartSession(scenario)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
          >
            Start Working with This Scenario
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};