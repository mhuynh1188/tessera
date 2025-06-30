import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get organization overview metrics for authenticated user's org
    const { data, error } = await supabase.rpc('get_organization_metrics');

    if (error) {
      console.error('Error fetching organization metrics:', error);
      return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Alternative implementation using direct SQL query if RPC doesn't work
export async function POST(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('analytics_events')
      .select(`
        user_id,
        organization_id,
        created_at,
        event_type,
        duration_seconds
      `)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Process the data to calculate metrics
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const events30d = data.filter(event => new Date(event.created_at) >= thirtyDaysAgo);
    const events7d = data.filter(event => new Date(event.created_at) >= sevenDaysAgo);

    const uniqueUsers30d = new Set(events30d.map(e => e.user_id)).size;
    const uniqueUsers7d = new Set(events7d.map(e => e.user_id)).size;
    const totalHours = events30d.reduce((sum, e) => sum + (e.duration_seconds || 0), 0) / 3600;

    // Get total users count
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Get scenarios data
    const { data: scenarioData } = await supabase
      .from('scenario_analytics')
      .select('effectiveness_rating')
      .not('effectiveness_rating', 'is', null)
      .gte('created_at', thirtyDaysAgo.toISOString());

    const avgScenarioEffectiveness = scenarioData?.length 
      ? scenarioData.reduce((sum, s) => sum + s.effectiveness_rating, 0) / scenarioData.length
      : 0;

    const metrics = {
      total_users: totalUsers || 0,
      active_users_7d: uniqueUsers7d,
      active_users_30d: uniqueUsers30d,
      engagement_rate_30d: totalUsers ? (uniqueUsers30d / totalUsers) * 100 : 0,
      active_subscribers: 0, // Would need subscription data
      total_cards_accessed: events30d.filter(e => e.event_type === 'card_view').length,
      total_scenarios_available: 0, // Would need scenario count
      total_workspaces: 0, // Would need workspace count
      total_hours_engaged: totalHours,
      total_sessions_30d: new Set(events30d.map(e => e.user_id + '_' + e.created_at.split('T')[0])).size,
      avg_scenario_effectiveness: avgScenarioEffectiveness
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error calculating metrics:', error);
    return NextResponse.json({ error: 'Failed to calculate metrics' }, { status: 500 });
  }
}