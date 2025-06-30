'use client';

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Users, 
  Clock, 
  Star, 
  Filter, 
  Search, 
  Play, 
  Eye,
  ChevronRight,
  Building,
  Heart,
  Wrench,
  Monitor,
  Stethoscope,
  HardHat,
  ShoppingCart,
  GraduationCap,
  Scale,
  Banknote,
  Car,
  Globe,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { db } from '@/lib/supabase';
import toast from 'react-hot-toast';

// Types
interface ScenarioCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  scenario_count?: number;
}

interface Scenario {
  id: string;
  title: string;
  subtitle?: string;
  difficulty_level: number;
  estimated_time_minutes: number;
  setting: string;
  situation: string;
  characters: Array<{
    name: string;
    role: string;
    personality: string;
    background?: string;
  }>;
  learning_objectives: string[];
  key_antipatterns: string[];
  complexity_tags: string[];
  average_rating: number;
  usage_count: number;
  category_name: string;
}

interface ScenarioLibraryProps {
  onScenarioSelect: (scenario: Scenario) => void;
  onCreateCustom: () => void;
  userTier: 'free' | 'basic' | 'premium';
}

// Industry icons mapping
const industryIcons: Record<string, React.ReactNode> = {
  'technology': <Monitor className="h-5 w-5" />,
  'healthcare': <Stethoscope className="h-5 w-5" />,
  'construction': <HardHat className="h-5 w-5" />,
  'manufacturing': <Wrench className="h-5 w-5" />,
  'retail': <ShoppingCart className="h-5 w-5" />,
  'education': <GraduationCap className="h-5 w-5" />,
  'legal': <Scale className="h-5 w-5" />,
  'finance': <Banknote className="h-5 w-5" />,
  'hospitality': <Heart className="h-5 w-5" />,
  'transport': <Car className="h-5 w-5" />,
  'consulting': <Globe className="h-5 w-5" />,
  'nonprofit': <Users className="h-5 w-5" />
};

export const ScenarioLibrary: React.FC<ScenarioLibraryProps> = ({
  onScenarioSelect,
  onCreateCustom,
  userTier
}) => {
  const [categories, setCategories] = useState<ScenarioCategory[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'categories' | 'scenarios'>('categories');

  // Load categories
  useEffect(() => {
    loadCategories();
  }, []);

  // Load scenarios when category selected
  useEffect(() => {
    if (selectedCategory) {
      loadScenarios(selectedCategory);
      setView('scenarios');
    }
  }, [selectedCategory]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      
      // Try to load from database first
      try {
        const result = await db.getScenarioCategories();

        if (result && result.data && result.data.length > 0) {
          // Use database data
          const formattedCategories = result.data.map(cat => ({
            id: cat.id,
            name: cat.name,
            description: cat.description || '',
            icon: cat.icon || 'technology',
            color: cat.color || '#3B82F6',
            scenario_count: 0 // We'll get this separately if needed
          }));
          setCategories(formattedCategories);
          console.log('Successfully loaded scenario categories from database:', formattedCategories.length);
          toast.success('Loaded scenario categories from database!');
          return;
        } else if (result && result.error) {
          console.warn('Database error loading scenario categories:', result.error);
        }
      } catch (dbError) {
        console.warn('Database error loading scenario categories:', dbError);
      }

      // Fallback to mock data if database not available
      console.warn('Scenario categories not available in database, using mock data');
      const mockCategories: ScenarioCategory[] = [
        {
          id: 'technology',
          name: 'Technology & IT',
          description: 'Software development teams, DevOps, IT support, and tech leadership challenges',
          icon: 'technology',
          color: '#3B82F6',
          scenario_count: 4
        },
        {
          id: 'healthcare',
          name: 'Healthcare',
          description: 'Medical teams, patient care, hospital administration, and clinical leadership',
          icon: 'healthcare',
          color: '#EF4444',
          scenario_count: 1
        },
        {
          id: 'finance',
          name: 'Finance & Banking',
          description: 'Financial services, investment teams, compliance, and financial leadership',
          icon: 'finance',
          color: '#059669',
          scenario_count: 1
        },
        {
          id: 'retail',
          name: 'Retail & Customer Service',
          description: 'Store operations, customer experience, sales teams, and retail management',
          icon: 'retail',
          color: '#10B981',
          scenario_count: 1
        },
        {
          id: 'consulting',
          name: 'Consulting',
          description: 'Client relationships, project delivery, team dynamics, and consulting leadership',
          icon: 'consulting',
          color: '#06B6D4',
          scenario_count: 20
        },
        {
          id: 'nonprofit',
          name: 'Non-Profit',
          description: 'Community work, fundraising, volunteer management, and mission-driven leadership',
          icon: 'nonprofit',
          color: '#84CC16',
          scenario_count: 20
        }
      ];

      setCategories(mockCategories);
    } catch (error) {
      console.error('Failed to load categories:', error);
      toast.error('Failed to load scenario categories');
    } finally {
      setLoading(false);
    }
  };

  const loadScenarios = async (categoryId: string) => {
    try {
      setLoading(true);
      
      // For database categories (UUIDs), try to load from database first
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(categoryId);
      
      if (isUUID) {
        try {
          const dbScenarios = await db.getScenarios(categoryId);

          if (dbScenarios && dbScenarios.length > 0) {
            // Use database data
            const formattedScenarios = dbScenarios.map(scenario => ({
              id: scenario.id,
              title: scenario.title,
              subtitle: scenario.subtitle,
              difficulty_level: scenario.difficulty_level,
              estimated_time_minutes: scenario.estimated_time_minutes,
              setting: scenario.setting,
              situation: scenario.situation,
              characters: scenario.characters || [],
              learning_objectives: scenario.learning_objectives || [],
              key_antipatterns: scenario.key_antipatterns || [],
              complexity_tags: scenario.complexity_tags || [],
              average_rating: scenario.average_rating || 0,
              usage_count: scenario.usage_count || 0,
              category_name: scenario.scenario_categories?.name || 'Unknown'
            }));
            setScenarios(formattedScenarios);
            toast.success(`Found ${formattedScenarios.length} scenarios!`);
            return;
          }
        } catch (dbError) {
          console.warn('Database error loading scenarios:', dbError);
        }
      }

      // Fallback to mock data for non-UUID categories or when database unavailable
      console.warn('Using mock scenarios for category:', categoryId);
      const mockScenarios: Scenario[] = generateMockScenarios(categoryId);
      setScenarios(mockScenarios);
      toast.success(`Loaded ${mockScenarios.length} demo scenarios!`);
    } catch (error) {
      console.error('Failed to load scenarios:', error);
      // Fallback to mock data on error
      const mockScenarios: Scenario[] = generateMockScenarios(categoryId);
      setScenarios(mockScenarios);
      toast.error('Database unavailable, showing demo scenarios');
    } finally {
      setLoading(false);
    }
  };

  // Generate mock scenarios for demonstration
  const generateMockScenarios = (categoryId: string): Scenario[] => {
    const categoryData = categories.find(c => c.id === categoryId);
    if (!categoryData) return [];

    // This would be replaced with real data from the database
    const scenarios: Scenario[] = [];
    
    for (let i = 1; i <= 20; i++) {
      scenarios.push({
        id: `${categoryId}_scenario_${i}`,
        title: `${categoryData.name} Challenge ${i}`,
        subtitle: `A complex ${categoryData.name.toLowerCase()} situation requiring careful navigation`,
        difficulty_level: Math.floor(Math.random() * 5) + 1,
        estimated_time_minutes: 30 + (Math.floor(Math.random() * 6) * 15),
        setting: `A ${categoryData.name.toLowerCase()} environment with typical operational challenges`,
        situation: `Team dynamics and operational issues that commonly occur in ${categoryData.name.toLowerCase()} settings`,
        characters: [
          {
            name: 'Alex Johnson',
            role: 'Team Lead',
            personality: 'Analytical, sometimes impatient with slower team members'
          },
          {
            name: 'Sam Wilson',
            role: 'Senior Team Member',
            personality: 'Experienced but resistant to new methods'
          },
          {
            name: 'Jordan Kim',
            role: 'New Team Member',
            personality: 'Eager to learn but overwhelmed by complexity'
          }
        ],
        learning_objectives: [
          'Identify communication breakdowns',
          'Recognize power dynamics',
          'Practice intervention strategies'
        ],
        key_antipatterns: ['Communication Breakdown', 'Micromanagement', 'Blame Culture'],
        complexity_tags: ['interpersonal', 'process', 'leadership'],
        average_rating: 3.5 + Math.random() * 1.5,
        usage_count: Math.floor(Math.random() * 150) + 10,
        category_name: categoryData.name
      });
    }
    
    return scenarios;
  };

  const filteredScenarios = scenarios.filter(scenario => {
    const matchesSearch = searchTerm === '' || 
      scenario.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scenario.situation.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDifficulty = difficultyFilter === null || 
      scenario.difficulty_level === difficultyFilter;
    
    return matchesSearch && matchesDifficulty;
  });

  const getDifficultyColor = (level: number) => {
    const colors = ['text-green-500', 'text-blue-500', 'text-yellow-500', 'text-orange-500', 'text-red-500'];
    return colors[level - 1] || 'text-gray-500';
  };

  const getDifficultyLabel = (level: number) => {
    const labels = ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Master'];
    return labels[level - 1] || 'Unknown';
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading scenario library...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center">
            <BookOpen className="h-6 w-6 mr-2 text-blue-400" />
            Scenario Library
          </h2>
          <p className="text-gray-400 mt-1">
            Real-world workplace challenges for hexies practice
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {view === 'scenarios' && (
            <Button
              variant="outline"
              onClick={() => {
                setView('categories');
                setSelectedCategory(null);
                setScenarios([]);
              }}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Back to Categories
            </Button>
          )}
          <Button
            onClick={onCreateCustom}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Custom
          </Button>
        </div>
      </div>

      {/* Categories View */}
      {view === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Card 
              key={category.id}
              className="bg-gray-800/50 border-gray-700 hover:bg-gray-700/50 transition-all cursor-pointer group"
              onClick={() => setSelectedCategory(category.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div 
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: `${category.color}20` }}
                  >
                    <div style={{ color: category.color }}>
                      {industryIcons[category.icon] || <Building className="h-5 w-5" />}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
                </div>
                <CardTitle className="text-white text-lg">
                  {category.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                  {category.description}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <Badge variant="outline" className="text-gray-300 border-gray-600">
                    {category.scenario_count} scenarios
                  </Badge>
                  <div className="flex items-center space-x-1 text-gray-400">
                    <Users className="h-4 w-4" />
                    <span>Team Learning</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Scenarios View */}
      {view === 'scenarios' && (
        <div className="space-y-6">
          {/* Filters */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search scenarios..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <select
                    value={difficultyFilter || ''}
                    onChange={(e) => setDifficultyFilter(e.target.value ? parseInt(e.target.value) : null)}
                    className="bg-gray-700 border-gray-600 text-white rounded-md px-3 py-2"
                  >
                    <option value="">All Difficulties</option>
                    <option value="1">Beginner</option>
                    <option value="2">Intermediate</option>
                    <option value="3">Advanced</option>
                    <option value="4">Expert</option>
                    <option value="5">Master</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scenarios Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredScenarios.map((scenario) => (
              <Card 
                key={scenario.id}
                className="bg-gray-800/50 border-gray-700 hover:bg-gray-700/50 transition-all"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-white text-lg mb-1">
                        {scenario.title}
                      </CardTitle>
                      {scenario.subtitle && (
                        <p className="text-gray-400 text-sm">
                          {scenario.subtitle}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="outline" 
                        className={`${getDifficultyColor(scenario.difficulty_level)} border-current`}
                      >
                        {getDifficultyLabel(scenario.difficulty_level)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                    {scenario.situation}
                  </p>
                  
                  <div className="space-y-3">
                    {/* Characters */}
                    <div>
                      <p className="text-xs font-medium text-gray-400 mb-1">Characters:</p>
                      <div className="flex flex-wrap gap-1">
                        {scenario.characters.slice(0, 3).map((character, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {character.name}
                          </Badge>
                        ))}
                        {scenario.characters.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{scenario.characters.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Key Antipatterns */}
                    <div>
                      <p className="text-xs font-medium text-gray-400 mb-1">Key Antipatterns:</p>
                      <div className="flex flex-wrap gap-1">
                        {scenario.key_antipatterns.slice(0, 2).map((pattern, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs text-red-400 border-red-400/50">
                            {pattern}
                          </Badge>
                        ))}
                        {scenario.key_antipatterns.length > 2 && (
                          <Badge variant="outline" className="text-xs text-red-400 border-red-400/50">
                            +{scenario.key_antipatterns.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Meta Info */}
                    <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-700">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{scenario.estimated_time_minutes}m</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="h-3 w-3" />
                          <span>{scenario.average_rating.toFixed(1)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Eye className="h-3 w-3" />
                          <span>{scenario.usage_count}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => onScenarioSelect(scenario)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Start
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredScenarios.length === 0 && (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No scenarios found</h3>
                <p className="text-gray-400">
                  Try adjusting your search terms or filters
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};