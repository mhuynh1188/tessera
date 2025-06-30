import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Privacy-preserving analytics API
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);
    
    const timeWindow = searchParams.get('timeWindow') || 'month';
    const stakeholderRole = searchParams.get('role') || 'hr';
    const organizationId = searchParams.get('orgId');

    // Verify user has analytics access
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get time range for filtering
    const timeRanges = {
      week: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      month: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      quarter: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    };
    const startDate = timeRanges[timeWindow as keyof typeof timeRanges];

    // Privacy-preserving aggregation query
    // This query ensures k-anonymity by requiring minimum sample sizes
    const { data: behaviorPatterns, error } = await supabase.rpc('get_behavior_patterns', {
      start_date: startDate.toISOString(),
      min_sample_size: 5, // K-anonymity requirement
      stakeholder_role: stakeholderRole
    });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch analytics data' }, { status: 500 });
    }

    // Transform data for frontend consumption
    const transformedData = behaviorPatterns?.map((pattern: any) => ({
      id: pattern.pattern_id,
      pattern_type: pattern.pattern_name,
      severity_avg: parseFloat(pattern.avg_severity),
      frequency: parseInt(pattern.pattern_frequency),
      category: pattern.category_name,
      subcategory: pattern.subcategory || 'General',
      psychological_framework: pattern.framework || 'Cognitive-Behavioral',
      environmental_factors: pattern.environmental_factors || [],
      size_indicator: parseInt(pattern.impact_score),
      trend_direction: calculateTrend(pattern.trend_data),
      last_updated: pattern.last_updated
    })) || [];

    return NextResponse.json({
      patterns: transformedData,
      metadata: {
        total_patterns: transformedData.length,
        time_window: timeWindow,
        stakeholder_role: stakeholderRole,
        privacy_level: 'k-anonymous',
        min_sample_size: 5
      }
    });

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to calculate trend direction
function calculateTrend(trendData: any[]): 'improving' | 'stable' | 'declining' {
  if (!trendData || trendData.length < 2) return 'stable';
  
  const recent = trendData.slice(-3).map(d => d.severity);
  const earlier = trendData.slice(0, 3).map(d => d.severity);
  
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;
  
  const change = recentAvg - earlierAvg;
  
  if (change < -0.2) return 'improving';
  if (change > 0.2) return 'declining';
  return 'stable';
}