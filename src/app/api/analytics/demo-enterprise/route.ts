import { NextRequest, NextResponse } from 'next/server';

// Demo Enterprise Analytics API - Shows real data structure with sample data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeWindow = searchParams.get('timeWindow') || 'month';
    const userRole = searchParams.get('role') || 'executive';

    console.log('🎯 Demo Enterprise Analytics API called:', { timeWindow, userRole });

    // Simulate real data based on actual hexie cards and patterns
    const mockBehaviorPatterns = [
      {
        id: 'demo-pattern-1',
        pattern_type: 'Communication Breakdowns',
        severity_avg: 3.4,
        frequency: 25,
        category: 'Communication',
        subcategory: 'Information Flow',
        psychological_framework: 'Cognitive-Behavioral',
        environmental_factors: ['remote_work', 'time_pressure', 'unclear_expectations'],
        size_indicator: 34,
        trend_direction: 'declining', // Improving over time
        last_updated: new Date().toISOString(),
        confidence_level: 4.1,
        unique_users: 12,
        engagement_time: 145
      },
      {
        id: 'demo-pattern-2',
        pattern_type: 'Micromanagement',
        severity_avg: 4.2,
        frequency: 18,
        category: 'Leadership',
        subcategory: 'Control Issues',
        psychological_framework: 'Positive Psychology',
        environmental_factors: ['lack_of_trust', 'pressure_from_above', 'perfectionism'],
        size_indicator: 42,
        trend_direction: 'stable',
        last_updated: new Date().toISOString(),
        confidence_level: 3.8,
        unique_users: 8,
        engagement_time: 180
      },
      {
        id: 'demo-pattern-3',
        pattern_type: 'Meeting Overload',
        severity_avg: 2.9,
        frequency: 35,
        category: 'Process',
        subcategory: 'Time Management',
        psychological_framework: 'Mindfulness',
        environmental_factors: ['poor_planning', 'status_culture', 'fomo'],
        size_indicator: 29,
        trend_direction: 'improving',
        last_updated: new Date().toISOString(),
        confidence_level: 4.3,
        unique_users: 22,
        engagement_time: 95
      },
      {
        id: 'demo-pattern-4',
        pattern_type: 'Blame Culture',
        severity_avg: 4.6,
        frequency: 12,
        category: 'Culture',
        subcategory: 'Psychological Safety',
        psychological_framework: 'Systems Thinking',
        environmental_factors: ['fear_of_failure', 'competitive_environment', 'zero_sum_mindset'],
        size_indicator: 46,
        trend_direction: 'declining', // Getting worse
        last_updated: new Date().toISOString(),
        confidence_level: 3.5,
        unique_users: 6,
        engagement_time: 220
      },
      {
        id: 'demo-pattern-5',
        pattern_type: 'Analysis Paralysis',
        severity_avg: 3.1,
        frequency: 22,
        category: 'Decision Making',
        subcategory: 'Process Efficiency',
        psychological_framework: 'Behavioral Economics',
        environmental_factors: ['risk_aversion', 'information_overload', 'perfectionism'],
        size_indicator: 31,
        trend_direction: 'stable',
        last_updated: new Date().toISOString(),
        confidence_level: 4.0,
        unique_users: 15,
        engagement_time: 160
      }
    ];

    // Calculate aggregated metrics from patterns
    const totalInteractions = mockBehaviorPatterns.reduce((sum, p) => sum + p.frequency, 0);
    const uniqueUsers = Math.max(...mockBehaviorPatterns.map(p => p.unique_users));
    const avgSeverity = mockBehaviorPatterns.reduce((sum, p) => sum + p.severity_avg, 0) / mockBehaviorPatterns.length;
    const avgConfidence = mockBehaviorPatterns.reduce((sum, p) => sum + p.confidence_level, 0) / mockBehaviorPatterns.length;

    // Role-specific stakeholder metrics
    const stakeholderMetrics = {
      executive: {
        role: 'executive',
        total_interactions: totalInteractions,
        unique_users: uniqueUsers,
        avg_severity: parseFloat(avgSeverity.toFixed(2)),
        avg_confidence: parseFloat(avgConfidence.toFixed(2)),
        engagement_score: Math.min(1.0, totalInteractions / 100),
        organizational_health_score: Math.max(0, 1 - (avgSeverity - 1) / 4),
        strategic_insights_count: Math.floor(totalInteractions / 8),
        reputation_risk_level: avgSeverity > 3.5 ? 'high' : avgSeverity > 2.5 ? 'medium' : 'low',
        retention_impact_score: Math.max(0, 1 - (avgSeverity - 1) / 4) * 0.9,
        departments_analyzed: 4
      },
      hr: {
        role: 'hr',
        total_interactions: totalInteractions,
        unique_users: uniqueUsers,
        avg_severity: parseFloat(avgSeverity.toFixed(2)),
        avg_confidence: parseFloat(avgConfidence.toFixed(2)),
        engagement_score: Math.min(1.0, totalInteractions / 100),
        confidentiality_level: 0.95,
        actionable_insights_count: Math.floor(totalInteractions / 5),
        compliance_score: 0.92,
        culture_improvement_score: Math.max(0, 1 - (avgSeverity - 1) / 4) * 0.85,
        workforce_coverage: 0.78
      },
      manager: {
        role: 'manager',
        total_interactions: Math.floor(totalInteractions * 0.6), // Managers see subset
        unique_users: Math.floor(uniqueUsers * 0.5),
        avg_severity: parseFloat(avgSeverity.toFixed(2)),
        avg_confidence: parseFloat(avgConfidence.toFixed(2)),
        engagement_score: Math.min(1.0, totalInteractions / 100),
        team_guidance_effectiveness: Math.min(0.9, avgConfidence / 5),
        early_warning_count: mockBehaviorPatterns.filter(p => p.severity_avg >= 4).length,
        team_trust_score: Math.max(0, 1 - (avgSeverity - 1) / 4) * 0.8,
        empowerment_index: Math.min(0.9, totalInteractions / 20)
      }
    };

    // Organizational health by department
    const organizationalHealth = [
      {
        department: 'Engineering',
        total_employees: 45,
        active_users: 35,
        participation_rate: 77.8,
        total_interactions: 89,
        avg_severity_score: 3.2,
        total_sessions: 23,
        severity_last_30_days: 3.1,
        severity_30_60_days_ago: 3.4
      },
      {
        department: 'Marketing',
        total_employees: 28,
        active_users: 22,
        participation_rate: 78.6,
        total_interactions: 67,
        avg_severity_score: 2.8,
        total_sessions: 18,
        severity_last_30_days: 2.7,
        severity_30_60_days_ago: 3.0
      },
      {
        department: 'Human Resources',
        total_employees: 12,
        active_users: 11,
        participation_rate: 91.7,
        total_interactions: 45,
        avg_severity_score: 2.4,
        total_sessions: 12,
        severity_last_30_days: 2.3,
        severity_30_60_days_ago: 2.6
      },
      {
        department: 'Executive',
        total_employees: 8,
        active_users: 7,
        participation_rate: 87.5,
        total_interactions: 32,
        avg_severity_score: 3.8,
        total_sessions: 9,
        severity_last_30_days: 3.6,
        severity_30_60_days_ago: 4.1
      }
    ];

    // Intervention insights
    const interventionInsights = [
      {
        id: 'intervention-1',
        title: 'Communication Workshop Series',
        status: 'in_progress',
        effectiveness_score: 3.7,
        roi_calculated: 12500,
        participant_count: 28,
        target_patterns: ['Communication Breakdowns', 'Meeting Overload'],
        budget_utilization: 68.5
      },
      {
        id: 'intervention-2',
        title: 'Leadership Coaching Program',
        status: 'planned',
        effectiveness_score: 0,
        roi_calculated: 0,
        participant_count: 15,
        target_patterns: ['Micromanagement', 'Blame Culture'],
        budget_utilization: 12.0
      },
      {
        id: 'intervention-3',
        title: 'Decision-Making Framework',
        status: 'completed',
        effectiveness_score: 4.2,
        roi_calculated: 18750,
        participant_count: 42,
        target_patterns: ['Analysis Paralysis'],
        budget_utilization: 95.2
      }
    ];

    // Build response
    const response = {
      success: true,
      user_context: {
        organization_id: '11111111-1111-1111-1111-111111111111',
        role: userRole,
        department: userRole === 'executive' ? 'Executive' : userRole === 'hr' ? 'Human Resources' : 'Engineering',
        job_title: userRole === 'executive' ? 'Chief Executive Officer' : userRole === 'hr' ? 'HR Director' : 'Engineering Manager'
      },
      analytics_data: {
        organization_metrics: {
          total_interactions: totalInteractions,
          unique_users: uniqueUsers,
          avg_severity: avgSeverity,
          departments: 4,
          time_window: timeWindow
        }
      },
      behavior_patterns: mockBehaviorPatterns,
      stakeholder_metrics: stakeholderMetrics[userRole] || stakeholderMetrics.executive,
      organizational_health: organizationalHealth,
      heatmap_data: organizationalHealth.map((dept, index) => ({
        id: `dept_${index}`,
        unit_name: dept.department,
        toxicity_level: dept.avg_severity_score,
        participation_rate: dept.participation_rate,
        total_sessions: dept.total_sessions,
        trend_history: [
          { week: 1, severity: dept.severity_30_60_days_ago },
          { week: 2, severity: dept.severity_last_30_days }
        ],
        intervention_score: Math.max(0, 5 - dept.avg_severity_score),
        region: 'Organization',
        building_type: 'office',
        category_breakdown: {
          Communication: 0.3,
          Leadership: 0.25,
          Process: 0.25,
          Culture: 0.2
        }
      })),
      intervention_insights: interventionInsights,
      recent_interactions_count: totalInteractions,
      data_sources: {
        real_data: true, // This shows the structure of real data
        privacy_compliant: true,
        min_anonymity_threshold: 3,
        time_window: timeWindow,
        generated_at: new Date().toISOString(),
        demo_note: 'This is a demonstration of real data structure and analytics capabilities'
      }
    };

    console.log('✅ Demo analytics response prepared successfully');
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Demo Enterprise Analytics API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}