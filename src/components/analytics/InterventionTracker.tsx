'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import InterventionModal from './InterventionModal';
import { 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Target,
  Users,
  Calendar,
  Plus
} from 'lucide-react';

interface Intervention {
  id: string;
  title: string;
  description: string;
  target_pattern: string;
  status: 'planned' | 'in_progress' | 'completed' | 'paused';
  effectiveness_score: number;
  start_date: string;
  end_date?: string;
  target_metrics: {
    severity_reduction: number;
    frequency_reduction: number;
  };
  actual_metrics?: {
    severity_reduction: number;
    frequency_reduction: number;
  };
  stakeholder_role: 'hr' | 'executive' | 'middle_management';
  category: string;
  participants_count: number;
  budget_allocated: number;
  roi_estimate?: number;
}

interface InterventionTrackerProps {
  stakeholderRole: 'hr' | 'executive' | 'middle_management';
  onCreateIntervention?: () => void;
}

export const InterventionTracker: React.FC<InterventionTrackerProps> = ({
  stakeholderRole,
  onCreateIntervention
}) => {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInterventions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/interventions?role=${stakeholderRole}&status=${filter}`);
      const data = await response.json();
      
      if (response.ok) {
        setInterventions(data.interventions || []);
      } else {
        console.error('Failed to fetch interventions:', data.error);
        // Fall back to mock data
        loadMockData();
      }
    } catch (error) {
      console.error('Error fetching interventions:', error);
      // Fall back to mock data
      loadMockData();
    } finally {
      setIsLoading(false);
    }
  };

  const loadMockData = () => {
    const mockInterventions: Intervention[] = [
      {
        id: '1',
        title: 'Communication Skills Workshop',
        description: 'Interactive workshop to improve cross-team communication and reduce misunderstandings',
        target_pattern: 'Communication Breakdowns',
        status: 'completed',
        effectiveness_score: 4.2,
        start_date: '2024-01-15',
        end_date: '2024-02-15',
        target_metrics: {
          severity_reduction: 30,
          frequency_reduction: 40
        },
        actual_metrics: {
          severity_reduction: 35,
          frequency_reduction: 45
        },
        stakeholder_role: 'hr',
        category: 'Communication',
        participants_count: 24,
        budget_allocated: 5000,
        roi_estimate: 2.3
      },
      {
        id: '2',
        title: 'Leadership Coaching Program',
        description: 'One-on-one coaching for managers showing micromanagement tendencies',
        target_pattern: 'Micromanagement',
        status: 'in_progress',
        effectiveness_score: 3.8,
        start_date: '2024-02-01',
        target_metrics: {
          severity_reduction: 50,
          frequency_reduction: 60
        },
        stakeholder_role: 'executive',
        category: 'Leadership',
        participants_count: 8,
        budget_allocated: 12000
      },
      {
        id: '3',
        title: 'Meeting Efficiency Training',
        description: 'Training on effective meeting structures and time management',
        target_pattern: 'Meeting Overload',
        status: 'planned',
        effectiveness_score: 0,
        start_date: '2024-03-01',
        target_metrics: {
          severity_reduction: 25,
          frequency_reduction: 35
        },
        stakeholder_role: 'middle_management',
        category: 'Process',
        participants_count: 18,
        budget_allocated: 3500
      },
      {
        id: '4',
        title: 'Psychological Safety Initiative',
        description: 'Comprehensive program to build trust and reduce blame culture',
        target_pattern: 'Blame Culture',
        status: 'in_progress',
        effectiveness_score: 3.5,
        start_date: '2024-01-01',
        target_metrics: {
          severity_reduction: 60,
          frequency_reduction: 50
        },
        actual_metrics: {
          severity_reduction: 40,
          frequency_reduction: 35
        },
        stakeholder_role: 'hr',
        category: 'Culture',
        participants_count: 45,
        budget_allocated: 15000
      }
    ];

    setInterventions(mockInterventions);
  };

  useEffect(() => {
    fetchInterventions();
  }, [stakeholderRole, filter]);

  const handleCreateIntervention = (newIntervention: Intervention) => {
    setInterventions(prev => [newIntervention, ...prev]);
    onCreateIntervention?.();
  };

  const filteredInterventions = interventions.filter(intervention => {
    if (filter === 'active') return ['planned', 'in_progress'].includes(intervention.status);
    if (filter === 'completed') return intervention.status === 'completed';
    return true;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'planned':
        return <Calendar className="h-4 w-4 text-orange-500" />;
      case 'paused':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'planned': return 'bg-orange-100 text-orange-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateEffectiveness = (intervention: Intervention) => {
    if (!intervention.actual_metrics) return null;
    
    const severityTarget = intervention.target_metrics.severity_reduction;
    const severityActual = intervention.actual_metrics.severity_reduction;
    const frequencyTarget = intervention.target_metrics.frequency_reduction;
    const frequencyActual = intervention.actual_metrics.frequency_reduction;
    
    const severityEffectiveness = (severityActual / severityTarget) * 100;
    const frequencyEffectiveness = (frequencyActual / frequencyTarget) * 100;
    
    return (severityEffectiveness + frequencyEffectiveness) / 2;
  };

  const getTrendIcon = (target: number, actual?: number) => {
    if (!actual) return null;
    return actual >= target ? 
      <TrendingUp className="h-4 w-4 text-green-500" /> : 
      <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  return (
    <div className="intervention-tracker space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Intervention Tracking</h2>
          <p className="text-gray-600">Monitor effectiveness of workplace behavior interventions</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">All Interventions</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
          <Button 
            onClick={() => setIsModalOpen(true)} 
            className="bg-blue-500 hover:bg-blue-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Intervention
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Active</p>
                <p className="text-2xl font-bold">
                  {interventions.filter(i => ['planned', 'in_progress'].includes(i.status)).length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold">
                  {interventions.filter(i => i.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Effectiveness</p>
                <p className="text-2xl font-bold">
                  {(interventions
                    .filter(i => i.effectiveness_score > 0)
                    .reduce((sum, i) => sum + i.effectiveness_score, 0) / 
                   interventions.filter(i => i.effectiveness_score > 0).length
                  ).toFixed(1)}/5
                </p>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Participants</p>
                <p className="text-2xl font-bold">
                  {interventions.reduce((sum, i) => sum + i.participants_count, 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2">Loading interventions...</span>
        </div>
      )}

      {/* Interventions List */}
      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredInterventions.map(intervention => {
          const effectiveness = calculateEffectiveness(intervention);
          
          return (
            <Card 
              key={intervention.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedIntervention?.id === intervention.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedIntervention(intervention)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{intervention.title}</CardTitle>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(intervention.status)}
                    <Badge className={getStatusColor(intervention.status)}>
                      {intervention.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-gray-600">{intervention.description}</p>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {/* Target Pattern */}
                  <div>
                    <p className="text-sm font-medium text-gray-700">Target Pattern</p>
                    <p className="text-sm text-gray-600">{intervention.target_pattern}</p>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Severity Reduction</p>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">
                          Target: {intervention.target_metrics.severity_reduction}%
                        </span>
                        {intervention.actual_metrics && (
                          <>
                            {getTrendIcon(
                              intervention.target_metrics.severity_reduction,
                              intervention.actual_metrics.severity_reduction
                            )}
                            <span className="text-sm font-medium">
                              Actual: {intervention.actual_metrics.severity_reduction}%
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700">Frequency Reduction</p>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">
                          Target: {intervention.target_metrics.frequency_reduction}%
                        </span>
                        {intervention.actual_metrics && (
                          <>
                            {getTrendIcon(
                              intervention.target_metrics.frequency_reduction,
                              intervention.actual_metrics.frequency_reduction
                            )}
                            <span className="text-sm font-medium">
                              Actual: {intervention.actual_metrics.frequency_reduction}%
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Effectiveness Score */}
                  {effectiveness && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Overall Effectiveness</p>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full">
                          <div 
                            className={`h-full rounded-full ${
                              effectiveness >= 80 ? 'bg-green-500' :
                              effectiveness >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(100, effectiveness)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{effectiveness.toFixed(1)}%</span>
                      </div>
                    </div>
                  )}

                  {/* ROI */}
                  {intervention.roi_estimate && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Estimated ROI</p>
                      <p className="text-sm text-green-600 font-medium">
                        {intervention.roi_estimate}x return on investment
                      </p>
                    </div>
                  )}

                  {/* Dates and Participants */}
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <p className="font-medium">Start Date</p>
                      <p>{new Date(intervention.start_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="font-medium">Participants</p>
                      <p>{intervention.participants_count} people</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
          })}
        </div>
      )}

      {/* Selected Intervention Details */}
      {selectedIntervention && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Intervention Details - {selectedIntervention.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Timeline</h4>
                <p className="text-sm text-gray-600">
                  Started: {new Date(selectedIntervention.start_date).toLocaleDateString()}
                </p>
                {selectedIntervention.end_date && (
                  <p className="text-sm text-gray-600">
                    Ended: {new Date(selectedIntervention.end_date).toLocaleDateString()}
                  </p>
                )}
                <p className="text-sm text-gray-600">
                  Duration: {Math.ceil(
                    (new Date(selectedIntervention.end_date || new Date()).getTime() - 
                     new Date(selectedIntervention.start_date).getTime()) / 
                    (1000 * 60 * 60 * 24)
                  )} days
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Budget & ROI</h4>
                <p className="text-sm text-gray-600">
                  Allocated: ${selectedIntervention.budget_allocated.toLocaleString()}
                </p>
                {selectedIntervention.roi_estimate && (
                  <p className="text-sm text-green-600 font-medium">
                    Expected ROI: {selectedIntervention.roi_estimate}x
                  </p>
                )}
              </div>

              <div>
                <h4 className="font-semibold mb-2">Impact Metrics</h4>
                {selectedIntervention.actual_metrics ? (
                  <div className="space-y-1">
                    <p className="text-sm">
                      Severity: {selectedIntervention.actual_metrics.severity_reduction}% reduction
                    </p>
                    <p className="text-sm">
                      Frequency: {selectedIntervention.actual_metrics.frequency_reduction}% reduction
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">Results pending</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Intervention Creation Modal */}
      <InterventionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateIntervention}
        stakeholderRole={stakeholderRole}
      />
    </div>
  );
};

export default InterventionTracker;