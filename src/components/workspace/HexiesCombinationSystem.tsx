'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Link2, 
  Zap, 
  Target, 
  Lightbulb, 
  Brain,
  Heart,
  CheckCircle,
  AlertTriangle,
  Star,
  Share2,
  Save,
  Trash2,
  RotateCcw,
  Plus,
  Minus,
  Eye,
  EyeOff,
  Award,
  TrendingUp,
  Users,
  Lock,
  Unlock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';

interface HexieInstance {
  id: string;
  hexie_card_id: string;
  position: { x: number; y: number };
  title: string;
  category: string;
  antipattern_type?: string;
  severity_score?: number;
  color_scheme: { primary: string; secondary: string; text: string };
}

interface HexieCombination {
  id: string;
  name: string;
  description: string;
  combination_type: 'intervention' | 'framework' | 'process' | 'insight' | 'solution';
  hexie_instances: string[]; // Array of hexie instance IDs
  connection_strength: number; // 0.1 to 3.0
  effectiveness_score: number; // 0.0 to 5.0
  validation_count: number;
  usage_count: number;
  therapeutic_approach: string[];
  safety_considerations: string[];
  contraindications: string[];
  created_by: string;
  created_at: string;
  is_validated: boolean;
  community_rating?: number;
}

interface CombinationFeedback {
  rating: number; // 1-5
  feedback_type: 'effectiveness' | 'safety' | 'clarity' | 'applicability' | 'innovation';
  comment?: string;
  context: any;
}

interface HexiesCombinationSystemProps {
  hexieInstances: HexieInstance[];
  existingCombinations: HexieCombination[];
  userRole: 'explorer' | 'analyst' | 'facilitator' | 'architect' | 'mentor';
  subscriptionTier: 'free' | 'basic' | 'premium';
  onCombinationCreate: (combination: Omit<HexieCombination, 'id' | 'created_at'>) => void;
  onCombinationUpdate: (id: string, updates: Partial<HexieCombination>) => void;
  onCombinationDelete: (id: string) => void;
  onFeedbackSubmit: (combinationId: string, feedback: CombinationFeedback) => void;
}

export const HexiesCombinationSystem: React.FC<HexiesCombinationSystemProps> = ({
  hexieInstances,
  existingCombinations,
  userRole,
  subscriptionTier,
  onCombinationCreate,
  onCombinationUpdate,
  onCombinationDelete,
  onFeedbackSubmit
}) => {
  const [selectedHexies, setSelectedHexies] = useState<string[]>([]);
  const [isCreatingCombination, setIsCreatingCombination] = useState(false);
  const [showCombinations, setShowCombinations] = useState(true);
  const [selectedCombination, setSelectedCombination] = useState<string | null>(null);
  const [combinationFormData, setCombinationFormData] = useState({
    name: '',
    description: '',
    combination_type: 'intervention' as HexieCombination['combination_type'],
    therapeutic_approach: [] as string[],
    safety_considerations: [] as string[],
    contraindications: [] as string[]
  });

  const canvasRef = useRef<HTMLDivElement>(null);

  // Subscription limits
  const getSubscriptionLimits = () => {
    switch (subscriptionTier) {
      case 'free':
        return { maxCombinations: 5, maxHexiesPerCombination: 3, canShareCombinations: false, canValidateCombinations: false };
      case 'basic':
        return { maxCombinations: 20, maxHexiesPerCombination: 6, canShareCombinations: true, canValidateCombinations: true };
      case 'premium':
        return { maxCombinations: 100, maxHexiesPerCombination: 12, canShareCombinations: true, canValidateCombinations: true };
      default:
        return { maxCombinations: 5, maxHexiesPerCombination: 3, canShareCombinations: false, canValidateCombinations: false };
    }
  };

  const limits = getSubscriptionLimits();

  // Check if hexies can be combined based on proximity and compatibility
  const calculateCombinationStrength = (hexieIds: string[]): number => {
    if (hexieIds.length < 2) return 0;

    const hexies = hexieIds.map(id => hexieInstances.find(h => h.id === id)).filter(Boolean) as HexieInstance[];
    if (hexies.length < 2) return 0;

    // Calculate based on proximity
    let proximityScore = 0;
    for (let i = 0; i < hexies.length; i++) {
      for (let j = i + 1; j < hexies.length; j++) {
        const distance = Math.sqrt(
          Math.pow(hexies[i].position.x - hexies[j].position.x, 2) +
          Math.pow(hexies[i].position.y - hexies[j].position.y, 2)
        );
        proximityScore += Math.max(0, 200 - distance) / 200; // Closer = stronger
      }
    }
    proximityScore = proximityScore / ((hexies.length * (hexies.length - 1)) / 2);

    // Calculate based on category compatibility
    const categories = hexies.map(h => h.category);
    const uniqueCategories = [...new Set(categories)];
    const categoryScore = uniqueCategories.length === 1 ? 1.0 : // Same category
                         uniqueCategories.length === 2 ? 0.8 : // Two categories
                         uniqueCategories.length === 3 ? 0.6 : // Three categories
                         0.4; // More than three categories

    // Calculate based on severity balance (if applicable)
    const severityScores = hexies.map(h => h.severity_score || 0).filter(s => s > 0);
    let severityBalance = 1.0;
    if (severityScores.length > 1) {
      const avgSeverity = severityScores.reduce((a, b) => a + b, 0) / severityScores.length;
      const variance = severityScores.reduce((acc, score) => acc + Math.pow(score - avgSeverity, 2), 0) / severityScores.length;
      severityBalance = Math.max(0.5, 1 - (variance / 5)); // Lower variance = better balance
    }

    const finalStrength = (proximityScore * 0.4 + categoryScore * 0.4 + severityBalance * 0.2) * 3.0;
    return Math.min(3.0, Math.max(0.1, finalStrength));
  };

  // Auto-detect potential combinations
  const detectPotentialCombinations = (): { hexieIds: string[]; strength: number; reason: string }[] => {
    const potentials = [];
    const hexieIds = hexieInstances.map(h => h.id);

    // Check all possible 2-3 hexie combinations
    for (let i = 0; i < hexieIds.length; i++) {
      for (let j = i + 1; j < hexieIds.length; j++) {
        const pair = [hexieIds[i], hexieIds[j]];
        const strength = calculateCombinationStrength(pair);
        
        if (strength > 1.5) {
          const hexie1 = hexieInstances.find(h => h.id === pair[0])!;
          const hexie2 = hexieInstances.find(h => h.id === pair[1])!;
          
          let reason = '';
          if (hexie1.category === hexie2.category) {
            reason = `Same category synergy (${hexie1.category})`;
          } else {
            reason = `Cross-category insight (${hexie1.category} + ${hexie2.category})`;
          }
          
          potentials.push({ hexieIds: pair, strength, reason });
        }

        // Check 3-hexie combinations with high-strength pairs
        if (strength > 2.0) {
          for (let k = j + 1; k < hexieIds.length; k++) {
            const triplet = [hexieIds[i], hexieIds[j], hexieIds[k]];
            const tripletStrength = calculateCombinationStrength(triplet);
            
            if (tripletStrength > 1.8) {
              const hexie3 = hexieInstances.find(h => h.id === triplet[2])!;
              potentials.push({ 
                hexieIds: triplet, 
                strength: tripletStrength, 
                reason: `Multi-dimensional approach (${hexie1.category}, ${hexie2.category}, ${hexie3.category})`
              });
            }
          }
        }
      }
    }

    return potentials.sort((a, b) => b.strength - a.strength).slice(0, 5);
  };

  // Handle hexie selection for combination
  const toggleHexieSelection = (hexieId: string) => {
    setSelectedHexies(prev => {
      const newSelection = prev.includes(hexieId)
        ? prev.filter(id => id !== hexieId)
        : [...prev, hexieId];

      if (newSelection.length > limits.maxHexiesPerCombination) {
        toast.error(`Maximum ${limits.maxHexiesPerCombination} hexies per combination.`);
        return prev;
      }

      return newSelection;
    });
  };

  // Create new combination
  const createCombination = () => {
    if (selectedHexies.length < 2) {
      toast.error('Select at least 2 hexies to create a combination.');
      return;
    }

    if (existingCombinations.length >= limits.maxCombinations) {
      toast.error(`Maximum ${limits.maxCombinations} combinations reached. Upgrade to create more.`);
      return;
    }

    if (!combinationFormData.name.trim()) {
      toast.error('Combination name is required.');
      return;
    }

    const connectionStrength = calculateCombinationStrength(selectedHexies);
    
    const newCombination: Omit<HexieCombination, 'id' | 'created_at'> = {
      name: combinationFormData.name.trim(),
      description: combinationFormData.description.trim(),
      combination_type: combinationFormData.combination_type,
      hexie_instances: selectedHexies,
      connection_strength: connectionStrength,
      effectiveness_score: 0,
      validation_count: 0,
      usage_count: 0,
      therapeutic_approach: combinationFormData.therapeutic_approach,
      safety_considerations: combinationFormData.safety_considerations,
      contraindications: combinationFormData.contraindications,
      created_by: 'current_user', // Replace with actual user ID
      is_validated: false
    };

    onCombinationCreate(newCombination);
    
    // Reset form
    setSelectedHexies([]);
    setIsCreatingCombination(false);
    setCombinationFormData({
      name: '',
      description: '',
      combination_type: 'intervention',
      therapeutic_approach: [],
      safety_considerations: [],
      contraindications: []
    });

    toast.success('🔗 Combination created successfully!');
  };

  // Generate AI-powered combination suggestions
  const generateCombinationSuggestions = (hexieIds: string[]) => {
    const hexies = hexieIds.map(id => hexieInstances.find(h => h.id === id)).filter(Boolean) as HexieInstance[];
    
    const suggestions = {
      name: '',
      description: '',
      therapeutic_approach: [] as string[],
      safety_considerations: [] as string[],
      contraindications: [] as string[]
    };

    // Generate name based on hexie titles and categories
    const categories = [...new Set(hexies.map(h => h.category))];
    if (categories.length === 1) {
      suggestions.name = `${categories[0]} Integration Framework`;
    } else {
      suggestions.name = `${categories.slice(0, 2).join('-')} Synthesis Approach`;
    }

    // Generate description
    const primaryHexie = hexies[0];
    suggestions.description = `A ${combinationFormData.combination_type} combining ${hexies.map(h => h.title).join(', ')} to address complex workplace challenges through multi-dimensional intervention.`;

    // Suggest therapeutic approaches based on categories
    if (categories.includes('emotional')) {
      suggestions.therapeutic_approach.push('emotion_regulation', 'mindfulness_based');
    }
    if (categories.includes('cognitive')) {
      suggestions.therapeutic_approach.push('cognitive_restructuring', 'problem_solving');
    }
    if (categories.includes('behavioral')) {
      suggestions.therapeutic_approach.push('behavior_modification', 'skills_training');
    }
    if (categories.includes('communication')) {
      suggestions.therapeutic_approach.push('communication_skills', 'conflict_resolution');
    }

    // Safety considerations based on severity
    const maxSeverity = Math.max(...hexies.map(h => h.severity_score || 0));
    if (maxSeverity >= 4) {
      suggestions.safety_considerations.push('High-severity situation - consider professional support');
    }
    if (hexies.length > 3) {
      suggestions.safety_considerations.push('Complex intervention - monitor for overwhelm');
    }

    return suggestions;
  };

  // Apply AI suggestions
  const applySuggestions = () => {
    if (selectedHexies.length < 2) return;
    
    const suggestions = generateCombinationSuggestions(selectedHexies);
    setCombinationFormData(prev => ({
      ...prev,
      name: suggestions.name,
      description: suggestions.description,
      therapeutic_approach: suggestions.therapeutic_approach,
      safety_considerations: suggestions.safety_considerations
    }));
    
    toast.success('AI suggestions applied!');
  };

  // Get combination effectiveness color
  const getEffectivenessColor = (score: number): string => {
    if (score >= 4.5) return 'text-green-400';
    if (score >= 3.5) return 'text-blue-400';
    if (score >= 2.5) return 'text-yellow-400';
    if (score >= 1.5) return 'text-orange-400';
    return 'text-red-400';
  };

  const getCombinationTypeIcon = (type: HexieCombination['combination_type']) => {
    const icons = {
      intervention: Target,
      framework: Brain,
      process: TrendingUp,
      insight: Lightbulb,
      solution: CheckCircle
    };
    return icons[type];
  };

  const potentialCombinations = detectPotentialCombinations();
  const connectionStrength = selectedHexies.length >= 2 ? calculateCombinationStrength(selectedHexies) : 0;

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Hexies Combination System</h2>
              <p className="text-gray-400">Create novel solutions by combining hexies in meaningful ways</p>
            </div>
            
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="text-gray-300">
                {existingCombinations.length}/{limits.maxCombinations} combinations
              </Badge>
              
              <Button
                variant="outline"
                onClick={() => setShowCombinations(!showCombinations)}
                className="border-gray-600"
              >
                {showCombinations ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {showCombinations ? 'Hide' : 'Show'} Combinations
              </Button>
              
              <Button
                onClick={() => setIsCreatingCombination(true)}
                disabled={selectedHexies.length < 2 || existingCombinations.length >= limits.maxCombinations}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Combination
              </Button>
            </div>
          </div>

          {/* Selection status */}
          {selectedHexies.length > 0 && (
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Link2 className="h-5 w-5 text-blue-400" />
                  <span className="text-blue-300">
                    {selectedHexies.length} hexie{selectedHexies.length !== 1 ? 's' : ''} selected
                  </span>
                  {connectionStrength > 0 && (
                    <Badge className="bg-blue-500/20 text-blue-300">
                      Strength: {connectionStrength.toFixed(1)}
                    </Badge>
                  )}
                </div>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedHexies([])}
                  className="text-blue-400 hover:text-blue-300"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hexie selection area */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Select Hexies to Combine</h3>
          
          <div 
            ref={canvasRef}
            className="relative min-h-[300px] bg-gray-900/30 rounded-lg border border-gray-700 overflow-hidden"
          >
            {/* Grid background */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10">
              <defs>
                <pattern id="combination-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="currentColor" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#combination-grid)" />
            </svg>

            {/* Hexie instances */}
            {hexieInstances.map(hexie => {
              const isSelected = selectedHexies.includes(hexie.id);
              
              return (
                <div
                  key={hexie.id}
                  className={`absolute cursor-pointer transition-all duration-200 ${
                    isSelected ? 'ring-2 ring-blue-400 ring-opacity-75 scale-110 z-10' : 'hover:scale-105'
                  }`}
                  style={{
                    left: Math.min(hexie.position.x, window.innerWidth - 120),
                    top: Math.min(hexie.position.y, 250),
                    transform: isSelected ? 'scale(1.1)' : 'scale(1)'
                  }}
                  onClick={() => toggleHexieSelection(hexie.id)}
                >
                  <Card className={`w-24 h-24 ${
                    isSelected ? 'bg-blue-600/20 border-blue-400' : 'bg-gray-800/90 border-gray-600'
                  } hover:border-gray-500 transition-all`}>
                    <CardContent className="p-2 h-full flex flex-col">
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center mb-1"
                        style={{ backgroundColor: hexie.color_scheme.primary }}
                      >
                        <span className="text-xs text-white">H</span>
                      </div>
                      
                      <h4 className="text-xs font-medium text-white mb-1 line-clamp-2">
                        {hexie.title}
                      </h4>
                      
                      <span className="text-xs text-gray-400">{hexie.category}</span>
                      
                      {isSelected && (
                        <div className="absolute -top-1 -right-1">
                          <CheckCircle className="h-4 w-4 text-blue-400 bg-gray-900 rounded-full" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })}

            {/* Connection lines for selected hexies */}
            {selectedHexies.length > 1 && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {selectedHexies.map((hexieId, index) => {
                  if (index === selectedHexies.length - 1) return null;
                  
                  const hexie1 = hexieInstances.find(h => h.id === hexieId);
                  const hexie2 = hexieInstances.find(h => h.id === selectedHexies[index + 1]);
                  
                  if (!hexie1 || !hexie2) return null;
                  
                  return (
                    <line
                      key={`${hexieId}-${selectedHexies[index + 1]}`}
                      x1={hexie1.position.x + 48}
                      y1={hexie1.position.y + 48}
                      x2={hexie2.position.x + 48}
                      y2={hexie2.position.y + 48}
                      stroke="#3b82f6"
                      strokeWidth="2"
                      strokeOpacity="0.6"
                      strokeDasharray="5,5"
                    />
                  );
                })}
              </svg>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Potential combinations suggestions */}
      {potentialCombinations.length > 0 && (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Zap className="h-5 w-5 mr-2 text-yellow-400" />
              AI-Detected Potential Combinations
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {potentialCombinations.slice(0, 4).map((potential, index) => (
                <div 
                  key={index}
                  className="p-4 bg-gray-700/50 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors cursor-pointer"
                  onClick={() => setSelectedHexies(potential.hexieIds)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-yellow-500/20 text-yellow-300">
                      Strength: {potential.strength.toFixed(1)}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {potential.hexieIds.length} hexies
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-300 mb-2">{potential.reason}</p>
                  
                  <div className="flex flex-wrap gap-1">
                    {potential.hexieIds.map(hexieId => {
                      const hexie = hexieInstances.find(h => h.id === hexieId);
                      return hexie ? (
                        <span key={hexieId} className="text-xs bg-gray-600/50 text-gray-300 px-2 py-1 rounded">
                          {hexie.title}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing combinations */}
      {showCombinations && existingCombinations.length > 0 && (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Your Combinations</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {existingCombinations.map(combination => {
                const TypeIcon = getCombinationTypeIcon(combination.combination_type);
                const hexieCount = combination.hexie_instances.length;
                
                return (
                  <Card 
                    key={combination.id} 
                    className="bg-gray-700/50 border-gray-600 hover:border-gray-500 transition-colors"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <TypeIcon className="h-5 w-5 text-blue-400" />
                          <h4 className="font-semibold text-white">{combination.name}</h4>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {combination.is_validated && (
                            <CheckCircle className="h-4 w-4 text-green-400" />
                          )}
                          <Badge variant="outline" className="text-xs">
                            {combination.combination_type}
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-300 mb-3 line-clamp-2">
                        {combination.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
                        <span>{hexieCount} hexies</span>
                        <span>Strength: {combination.connection_strength.toFixed(1)}</span>
                        {combination.effectiveness_score > 0 && (
                          <span className={getEffectivenessColor(combination.effectiveness_score)}>
                            ★ {combination.effectiveness_score.toFixed(1)}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedCombination(
                              selectedCombination === combination.id ? null : combination.id
                            )}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {limits.canShareCombinations && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  `Check out this combination: ${combination.name} - ${combination.description}`
                                );
                                toast.success('Combination copied to clipboard!');
                              }}
                              className="text-green-400 hover:text-green-300"
                            >
                              <Share2 className="h-4 w-4" />
                            </Button>
                          )}
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onCombinationDelete(combination.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          Used {combination.usage_count} times
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create combination modal */}
      {isCreatingCombination && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="w-[600px] max-h-[80vh] overflow-y-auto bg-gray-900 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Create New Combination</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsCreatingCombination(false)}
                  className="text-gray-400"
                >
                  ×
                </Button>
              </div>

              <div className="space-y-6">
                {/* Selected hexies preview */}
                <div>
                  <h4 className="text-md font-semibold text-white mb-3">Selected Hexies ({selectedHexies.length})</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedHexies.map(hexieId => {
                      const hexie = hexieInstances.find(h => h.id === hexieId);
                      return hexie ? (
                        <div key={hexieId} className="flex items-center space-x-2 bg-gray-700/50 px-3 py-2 rounded">
                          <span className="text-sm text-white">{hexie.title}</span>
                          <button
                            onClick={() => toggleHexieSelection(hexieId)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                        </div>
                      ) : null;
                    })}
                  </div>
                  
                  {connectionStrength > 0 && (
                    <div className="mt-2">
                      <Badge className={`${
                        connectionStrength > 2.5 ? 'bg-green-500/20 text-green-400' :
                        connectionStrength > 1.5 ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        Connection Strength: {connectionStrength.toFixed(1)}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Basic information */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Combination Name *
                    </label>
                    <input
                      type="text"
                      value={combinationFormData.name}
                      onChange={(e) => setCombinationFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter a descriptive name for this combination"
                      className="w-full p-3 bg-gray-800 border border-gray-600 rounded text-white"
                      maxLength={100}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Type
                    </label>
                    <select
                      value={combinationFormData.combination_type}
                      onChange={(e) => setCombinationFormData(prev => ({ 
                        ...prev, 
                        combination_type: e.target.value as HexieCombination['combination_type']
                      }))}
                      className="w-full p-3 bg-gray-800 border border-gray-600 rounded text-white"
                    >
                      <option value="intervention">Intervention - Direct action approach</option>
                      <option value="framework">Framework - Structured thinking model</option>
                      <option value="process">Process - Step-by-step methodology</option>
                      <option value="insight">Insight - Understanding or revelation</option>
                      <option value="solution">Solution - Problem resolution approach</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={combinationFormData.description}
                      onChange={(e) => setCombinationFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe how these hexies work together and what they achieve"
                      className="w-full p-3 bg-gray-800 border border-gray-600 rounded text-white resize-none"
                      rows={3}
                      maxLength={500}
                    />
                  </div>
                </div>

                {/* AI suggestions */}
                {selectedHexies.length >= 2 && (
                  <div className="border-t border-gray-700 pt-4">
                    <Button
                      variant="outline"
                      onClick={applySuggestions}
                      className="border-purple-600 text-purple-400 hover:bg-purple-600/10"
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      Apply AI Suggestions
                    </Button>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center justify-end space-x-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreatingCombination(false)}
                    className="border-gray-600 text-gray-300"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={createCombination}
                    disabled={selectedHexies.length < 2 || !combinationFormData.name.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Create Combination
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

export default HexiesCombinationSystem;