'use client';

import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  TrendingUp, 
  Activity, 
  Users, 
  Building, 
  Clock,
  Info,
  Target,
  Brain,
  Heart,
  Zap,
  Shield,
  BarChart3,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AntipatternType {
  id: string;
  name: string;
  category: 'communication' | 'management' | 'collaboration' | 'culture' | 'workload' | 'environment' | 'cognitive' | 'emotional' | 'behavioral';
  description: string;
  base_severity: number; // 1-5 scale
  psychological_framework: 'cognitive_behavioral' | 'positive_psychology' | 'mindfulness' | 'acceptance_commitment' | 'dialectical_behavioral' | 'solution_focused';
  intervention_methods: string[];
  competency_hierarchy: {
    foundational: string[];
    intermediate: string[];
    advanced: string[];
    mastery: string[];
  };
}

interface SeverityAssessment {
  frequency_score: number; // 1-5: rarely to always
  impact_score: number; // 1-5: low to severe impact
  context_factors: {
    team_size: 'small' | 'medium' | 'large';
    organizational_level: 'individual' | 'team' | 'department' | 'organization';
    duration: 'recent' | 'ongoing' | 'chronic';
    stakeholder_count: number;
  };
  environmental_factors: {
    workload_pressure: number; // 1-5
    psychological_safety: number; // 1-5
    leadership_support: number; // 1-5
    resource_availability: number; // 1-5
  };
}

interface DynamicSeverityResult {
  calculated_severity: number;
  severity_level: 'minimal' | 'mild' | 'moderate' | 'significant' | 'severe';
  urgency_score: number;
  intervention_priority: 'low' | 'medium' | 'high' | 'critical';
  recommended_approach: string[];
  psychological_considerations: string[];
  risk_factors: string[];
}

interface AntipatternSeveritySystemProps {
  antipattern: AntipatternType;
  initialAssessment?: SeverityAssessment;
  userRole: 'explorer' | 'analyst' | 'facilitator' | 'architect' | 'mentor';
  onAssessmentComplete: (assessment: SeverityAssessment, result: DynamicSeverityResult) => void;
  isReadOnly?: boolean;
  showDetailedAnalysis?: boolean;
}

export const AntipatternSeveritySystem: React.FC<AntipatternSeveritySystemProps> = ({
  antipattern,
  initialAssessment,
  userRole,
  onAssessmentComplete,
  isReadOnly = false,
  showDetailedAnalysis = false
}) => {
  const [assessment, setAssessment] = useState<SeverityAssessment>(
    initialAssessment || {
      frequency_score: 3,
      impact_score: 3,
      context_factors: {
        team_size: 'medium',
        organizational_level: 'team',
        duration: 'ongoing',
        stakeholder_count: 5
      },
      environmental_factors: {
        workload_pressure: 3,
        psychological_safety: 3,
        leadership_support: 3,
        resource_availability: 3
      }
    }
  );

  const [severityResult, setSeverityResult] = useState<DynamicSeverityResult | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Calculate dynamic severity based on multiple factors
  const calculateDynamicSeverity = (assessment: SeverityAssessment): DynamicSeverityResult => {
    const { frequency_score, impact_score, context_factors, environmental_factors } = assessment;
    
    // Base calculation with frequency and impact
    const frequencyMultiplier = [0.5, 0.8, 1.0, 1.5, 2.0][frequency_score - 1];
    const impactMultiplier = [0.6, 0.8, 1.0, 1.3, 1.6][impact_score - 1];
    
    let baseSeverity = antipattern.base_severity * frequencyMultiplier * impactMultiplier;
    
    // Context adjustments
    const contextMultipliers = {
      team_size: { small: 0.9, medium: 1.0, large: 1.2 },
      organizational_level: { individual: 0.8, team: 1.0, department: 1.3, organization: 1.6 },
      duration: { recent: 0.7, ongoing: 1.0, chronic: 1.4 }
    };
    
    baseSeverity *= contextMultipliers.team_size[context_factors.team_size];
    baseSeverity *= contextMultipliers.organizational_level[context_factors.organizational_level];
    baseSeverity *= contextMultipliers.duration[context_factors.duration];
    
    // Environmental factor adjustments
    const envAverage = Object.values(environmental_factors).reduce((a, b) => a + b, 0) / 4;
    const envMultiplier = envAverage < 2.5 ? 1.3 : envAverage > 3.5 ? 0.8 : 1.0;
    baseSeverity *= envMultiplier;
    
    // Stakeholder impact
    const stakeholderMultiplier = Math.min(1.5, 1 + (context_factors.stakeholder_count - 1) * 0.1);
    baseSeverity *= stakeholderMultiplier;
    
    // Cap at 5.0
    const calculated_severity = Math.min(5.0, baseSeverity);
    
    // Determine severity level and urgency
    const severity_level = 
      calculated_severity <= 1.5 ? 'minimal' :
      calculated_severity <= 2.5 ? 'mild' :
      calculated_severity <= 3.5 ? 'moderate' :
      calculated_severity <= 4.2 ? 'significant' : 'severe';
    
    const urgency_score = calculated_severity * (frequency_score / 5) * (impact_score / 5);
    
    const intervention_priority = 
      urgency_score <= 1.5 ? 'low' :
      urgency_score <= 2.5 ? 'medium' :
      urgency_score <= 3.5 ? 'high' : 'critical';
    
    // Generate recommendations based on psychological framework
    const recommended_approach = generateRecommendations(antipattern, assessment, calculated_severity);
    const psychological_considerations = generatePsychologicalConsiderations(antipattern, assessment);
    const risk_factors = generateRiskFactors(assessment, calculated_severity);
    
    return {
      calculated_severity,
      severity_level,
      urgency_score,
      intervention_priority,
      recommended_approach,
      psychological_considerations,
      risk_factors
    };
  };

  // Generate recommendations based on framework and severity
  const generateRecommendations = (
    antipattern: AntipatternType, 
    assessment: SeverityAssessment, 
    severity: number
  ): string[] => {
    const baseRecommendations = antipattern.intervention_methods;
    const frameworkRecommendations = {
      cognitive_behavioral: [
        'Identify thought patterns contributing to the antipattern',
        'Challenge limiting beliefs and assumptions',
        'Practice behavioral experiments and new responses'
      ],
      positive_psychology: [
        'Focus on strengths and positive aspects',
        'Build psychological capital and resilience',
        'Emphasize growth and learning opportunities'
      ],
      mindfulness: [
        'Increase awareness of present moment patterns',
        'Practice non-judgmental observation',
        'Develop emotional regulation skills'
      ],
      acceptance_commitment: [
        'Clarify values and meaningful direction',
        'Accept difficult emotions without avoidance',
        'Commit to behavior changes aligned with values'
      ],
      dialectical_behavioral: [
        'Balance acceptance and change strategies',
        'Develop distress tolerance skills',
        'Practice interpersonal effectiveness'
      ],
      solution_focused: [
        'Identify what\'s already working well',
        'Scale solutions that show promise',
        'Focus on small, achievable changes'
      ]
    };
    
    const frameworkSpecific = frameworkRecommendations[antipattern.psychological_framework] || [];
    
    // Severity-based adjustments
    if (severity >= 4.0) {
      return [
        'Consider professional support or mediation',
        'Implement immediate protective measures',
        ...frameworkSpecific.slice(0, 2),
        ...baseRecommendations.slice(0, 1)
      ];
    } else if (severity >= 3.0) {
      return [
        ...frameworkSpecific.slice(0, 2),
        ...baseRecommendations.slice(0, 2),
        'Monitor progress closely'
      ];
    } else {
      return [
        ...frameworkSpecific.slice(0, 1),
        ...baseRecommendations.slice(0, 3)
      ];
    }
  };

  const generatePsychologicalConsiderations = (
    antipattern: AntipatternType, 
    assessment: SeverityAssessment
  ): string[] => {
    const considerations = [];
    
    if (assessment.environmental_factors.psychological_safety < 3) {
      considerations.push('Low psychological safety may inhibit open discussion');
    }
    
    if (assessment.frequency_score >= 4) {
      considerations.push('High frequency may indicate systemic issues requiring broader intervention');
    }
    
    if (assessment.context_factors.duration === 'chronic') {
      considerations.push('Chronic nature suggests deep-rooted patterns requiring patience and persistence');
    }
    
    if (antipattern.category === 'emotional' || antipattern.category === 'cognitive') {
      considerations.push('Individual psychological support may be beneficial');
    }
    
    return considerations;
  };

  const generateRiskFactors = (assessment: SeverityAssessment, severity: number): string[] => {
    const risks = [];
    
    if (severity >= 4.0) {
      risks.push('High risk of talent retention issues');
      risks.push('Potential for escalation to formal complaints');
    }
    
    if (assessment.environmental_factors.workload_pressure >= 4) {
      risks.push('Burnout risk elevated');
    }
    
    if (assessment.context_factors.stakeholder_count > 10) {
      risks.push('Wide impact radius may amplify consequences');
    }
    
    if (assessment.environmental_factors.leadership_support < 3) {
      risks.push('Limited leadership support may hinder resolution efforts');
    }
    
    return risks;
  };

  // Update severity calculation when assessment changes
  useEffect(() => {
    const result = calculateDynamicSeverity(assessment);
    setSeverityResult(result);
  }, [assessment]);

  // Handle assessment completion
  const handleComplete = () => {
    if (severityResult) {
      onAssessmentComplete(assessment, severityResult);
    }
  };

  // Get color for severity level
  const getSeverityColor = (level: string) => {
    const colors = {
      minimal: 'text-green-400 bg-green-400/10 border-green-400/20',
      mild: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
      moderate: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
      significant: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
      severe: 'text-red-400 bg-red-400/10 border-red-400/20'
    };
    return colors[level] || colors.moderate;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'text-green-400',
      medium: 'text-yellow-400',
      high: 'text-orange-400',
      critical: 'text-red-400'
    };
    return colors[priority] || colors.medium;
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      communication: Users,
      management: Building,
      collaboration: Target,
      culture: Heart,
      workload: Activity,
      environment: Shield,
      cognitive: Brain,
      emotional: Heart,
      behavioral: Zap
    };
    return icons[category] || AlertTriangle;
  };

  const CategoryIcon = getCategoryIcon(antipattern.category);

  return (
    <div className="space-y-6">
      {/* Antipattern overview */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-gray-700/50 rounded-lg">
              <CategoryIcon className="h-6 w-6 text-blue-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-xl font-bold text-white">{antipattern.name}</h3>
                <Badge variant="secondary" className="text-xs">
                  {antipattern.category}
                </Badge>
                <Badge variant="outline" className="text-xs text-gray-400">
                  Base: {antipattern.base_severity}/5
                </Badge>
              </div>
              <p className="text-gray-300 mb-3">{antipattern.description}</p>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span>Framework: {antipattern.psychological_framework.replace('_', ' ')}</span>
                <span>•</span>
                <span>Methods: {antipattern.intervention_methods.length}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {!isReadOnly && (
        <>
          {/* Frequency and Impact Assessment */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <h4 className="text-lg font-semibold text-white mb-4">Core Assessment</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    <Clock className="h-4 w-4 inline mr-2" />
                    Frequency
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 1, label: 'Rarely (once in a while)' },
                      { value: 2, label: 'Sometimes (monthly)' },
                      { value: 3, label: 'Often (weekly)' },
                      { value: 4, label: 'Frequently (daily)' },
                      { value: 5, label: 'Always (constantly)' }
                    ].map((option) => (
                      <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          value={option.value}
                          checked={assessment.frequency_score === option.value}
                          onChange={(e) => setAssessment(prev => ({
                            ...prev,
                            frequency_score: parseInt(e.target.value)
                          }))}
                          className="text-blue-500"
                        />
                        <span className="text-gray-300 text-sm">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    <TrendingUp className="h-4 w-4 inline mr-2" />
                    Impact Level
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 1, label: 'Low (minor inconvenience)' },
                      { value: 2, label: 'Moderate (affects work quality)' },
                      { value: 3, label: 'Significant (disrupts productivity)' },
                      { value: 4, label: 'High (affects multiple people)' },
                      { value: 5, label: 'Severe (major organizational impact)' }
                    ].map((option) => (
                      <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          value={option.value}
                          checked={assessment.impact_score === option.value}
                          onChange={(e) => setAssessment(prev => ({
                            ...prev,
                            impact_score: parseInt(e.target.value)
                          }))}
                          className="text-blue-500"
                        />
                        <span className="text-gray-300 text-sm">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Assessment (for experienced users) */}
          {(userRole === 'analyst' || userRole === 'facilitator' || userRole === 'architect' || userRole === 'mentor') && (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-white">Contextual Factors</h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-blue-400"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    {showAdvanced ? 'Hide' : 'Show'} Advanced
                  </Button>
                </div>

                {showAdvanced && (
                  <div className="space-y-6">
                    {/* Context factors */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Team Size</label>
                        <select
                          value={assessment.context_factors.team_size}
                          onChange={(e) => setAssessment(prev => ({
                            ...prev,
                            context_factors: {
                              ...prev.context_factors,
                              team_size: e.target.value as any
                            }
                          }))}
                          className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                        >
                          <option value="small">Small (2-5 people)</option>
                          <option value="medium">Medium (6-15 people)</option>
                          <option value="large">Large (16+ people)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Organizational Level</label>
                        <select
                          value={assessment.context_factors.organizational_level}
                          onChange={(e) => setAssessment(prev => ({
                            ...prev,
                            context_factors: {
                              ...prev.context_factors,
                              organizational_level: e.target.value as any
                            }
                          }))}
                          className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                        >
                          <option value="individual">Individual</option>
                          <option value="team">Team</option>
                          <option value="department">Department</option>
                          <option value="organization">Organization</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Duration</label>
                        <select
                          value={assessment.context_factors.duration}
                          onChange={(e) => setAssessment(prev => ({
                            ...prev,
                            context_factors: {
                              ...prev.context_factors,
                              duration: e.target.value as any
                            }
                          }))}
                          className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                        >
                          <option value="recent">Recent (&lt; 1 month)</option>
                          <option value="ongoing">Ongoing (1-6 months)</option>
                          <option value="chronic">Chronic (&gt; 6 months)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Stakeholders Affected
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={assessment.context_factors.stakeholder_count}
                          onChange={(e) => setAssessment(prev => ({
                            ...prev,
                            context_factors: {
                              ...prev.context_factors,
                              stakeholder_count: parseInt(e.target.value) || 1
                            }
                          }))}
                          className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                        />
                      </div>
                    </div>

                    {/* Environmental factors */}
                    <div>
                      <h5 className="text-md font-semibold text-white mb-3">Environmental Factors</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(assessment.environmental_factors).map(([key, value]) => (
                          <div key={key}>
                            <label className="block text-sm font-medium text-gray-300 mb-2 capitalize">
                              {key.replace('_', ' ')}
                            </label>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-400">Low</span>
                              <input
                                type="range"
                                min="1"
                                max="5"
                                value={value}
                                onChange={(e) => setAssessment(prev => ({
                                  ...prev,
                                  environmental_factors: {
                                    ...prev.environmental_factors,
                                    [key]: parseInt(e.target.value)
                                  }
                                }))}
                                className="flex-1"
                              />
                              <span className="text-sm text-gray-400">High</span>
                              <span className="text-sm text-white w-6">{value}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Results */}
      {severityResult && (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-semibold text-white">Severity Analysis</h4>
              {!isReadOnly && (
                <Button onClick={handleComplete} className="bg-blue-600 hover:bg-blue-700">
                  Complete Assessment
                </Button>
              )}
            </div>

            {/* Severity score and level */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">
                  {severityResult.calculated_severity.toFixed(1)}
                </div>
                <div className="text-sm text-gray-400">Calculated Severity</div>
              </div>
              
              <div className="text-center">
                <Badge 
                  className={`text-lg px-4 py-2 ${getSeverityColor(severityResult.severity_level)}`}
                >
                  {severityResult.severity_level.toUpperCase()}
                </Badge>
                <div className="text-sm text-gray-400 mt-2">Severity Level</div>
              </div>
              
              <div className="text-center">
                <div className={`text-2xl font-bold ${getPriorityColor(severityResult.intervention_priority)} mb-2`}>
                  {severityResult.intervention_priority.toUpperCase()}
                </div>
                <div className="text-sm text-gray-400">Priority</div>
              </div>
            </div>

            {/* Detailed analysis */}
            {showDetailedAnalysis && (
              <div className="space-y-4">
                {/* Recommendations */}
                <div>
                  <h5 className="text-md font-semibold text-white mb-3 flex items-center">
                    <Target className="h-4 w-4 mr-2" />
                    Recommended Approach
                  </h5>
                  <ul className="space-y-2">
                    {severityResult.recommended_approach.map((recommendation, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-300">{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Psychological considerations */}
                {severityResult.psychological_considerations.length > 0 && (
                  <div>
                    <h5 className="text-md font-semibold text-white mb-3 flex items-center">
                      <Brain className="h-4 w-4 mr-2" />
                      Psychological Considerations
                    </h5>
                    <ul className="space-y-2">
                      {severityResult.psychological_considerations.map((consideration, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <Info className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-300">{consideration}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Risk factors */}
                {severityResult.risk_factors.length > 0 && (
                  <div>
                    <h5 className="text-md font-semibold text-white mb-3 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2 text-yellow-400" />
                      Risk Factors
                    </h5>
                    <ul className="space-y-2">
                      {severityResult.risk_factors.map((risk, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-gray-300">{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AntipatternSeveritySystem;