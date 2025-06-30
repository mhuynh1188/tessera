'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Shield, 
  Users, 
  Brain, 
  AlertTriangle,
  Eye,
  Filter,
  Download,
  RefreshCw,
  Building,
  Target,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  PauseCircle
} from 'lucide-react';
import BehaviorBubbleChart from '@/components/analytics/BehaviorBubbleChart';
import OrganizationalHeatmap from '@/components/analytics/OrganizationalHeatmap';
import TimelineVisualization from '@/components/analytics/TimelineVisualization';
import InterventionTracker from '@/components/analytics/InterventionTracker';
import DataExport from '@/components/analytics/DataExport';
import toast from 'react-hot-toast';

interface EnterpriseAnalyticsData {
  success: boolean;
  user_context: {
    organization_id: string;
    role: string;
    department: string;
    job_title: string;
  };
  analytics_data: any;
  behavior_patterns: any[];
  stakeholder_metrics: any;
  organizational_health: any[];
  heatmap_data: any[];
  intervention_insights: any[];
  recent_interactions_count: number;
  data_sources: {
    real_data: boolean;
    privacy_compliant: boolean;
    min_anonymity_threshold: number;
    time_window: string;
    generated_at: string;
  };
}

export default function EnterpriseAnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<EnterpriseAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'quarter'>('month');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Mock user ID - in real app this would come from auth
  const currentUserId = '22222222-2222-2222-2222-222222222222'; // Executive user

  const loadAnalyticsData = async (showToast = true) => {
    try {
      setLoading(true);
      setError(null);

      if (showToast) {
        toast.loading('Loading real analytics data...');
      }

      const response = await fetch(
        `/api/analytics/demo-enterprise?timeWindow=${timeFilter}&role=executive`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: EnterpriseAnalyticsData = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load analytics data');
      }

      setAnalyticsData(data);
      
      if (showToast) {
        toast.dismiss();
        toast.success(`Loaded ${data.behavior_patterns.length} behavior patterns from real data!`);
      }

    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
      
      if (showToast) {
        toast.dismiss();
        toast.error('Failed to load analytics data');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalyticsData(true);
  };

  useEffect(() => {
    loadAnalyticsData(false);
  }, [timeFilter]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'paused': return <PauseCircle className="h-4 w-4 text-yellow-500" />;
      case 'cancelled': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <div className="h-4 w-4 bg-gray-400 rounded-full" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <h2 className="text-xl font-semibold text-gray-900">Loading Enterprise Analytics</h2>
          <p className="text-gray-600">Fetching real data from your organization...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Analytics</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => loadAnalyticsData(true)} className="bg-blue-600 hover:bg-blue-700">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No analytics data available</p>
        </div>
      </div>
    );
  }

  const { user_context, behavior_patterns, stakeholder_metrics, organizational_health, intervention_insights, data_sources } = analyticsData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Enterprise Analytics Dashboard</h1>
            <div className="flex items-center space-x-4 mt-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {data_sources.real_data ? 'Real Data' : 'Demo Data'}
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {user_context.role.charAt(0).toUpperCase() + user_context.role.slice(1)} View
              </Badge>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                {user_context.department}
              </Badge>
              <span className="text-sm text-gray-500">
                Last updated: {new Date(data_sources.generated_at).toLocaleTimeString()}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Time:</span>
              <div className="flex border rounded">
                {['week', 'month', 'quarter'].map((period) => (
                  <button
                    key={period}
                    onClick={() => setTimeFilter(period as 'week' | 'month' | 'quarter')}
                    className={`px-3 py-1 text-sm ${
                      timeFilter === period 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {period === 'week' ? 'Week' : period === 'month' ? 'Month' : 'Quarter'}
                  </button>
                ))}
              </div>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <DataExport
              data={analyticsData}
              userRole={user_context.role as 'hr' | 'executive' | 'middle_management'}
              organizationId={user_context.organization_id}
            />
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Patterns</p>
                  <p className="text-2xl font-bold text-gray-900">{behavior_patterns.length}</p>
                </div>
                <Brain className="h-8 w-8 text-blue-500" />
              </div>
              <p className="text-xs text-gray-500 mt-2">From {stakeholder_metrics.unique_users} active users</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Severity</p>
                  <p className="text-2xl font-bold text-gray-900">{stakeholder_metrics.avg_severity.toFixed(1)}</p>
                </div>
                <div className="flex items-center">
                  {getTrendIcon('improving')}
                  <AlertTriangle className="h-8 w-8 text-yellow-500 ml-2" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Scale: 1 (low) to 5 (high)</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Departments</p>
                  <p className="text-2xl font-bold text-gray-900">{stakeholder_metrics.departments_analyzed || organizational_health.length}</p>
                </div>
                <Building className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-xs text-gray-500 mt-2">Active departments analyzed</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Org Health</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {((stakeholder_metrics.organizational_health_score || 0.7) * 100).toFixed(0)}%
                  </p>
                </div>
                <Shield className="h-8 w-8 text-purple-500" />
              </div>
              <p className="text-xs text-gray-500 mt-2">Overall health score</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Analytics Tabs */}
        <Tabs defaultValue="patterns" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="patterns">Behavior Patterns</TabsTrigger>
            <TabsTrigger value="heatmap">Organizational Health</TabsTrigger>
            <TabsTrigger value="interventions">Interventions</TabsTrigger>
            <TabsTrigger value="departments">Departments</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="patterns" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Real-Time Behavior Patterns</CardTitle>
                <p className="text-sm text-gray-600">
                  Based on {stakeholder_metrics.total_interactions} real interactions from your organization
                </p>
              </CardHeader>
              <CardContent>
                {behavior_patterns.length > 0 ? (
                  <BehaviorBubbleChart 
                    data={behavior_patterns} 
                    userRole={user_context.role as 'hr' | 'executive' | 'middle_management'}
                  />
                ) : (
                  <div className="text-center py-12">
                    <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Patterns Detected</h3>
                    <p className="text-gray-600">Not enough data to identify behavior patterns yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timeline Visualization */}
            <Card>
              <CardHeader>
                <CardTitle>Pattern Evolution Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <TimelineVisualization 
                  data={behavior_patterns} 
                  timeWindow={timeFilter}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="heatmap" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Organizational Health Heatmap</CardTitle>
                <p className="text-sm text-gray-600">
                  Privacy-compliant department-level insights
                </p>
              </CardHeader>
              <CardContent>
                <OrganizationalHeatmap 
                  data={organizational_health.map((dept, index) => ({
                    id: `dept_${index}`,
                    unit_name: dept.department || 'Unknown',
                    toxicity_level: dept.avg_severity_score || 2.5,
                    participation_rate: dept.participation_rate || 0,
                    total_sessions: dept.total_sessions || 0,
                    trend_history: [
                      { week: 1, severity: (dept.severity_30_60_days_ago || 2.5) },
                      { week: 2, severity: (dept.severity_last_30_days || 2.5) }
                    ],
                    intervention_score: Math.max(0, 5 - (dept.avg_severity_score || 2.5)),
                    region: 'Organization',
                    building_type: 'office',
                    category_breakdown: {
                      Communication: 0.3,
                      Leadership: 0.25,
                      Process: 0.25,
                      Culture: 0.2
                    }
                  }))}
                  userRole={user_context.role as 'hr' | 'executive' | 'middle_management'}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="interventions" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Active Interventions</CardTitle>
                    <p className="text-sm text-gray-600">
                      Track and manage behavior improvement initiatives
                    </p>
                  </div>
                  <Button size="sm">
                    <Target className="h-4 w-4 mr-2" />
                    New Intervention
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {intervention_insights.length > 0 ? (
                  <div className="space-y-4">
                    {intervention_insights.map((intervention) => (
                      <div key={intervention.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(intervention.status)}
                            <h3 className="font-medium">{intervention.title}</h3>
                            <Badge variant="secondary">{intervention.status}</Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              {intervention.participant_count}
                            </span>
                            <span className="flex items-center">
                              <DollarSign className="h-4 w-4 mr-1" />
                              {intervention.budget_utilization.toFixed(0)}%
                            </span>
                            <span className="flex items-center">
                              <TrendingUp className="h-4 w-4 mr-1" />
                              {intervention.effectiveness_score.toFixed(1)}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          Targeting: {intervention.target_patterns.join(', ')}
                        </p>
                        <div className="bg-gray-50 rounded p-2">
                          <div className="flex justify-between text-xs">
                            <span>ROI: ${intervention.roi_calculated?.toFixed(0) || 0}</span>
                            <span>Effectiveness: {intervention.effectiveness_score.toFixed(1)}/5.0</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Interventions</h3>
                    <p className="text-gray-600 mb-4">Start tracking behavior improvement initiatives.</p>
                    <Button>Create First Intervention</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="departments" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {organizational_health.map((dept, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{dept.department || 'Unknown Department'}</span>
                      <Badge variant={dept.avg_severity_score > 3 ? 'destructive' : dept.avg_severity_score > 2 ? 'default' : 'secondary'}>
                        {dept.avg_severity_score?.toFixed(1) || 'N/A'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Participation Rate</span>
                        <span className="font-medium">{dept.participation_rate?.toFixed(1) || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Sessions</span>
                        <span className="font-medium">{dept.total_sessions || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Active Users</span>
                        <span className="font-medium">{dept.active_users || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">30-day Trend</span>
                        <div className="flex items-center space-x-1">
                          {getTrendIcon(
                            (dept.severity_30_60_days_ago || 2.5) > (dept.severity_last_30_days || 2.5) 
                              ? 'improving' : 'stable'
                          )}
                          <span className="text-sm font-medium">
                            {((dept.severity_30_60_days_ago || 2.5) - (dept.severity_last_30_days || 2.5)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI-Powered Insights</CardTitle>
                <p className="text-sm text-gray-600">
                  Actionable recommendations based on your organization's data
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Generate insights based on real data */}
                  {behavior_patterns.slice(0, 3).map((pattern, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                      <h4 className="font-medium text-gray-900">
                        High Impact: {pattern.pattern_type}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Severity {pattern.severity_avg.toFixed(1)}/5.0 with {pattern.frequency} interactions. 
                        Consider implementing targeted interventions for {pattern.category.toLowerCase()} patterns.
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {pattern.unique_users} users affected
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {pattern.trend_direction}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  
                  {stakeholder_metrics.organizational_health_score < 0.6 && (
                    <div className="border-l-4 border-red-500 pl-4 py-2">
                      <h4 className="font-medium text-gray-900">
                        Alert: Low Organizational Health
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Overall health score is {(stakeholder_metrics.organizational_health_score * 100).toFixed(0)}%. 
                        Recommend immediate leadership attention and intervention planning.
                      </p>
                    </div>
                  )}

                  {stakeholder_metrics.reputation_risk_level === 'high' && (
                    <div className="border-l-4 border-yellow-500 pl-4 py-2">
                      <h4 className="font-medium text-gray-900">
                        Reputation Risk Alert
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        High severity patterns detected. Consider proactive communication strategy 
                        and accelerated intervention timeline.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Data Source Info */}
        <Card className="mt-8">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                <span>Data Source: {data_sources.real_data ? 'Live Database' : 'Demo Data'}</span>
                <span>Privacy Level: K-Anonymity (min {data_sources.min_anonymity_threshold} users)</span>
                <span>Time Window: {data_sources.time_window}</span>
              </div>
              <span>Generated: {new Date(data_sources.generated_at).toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}