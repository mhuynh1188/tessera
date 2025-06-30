'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  Shield, 
  Users, 
  Brain, 
  AlertTriangle,
  Eye,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import BehaviorBubbleChart from '@/components/analytics/BehaviorBubbleChart';
import OrganizationalHeatmap from '@/components/analytics/OrganizationalHeatmap';
import TimelineVisualization from '@/components/analytics/TimelineVisualization';
import InterventionTracker from '@/components/analytics/InterventionTracker';
import DataExport from '@/components/analytics/DataExport';
import { UnifiedTour, UnifiedTourTrigger } from '@/components/tours/UnifiedTour';
import { BehaviorPattern, StakeholderMetrics } from '@/lib/analytics-aggregation';

interface AnalyticsDashboardProps {
  userRole: 'hr' | 'executive' | 'middle_management';
  organizationId: string;
}

export default function AnalyticsDashboard() {
  const [userRole, setUserRole] = useState<'hr' | 'executive' | 'middle_management'>('hr');
  const [behaviorData, setBehaviorData] = useState<BehaviorPattern[]>([]);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<StakeholderMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'quarter'>('month');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showTour, setShowTour] = useState(false);

  // Load data - using mock data for demo (API requires authentication)
  useEffect(() => {
    const loadMockData = () => {
      setLoading(true);
    const mockBehaviorData: BehaviorPattern[] = [
      {
        id: '1',
        pattern_type: 'Communication Breakdowns',
        severity_avg: 3.2,
        frequency: 15,
        category: 'Communication',
        subcategory: 'Information Flow',
        psychological_framework: 'Cognitive-Behavioral',
        environmental_factors: ['High Workload', 'Remote Work'],
        size_indicator: 25,
        trend_direction: 'declining',
        last_updated: new Date().toISOString()
      },
      {
        id: '2',
        pattern_type: 'Micromanagement',
        severity_avg: 4.1,
        frequency: 8,
        category: 'Leadership',
        subcategory: 'Control Issues',
        psychological_framework: 'Positive Psychology',
        environmental_factors: ['Lack of Trust', 'Pressure from Above'],
        size_indicator: 35,
        trend_direction: 'stable',
        last_updated: new Date().toISOString()
      },
      {
        id: '3',
        pattern_type: 'Meeting Overload',
        severity_avg: 2.8,
        frequency: 22,
        category: 'Process',
        subcategory: 'Time Management',
        psychological_framework: 'Mindfulness',
        environmental_factors: ['Poor Planning', 'Status Culture'],
        size_indicator: 18,
        trend_direction: 'improving',
        last_updated: new Date().toISOString()
      },
      {
        id: '4',
        pattern_type: 'Blame Culture',
        severity_avg: 4.5,
        frequency: 6,
        category: 'Culture',
        subcategory: 'Psychological Safety',
        psychological_framework: 'Systems Thinking',
        environmental_factors: ['Fear of Failure', 'Competitive Environment'],
        size_indicator: 42,
        trend_direction: 'declining',
        last_updated: new Date().toISOString()
      }
    ];

    const mockMetrics: StakeholderMetrics = {
      role: userRole,
      confidentiality_level: 0.98,
      actionable_insights_count: 4,
      engagement_score: 0.75,
      culture_improvement_score: 0.12
    };

    const mockHeatmapData = [
      {
        id: 'unit_1',
        anonymized_unit_id: 'building_abc123',
        toxicity_level: 2.3,
        unit_size: 12,
        category_distribution: { Communication: 0.4, Leadership: 0.3, Process: 0.2, Culture: 0.1 },
        trend_data: [
          { week: 1, severity: 2.8 },
          { week: 2, severity: 2.5 },
          { week: 3, severity: 2.3 },
          { week: 4, severity: 2.1 }
        ],
        intervention_effectiveness: 3.2,
        geographic_region: 'North America',
        building_type: 'office_tower',
        district: 'North District',
        height_category: 'medium' as const,
        last_updated: new Date().toISOString()
      },
      {
        id: 'unit_2',
        anonymized_unit_id: 'building_def456',
        toxicity_level: 3.8,
        unit_size: 8,
        category_distribution: { Leadership: 0.5, Culture: 0.3, Communication: 0.2, Process: 0.0 },
        trend_data: [
          { week: 1, severity: 3.2 },
          { week: 2, severity: 3.5 },
          { week: 3, severity: 3.7 },
          { week: 4, severity: 3.8 }
        ],
        intervention_effectiveness: 1.8,
        geographic_region: 'North America',
        building_type: 'headquarters',
        district: 'Central District',
        height_category: 'high' as const,
        last_updated: new Date().toISOString()
      },
      {
        id: 'unit_3',
        anonymized_unit_id: 'building_ghi789',
        toxicity_level: 1.5,
        unit_size: 15,
        category_distribution: { Process: 0.6, Communication: 0.25, Leadership: 0.1, Culture: 0.05 },
        trend_data: [
          { week: 1, severity: 2.1 },
          { week: 2, severity: 1.8 },
          { week: 3, severity: 1.6 },
          { week: 4, severity: 1.5 }
        ],
        intervention_effectiveness: 4.2,
        geographic_region: 'North America',
        building_type: 'industrial',
        district: 'East District',
        height_category: 'low' as const,
        last_updated: new Date().toISOString()
      },
      {
        id: 'unit_4',
        anonymized_unit_id: 'building_jkl012',
        toxicity_level: 4.2,
        unit_size: 6,
        category_distribution: { Culture: 0.6, Leadership: 0.3, Communication: 0.1, Process: 0.0 },
        trend_data: [
          { week: 1, severity: 4.0 },
          { week: 2, severity: 4.1 },
          { week: 3, severity: 4.2 },
          { week: 4, severity: 4.2 }
        ],
        intervention_effectiveness: 1.2,
        geographic_region: 'North America',
        building_type: 'mixed_use',
        district: 'South District',
        height_category: 'critical' as const,
        last_updated: new Date().toISOString()
      },
      {
        id: 'unit_5',
        anonymized_unit_id: 'building_mno345',
        toxicity_level: 2.7,
        unit_size: 10,
        category_distribution: { Communication: 0.5, Process: 0.3, Leadership: 0.15, Culture: 0.05 },
        trend_data: [
          { week: 1, severity: 3.0 },
          { week: 2, severity: 2.9 },
          { week: 3, severity: 2.8 },
          { week: 4, severity: 2.7 }
        ],
        intervention_effectiveness: 2.8,
        geographic_region: 'North America',
        building_type: 'conference_center',
        district: 'West District',
        height_category: 'medium' as const,
        last_updated: new Date().toISOString()
      }
    ];

      setBehaviorData(mockBehaviorData);
      setHeatmapData(mockHeatmapData);
      setMetrics(mockMetrics);
      setLoading(false);
    };
    
    loadMockData();
  }, [userRole, timeFilter]);

  const getStakeholderContent = () => {
    switch (userRole) {
      case 'hr':
        return {
          title: 'HR Analytics Dashboard',
          subtitle: 'Confidential workforce behavior insights',
          primaryColor: 'bg-blue-500',
          focusAreas: ['Confidentiality', 'Actionable Insights', 'Trend Detection', 'Compliance']
        };
      case 'executive':
        return {
          title: 'Executive Analytics Dashboard',
          subtitle: 'Organizational health and strategic insights',
          primaryColor: 'bg-purple-500',
          focusAreas: ['Organizational Health', 'Strategic Decision-Making', 'Reputation Management', 'Employee Retention']
        };
      case 'middle_management':
        return {
          title: 'Management Analytics Dashboard',
          subtitle: 'Team culture and guidance insights',
          primaryColor: 'bg-green-500',
          focusAreas: ['Guidance & Support', 'Early Warning', 'Empowerment', 'Trust Building']
        };
    }
  };

  const stakeholderContent = getStakeholderContent();

  const handlePatternClick = (pattern: BehaviorPattern) => {
    console.log('Pattern selected:', pattern);
    // Implement drill-down functionality based on stakeholder permissions
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining':
        return <TrendingUp className="h-4 w-4 text-red-500 transform rotate-180" />;
      default:
        return <TrendingUp className="h-4 w-4 text-yellow-500 transform rotate-90" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8" data-tour="analytics-header">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{stakeholderContent.title}</h1>
              <p className="text-gray-600 mt-1">{stakeholderContent.subtitle}</p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg"
                data-tour="role-selector"
              >
                <option value="hr">HR Perspective</option>
                <option value="executive">Executive Perspective</option>
                <option value="middle_management">Management Perspective</option>
              </select>
              <UnifiedTourTrigger
                onStartTour={() => setShowTour(true)}
                context="analytics"
                variant="button"
                size="sm"
                className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  // Auto-generate and download executive summary
                  const summary = behaviorData.map(pattern => 
                    `${pattern.pattern_type},${pattern.category},${pattern.severity_avg},${pattern.frequency}`
                  ).join('\n');
                  const blob = new Blob([`Pattern,Category,Severity,Frequency\n${summary}`], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `BehaviorSavior_${userRole}_${new Date().toISOString().split('T')[0]}.csv`;
                  link.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Quick Export
              </Button>
            </div>
          </div>

          {/* Focus Areas - Interactive */}
          <div className="flex flex-wrap gap-2" data-tour="focus-areas">
            {stakeholderContent.focusAreas.map((area, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-xs hover:bg-blue-50 hover:border-blue-300 transition-colors"
                onClick={() => {
                  const descriptions = {
                    'Confidentiality': 'All analytics maintain strict privacy with k-anonymity protection. Zero individual identification possible.',
                    'Actionable Insights': 'Data-driven recommendations for immediate workplace culture improvements.',
                    'Trend Detection': 'Early identification of emerging behavioral patterns before they become problems.',
                    'Compliance': 'SOC 2 Type II compliant analytics with full audit trails and data governance.',
                    'Organizational Health': 'High-level metrics showing overall workplace culture and employee satisfaction.',
                    'Strategic Decision-Making': 'Executive-level insights for long-term culture and retention strategies.',
                    'Reputation Management': 'Proactive identification of cultural risks that could impact company reputation.',
                    'Employee Retention': 'Analytics focused on reducing turnover through culture improvements.',
                    'Guidance & Support': 'Practical recommendations for managers to support their teams effectively.',
                    'Early Warning': 'Alert system for detecting team dynamics issues before they escalate.',
                    'Empowerment': 'Tools and insights that help managers make confident culture decisions.',
                    'Trust Building': 'Transparent, non-punitive analytics that build trust between teams and management.'
                  };
                  alert(descriptions[area as keyof typeof descriptions] || 'Focus area description');
                }}
              >
                {area}
              </Button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8" data-tour="key-metrics">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Shield className="h-4 w-4 mr-2 text-green-500" />
                  Confidentiality
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(metrics.confidentiality_level * 100).toFixed(1)}%</div>
                <p className="text-xs text-gray-600">Data anonymization level</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Brain className="h-4 w-4 mr-2 text-blue-500" />
                  Actionable Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.actionable_insights_count}</div>
                <p className="text-xs text-gray-600">This quarter</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Users className="h-4 w-4 mr-2 text-purple-500" />
                  Engagement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(metrics.engagement_score * 100).toFixed(0)}%</div>
                <p className="text-xs text-gray-600">Stakeholder usage</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2 text-green-500" />
                  Culture Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+{(metrics.culture_improvement_score * 100).toFixed(1)}%</div>
                <p className="text-xs text-gray-600">Year over year</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Analytics */}
        <Tabs defaultValue="bubbles" className="space-y-6" data-tour="analytics-tabs">
          <TabsList>
            <TabsTrigger value="bubbles">Behavior Patterns</TabsTrigger>
            <TabsTrigger value="timeline">Trend Timeline</TabsTrigger>
            <TabsTrigger value="heatmap">Organizational Heatmap</TabsTrigger>
            <TabsTrigger value="interventions" data-tour="interventions-tab">Intervention Tracking</TabsTrigger>
            <TabsTrigger value="export" data-tour="export-functionality">Data Export</TabsTrigger>
          </TabsList>

          <TabsContent value="bubbles">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Workplace Behavior Patterns
                </CardTitle>
                <div className="flex items-center space-x-4 mt-4">
                  <select
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value as any)}
                    className="px-3 py-1 border border-gray-300 rounded text-sm"
                    data-tour="time-filter"
                  >
                    <option value="week">Past Week</option>
                    <option value="month">Past Month</option>
                    <option value="quarter">Past Quarter</option>
                  </select>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="all">All Categories</option>
                    <option value="Communication">Communication</option>
                    <option value="Leadership">Leadership</option>
                    <option value="Process">Process</option>
                    <option value="Culture">Culture</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent>
                <div data-tour="bubble-chart">
                  <BehaviorBubbleChart
                    data={behaviorData}
                    stakeholderRole={userRole}
                    width={800}
                    height={500}
                    onPatternClick={handlePatternClick}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Behavior Patterns Timeline
                </CardTitle>
                <p className="text-sm text-gray-600 mt-2">
                  Animated visualization showing how behavior patterns evolve over time
                </p>
              </CardHeader>
              <CardContent>
                <TimelineVisualization
                  data={behaviorData}
                  width={800}
                  height={400}
                  timeRange={timeFilter}
                  autoPlay={false}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="heatmap">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="h-5 w-5 mr-2" />
                  Organizational Health "City" View
                </CardTitle>
                <p className="text-sm text-gray-600 mt-2">
                  Visualize organizational units as buildings - height represents toxicity level, size represents team size
                </p>
              </CardHeader>
              <CardContent>
                <OrganizationalHeatmap
                  data={heatmapData}
                  width={900}
                  height={600}
                  onUnitClick={(unit) => console.log('Unit selected:', unit)}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="interventions">
            <InterventionTracker
              stakeholderRole={userRole}
              onCreateIntervention={() => console.log('Create new intervention')}
            />
          </TabsContent>

          <TabsContent value="export">
            <DataExport
              behaviorData={behaviorData}
              stakeholderRole={userRole}
              timeRange={timeFilter}
              onExportComplete={(format) => console.log(`Export completed: ${format}`)}
            />
          </TabsContent>
        </Tabs>

        {/* Pattern Summary */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Pattern Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {behaviorData.map((pattern) => (
                <div key={pattern.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">{pattern.pattern_type}</h4>
                    {getTrendIcon(pattern.trend_direction)}
                  </div>
                  <div className="space-y-1 text-xs text-gray-600">
                    <p>Severity: {pattern.severity_avg.toFixed(1)}/5</p>
                    <p>Frequency: {pattern.frequency} occurrences</p>
                    <p>Category: {pattern.category}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tour completion marker */}
        <div data-tour="analytics-complete" className="hidden" />

        {/* Analytics Tour */}
        <UnifiedTour
          isOpen={showTour}
          onClose={() => setShowTour(false)}
          onComplete={() => {
            setShowTour(false);
            console.log('Unified analytics tour completed!');
          }}
          context="analytics"
        />
      </div>
    </div>
  );
}