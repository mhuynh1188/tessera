'use client';

import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Brain, 
  Users, 
  Lightbulb, 
  Award,
  Star,
  TrendingUp,
  CheckCircle,
  Lock,
  Unlock,
  BookOpen,
  Zap,
  Crown,
  Shield,
  Eye,
  MessageSquare,
  Settings,
  BarChart3,
  Compass
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';

// Role definitions based on Jordan Peterson's competence hierarchy
type UserRole = 'explorer' | 'analyst' | 'facilitator' | 'architect' | 'mentor';

interface CompetencyScores {
  pattern_recognition: number;
  emotional_intelligence: number;
  systems_thinking: number;
  intervention_design: number;
  psychological_safety: number;
  group_facilitation: number;
}

interface UserCompetency {
  user_id: string;
  primary_role: UserRole;
  competency_scores: CompetencyScores;
  total_experience: number;
  current_level: number;
  badges_earned: string[];
  interaction_preferences: {
    anonymous_mode: boolean;
    feedback_style: 'direct' | 'collaborative' | 'supportive';
    challenge_level: 'easy' | 'moderate' | 'challenging';
    support_level: 'minimal' | 'standard' | 'comprehensive';
  };
}

interface RoleChallenge {
  id: string;
  role: UserRole;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  competency_focus: keyof CompetencyScores;
  experience_reward: number;
  badge_unlock?: string;
  prerequisites?: string[];
  estimated_time: string;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  unlocked_at?: number;
}

interface RoleBasedGameplayMechanicsProps {
  userCompetency: UserCompetency;
  onCompetencyUpdate: (updates: Partial<UserCompetency>) => void;
  onChallengeComplete: (challengeId: string, success: boolean) => void;
  availableChallenges: RoleChallenge[];
  availableBadges: Badge[];
  sessionProgress: {
    hexies_placed: number;
    patterns_identified: number;
    interventions_created: number;
    insights_shared: number;
  };
}

export const RoleBasedGameplayMechanics: React.FC<RoleBasedGameplayMechanicsProps> = ({
  userCompetency,
  onCompetencyUpdate,
  onChallengeComplete,
  availableChallenges,
  availableBadges,
  sessionProgress
}) => {
  const [selectedTab, setSelectedTab] = useState<'dashboard' | 'challenges' | 'progression' | 'badges'>('dashboard');
  const [activeChallenges, setActiveChallenges] = useState<string[]>([]);
  const [showRoleGuide, setShowRoleGuide] = useState(false);

  // Role definitions with competence hierarchies
  const roleDefinitions = {
    explorer: {
      title: 'Explorer',
      description: 'Beginning your journey of pattern discovery',
      icon: Target,
      color: 'text-green-400',
      bgColor: 'bg-green-400/10',
      focus: ['pattern_recognition', 'emotional_intelligence'],
      nextRole: 'analyst',
      level_requirements: { min_level: 1, max_level: 5 }
    },
    analyst: {
      title: 'Analyst',
      description: 'Identifying and understanding complex patterns',
      icon: Brain,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
      focus: ['pattern_recognition', 'systems_thinking'],
      nextRole: 'facilitator',
      level_requirements: { min_level: 5, max_level: 15 }
    },
    facilitator: {
      title: 'Facilitator',
      description: 'Guiding others through complex challenges',
      icon: Users,
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/10',
      focus: ['group_facilitation', 'psychological_safety'],
      nextRole: 'architect',
      level_requirements: { min_level: 15, max_level: 30 }
    },
    architect: {
      title: 'Architect',
      description: 'Designing systematic interventions and solutions',
      icon: Lightbulb,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/10',
      focus: ['intervention_design', 'systems_thinking'],
      nextRole: 'mentor',
      level_requirements: { min_level: 30, max_level: 50 }
    },
    mentor: {
      title: 'Mentor',
      description: 'Teaching and healing others at the highest level',
      icon: Award,
      color: 'text-orange-400',
      bgColor: 'bg-orange-400/10',
      focus: ['psychological_safety', 'group_facilitation', 'emotional_intelligence'],
      nextRole: null,
      level_requirements: { min_level: 50, max_level: 100 }
    }
  };

  const currentRoleDef = roleDefinitions[userCompetency.primary_role];
  const RoleIcon = currentRoleDef.icon;

  // Experience to level conversion
  const experienceToLevel = (exp: number): number => Math.floor(exp / 100) + 1;
  const levelToExperience = (level: number): number => (level - 1) * 100;
  const experienceToNextLevel = (exp: number): number => {
    const currentLevel = experienceToLevel(exp);
    return levelToExperience(currentLevel + 1) - exp;
  };

  // Role progression logic
  const canProgressToNextRole = (): boolean => {
    const currentLevel = userCompetency.current_level;
    const roleReqs = currentRoleDef.level_requirements;
    
    if (!currentRoleDef.nextRole) return false;
    
    // Check if at max level for current role
    if (currentLevel < roleReqs.max_level) return false;
    
    // Check if key competencies are developed
    const keyCompetencies = currentRoleDef.focus;
    return keyCompetencies.every(comp => 
      userCompetency.competency_scores[comp] >= 50
    );
  };

  const progressToNextRole = () => {
    if (!canProgressToNextRole() || !currentRoleDef.nextRole) return;
    
    onCompetencyUpdate({
      primary_role: currentRoleDef.nextRole,
      badges_earned: [...userCompetency.badges_earned, `role_${currentRoleDef.nextRole}`]
    });
    
    toast.success(`🎉 Role advancement! You are now a ${roleDefinitions[currentRoleDef.nextRole].title}!`);
  };

  // Challenge system
  const getEligibleChallenges = (): RoleChallenge[] => {
    return availableChallenges.filter(challenge => {
      // Role-specific challenges
      if (challenge.role !== userCompetency.primary_role) return false;
      
      // Level requirements
      const userLevel = userCompetency.current_level;
      const difficultyLevels = {
        beginner: { min: 1, max: 3 },
        intermediate: { min: 3, max: 8 },
        advanced: { min: 8, max: 15 },
        expert: { min: 15, max: 100 }
      };
      
      const reqLevel = difficultyLevels[challenge.difficulty];
      if (userLevel < reqLevel.min) return false;
      
      // Prerequisites
      if (challenge.prerequisites) {
        return challenge.prerequisites.every(prereq => 
          userCompetency.badges_earned.includes(prereq)
        );
      }
      
      return true;
    });
  };

  const startChallenge = (challengeId: string) => {
    if (!activeChallenges.includes(challengeId)) {
      setActiveChallenges(prev => [...prev, challengeId]);
      toast.success('Challenge started! Complete the objectives to earn experience.');
    }
  };

  const completeChallenge = (challengeId: string, success: boolean) => {
    const challenge = availableChallenges.find(c => c.id === challengeId);
    if (!challenge) return;

    if (success) {
      // Award experience
      const newExp = userCompetency.total_experience + challenge.experience_reward;
      const newLevel = experienceToLevel(newExp);
      
      // Update competency score
      const competencyIncrease = Math.floor(challenge.experience_reward / 10);
      const updatedScores = { ...userCompetency.competency_scores };
      updatedScores[challenge.competency_focus] += competencyIncrease;
      
      // Award badge if applicable
      const newBadges = [...userCompetency.badges_earned];
      if (challenge.badge_unlock && !newBadges.includes(challenge.badge_unlock)) {
        newBadges.push(challenge.badge_unlock);
      }
      
      onCompetencyUpdate({
        total_experience: newExp,
        current_level: newLevel,
        competency_scores: updatedScores,
        badges_earned: newBadges
      });
      
      toast.success(`🎯 Challenge completed! +${challenge.experience_reward} XP`);
    }
    
    setActiveChallenges(prev => prev.filter(id => id !== challengeId));
    onChallengeComplete(challengeId, success);
  };

  // Badge system
  const getUnlockedBadges = (): Badge[] => {
    return availableBadges.filter(badge => 
      userCompetency.badges_earned.includes(badge.id)
    );
  };

  const getBadgeRarityColor = (rarity: Badge['rarity']): string => {
    const colors = {
      common: 'text-gray-400 bg-gray-400/10',
      uncommon: 'text-green-400 bg-green-400/10',
      rare: 'text-blue-400 bg-blue-400/10',
      epic: 'text-purple-400 bg-purple-400/10',
      legendary: 'text-yellow-400 bg-yellow-400/10'
    };
    return colors[rarity];
  };

  const eligibleChallenges = getEligibleChallenges();
  const unlockedBadges = getUnlockedBadges();

  return (
    <div className="space-y-6">
      {/* Role Status Header */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-lg ${currentRoleDef.bgColor}`}>
                <RoleIcon className={`h-8 w-8 ${currentRoleDef.color}`} />
              </div>
              <div>
                <div className="flex items-center space-x-3">
                  <h2 className="text-2xl font-bold text-white">{currentRoleDef.title}</h2>
                  <Badge className={`${currentRoleDef.bgColor} ${currentRoleDef.color}`}>
                    Level {userCompetency.current_level}
                  </Badge>
                </div>
                <p className="text-gray-400 mb-2">{currentRoleDef.description}</p>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-gray-300">
                    {userCompetency.total_experience} XP
                  </span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-300">
                    {experienceToNextLevel(userCompetency.total_experience)} XP to next level
                  </span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-300">
                    {unlockedBadges.length} badges earned
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {canProgressToNextRole() && (
                <Button
                  onClick={progressToNextRole}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Advance Role
                </Button>
              )}
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowRoleGuide(!showRoleGuide)}
                className="border-gray-600"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Role Guide
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
              <span>Level {userCompetency.current_level}</span>
              <span>Level {userCompetency.current_level + 1}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full bg-gradient-to-r ${
                  currentRoleDef.color.includes('green') ? 'from-green-500 to-green-400' :
                  currentRoleDef.color.includes('blue') ? 'from-blue-500 to-blue-400' :
                  currentRoleDef.color.includes('purple') ? 'from-purple-500 to-purple-400' :
                  currentRoleDef.color.includes('yellow') ? 'from-yellow-500 to-yellow-400' :
                  'from-orange-500 to-orange-400'
                }`}
                style={{
                  width: `${((userCompetency.total_experience % 100) / 100) * 100}%`
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex space-x-1 p-1 bg-gray-800/50 rounded-lg">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
          { id: 'challenges', label: 'Challenges', icon: Target },
          { id: 'progression', label: 'Skills', icon: TrendingUp },
          { id: 'badges', label: 'Badges', icon: Award }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md transition-all ${
              selectedTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {selectedTab === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Session Progress */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Session Progress</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Hexies Placed</span>
                  <span className="text-white font-medium">{sessionProgress.hexies_placed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Patterns Identified</span>
                  <span className="text-white font-medium">{sessionProgress.patterns_identified}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Interventions Created</span>
                  <span className="text-white font-medium">{sessionProgress.interventions_created}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Insights Shared</span>
                  <span className="text-white font-medium">{sessionProgress.insights_shared}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Challenges */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Active Challenges</h3>
              {activeChallenges.length === 0 ? (
                <p className="text-gray-400">No active challenges. Start one to earn experience!</p>
              ) : (
                <div className="space-y-3">
                  {activeChallenges.map(challengeId => {
                    const challenge = availableChallenges.find(c => c.id === challengeId);
                    if (!challenge) return null;
                    
                    return (
                      <div key={challengeId} className="p-3 bg-gray-700/50 rounded border border-gray-600">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-white font-medium">{challenge.title}</h4>
                            <p className="text-sm text-gray-400">{challenge.estimated_time}</p>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => completeChallenge(challengeId, true)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => completeChallenge(challengeId, false)}
                              className="border-gray-600"
                            >
                              Skip
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {selectedTab === 'challenges' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">Available Challenges</h3>
            <Badge variant="outline" className="text-gray-300">
              {eligibleChallenges.length} available
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {eligibleChallenges.map(challenge => (
              <Card key={challenge.id} className="bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-lg font-semibold text-white">{challenge.title}</h4>
                      <p className="text-sm text-gray-400 mt-1">{challenge.description}</p>
                    </div>
                    <Badge className={`ml-2 ${
                      challenge.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
                      challenge.difficulty === 'intermediate' ? 'bg-blue-500/20 text-blue-400' :
                      challenge.difficulty === 'advanced' ? 'bg-purple-500/20 text-purple-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {challenge.difficulty}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                    <span>Focus: {challenge.competency_focus.replace('_', ' ')}</span>
                    <span>+{challenge.experience_reward} XP</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">{challenge.estimated_time}</span>
                    <Button
                      size="sm"
                      onClick={() => startChallenge(challenge.id)}
                      disabled={activeChallenges.includes(challenge.id)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {activeChallenges.includes(challenge.id) ? 'Active' : 'Start'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {selectedTab === 'progression' && (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold text-white mb-6">Competency Development</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(userCompetency.competency_scores).map(([competency, score]) => (
                <div key={competency}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-300 capitalize">
                      {competency.replace('_', ' ')}
                    </span>
                    <span className="text-white font-medium">{score}/100</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                      style={{ width: `${score}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {score < 25 ? 'Novice' : score < 50 ? 'Developing' : score < 75 ? 'Proficient' : 'Expert'}
                  </div>
                </div>
              ))}
            </div>

            {/* Role progression path */}
            <div className="mt-8 pt-6 border-t border-gray-700">
              <h4 className="text-lg font-semibold text-white mb-4">Role Progression Path</h4>
              <div className="flex items-center space-x-4 overflow-x-auto">
                {Object.entries(roleDefinitions).map(([roleKey, roleDef], index) => {
                  const isCurrentRole = roleKey === userCompetency.primary_role;
                  const isPastRole = Object.keys(roleDefinitions).indexOf(roleKey) < Object.keys(roleDefinitions).indexOf(userCompetency.primary_role);
                  const RoleIcon = roleDef.icon;
                  
                  return (
                    <div key={roleKey} className="flex items-center">
                      <div className={`flex flex-col items-center p-4 rounded-lg border ${
                        isCurrentRole ? 'border-blue-500 bg-blue-500/10' :
                        isPastRole ? 'border-green-500 bg-green-500/10' :
                        'border-gray-600 bg-gray-700/30'
                      }`}>
                        <RoleIcon className={`h-6 w-6 mb-2 ${
                          isCurrentRole ? 'text-blue-400' :
                          isPastRole ? 'text-green-400' :
                          'text-gray-500'
                        }`} />
                        <span className={`text-sm font-medium ${
                          isCurrentRole ? 'text-blue-400' :
                          isPastRole ? 'text-green-400' :
                          'text-gray-500'
                        }`}>
                          {roleDef.title}
                        </span>
                        <span className="text-xs text-gray-400">
                          L{roleDef.level_requirements.min_level}-{roleDef.level_requirements.max_level}
                        </span>
                        {isPastRole && <CheckCircle className="h-4 w-4 text-green-400 mt-1" />}
                        {isCurrentRole && <Star className="h-4 w-4 text-blue-400 mt-1" />}
                        {!isPastRole && !isCurrentRole && <Lock className="h-4 w-4 text-gray-500 mt-1" />}
                      </div>
                      {index < Object.keys(roleDefinitions).length - 1 && (
                        <div className="w-8 h-0.5 bg-gray-600 mx-2" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedTab === 'badges' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">Badges Earned</h3>
            <Badge variant="outline" className="text-gray-300">
              {unlockedBadges.length}/{availableBadges.length} unlocked
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {availableBadges.map(badge => {
              const isUnlocked = userCompetency.badges_earned.includes(badge.id);
              return (
                <Card 
                  key={badge.id} 
                  className={`bg-gray-800/50 border-gray-700 ${
                    isUnlocked ? 'hover:border-gray-600' : 'opacity-50'
                  } transition-colors`}
                >
                  <CardContent className="p-4 text-center">
                    <div className={`text-4xl mb-2 ${isUnlocked ? '' : 'grayscale'}`}>
                      {badge.icon}
                    </div>
                    <h4 className={`font-semibold mb-1 ${isUnlocked ? 'text-white' : 'text-gray-500'}`}>
                      {badge.name}
                    </h4>
                    <p className={`text-xs mb-2 ${isUnlocked ? 'text-gray-400' : 'text-gray-600'}`}>
                      {badge.description}
                    </p>
                    <Badge className={`text-xs ${getBadgeRarityColor(badge.rarity)}`}>
                      {badge.rarity}
                    </Badge>
                    {!isUnlocked && (
                      <Lock className="h-4 w-4 text-gray-500 mx-auto mt-2" />
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Role Guide Modal */}
      {showRoleGuide && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="w-[600px] max-h-[80vh] overflow-y-auto bg-gray-900 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Role System Guide</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowRoleGuide(false)}
                  className="text-gray-400"
                >
                  ×
                </Button>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-white mb-3">Your Current Role: {currentRoleDef.title}</h4>
                  <p className="text-gray-300 mb-4">{currentRoleDef.description}</p>
                  
                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    <h5 className="font-semibold text-white mb-2">Key Focus Areas:</h5>
                    <ul className="space-y-1">
                      {currentRoleDef.focus.map(competency => (
                        <li key={competency} className="text-gray-300 text-sm">
                          • {competency.replace('_', ' ')}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-white mb-3">Role Progression</h4>
                  <p className="text-gray-300 mb-4">
                    Advance through roles by gaining experience, developing competencies, and completing challenges. 
                    Each role unlocks new capabilities and responsibilities.
                  </p>
                  
                  {currentRoleDef.nextRole && (
                    <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
                      <h5 className="font-semibold text-blue-400 mb-2">Next Role: {roleDefinitions[currentRoleDef.nextRole].title}</h5>
                      <p className="text-gray-300 text-sm">
                        {roleDefinitions[currentRoleDef.nextRole].description}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-white mb-3">Competency System</h4>
                  <p className="text-gray-300 mb-4">
                    Develop six core competencies through gameplay. Each competency affects your ability 
                    to handle different aspects of workplace challenges and interventions.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default RoleBasedGameplayMechanics;