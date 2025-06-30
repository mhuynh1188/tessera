import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get weekly trend data for the last 12 weeks
    const twelveWeeksAgo = new Date();
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84); // 12 weeks * 7 days

    const { data: analyticsEvents, error } = await supabase
      .from('analytics_events')
      .select(`
        user_id,
        session_id,
        event_type,
        duration_seconds,
        created_at
      `)
      .gte('created_at', twelveWeeksAgo.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching analytics events:', error);
      return NextResponse.json({ error: 'Failed to fetch trend data' }, { status: 500 });
    }

    // Group data by week and calculate metrics
    const weeklyData = new Map();

    // Initialize weeks
    for (let i = 0; i < 12; i++) {
      const weekStart = new Date(twelveWeeksAgo);
      weekStart.setDate(weekStart.getDate() + (i * 7));
      const weekKey = weekStart.toISOString().split('T')[0];
      
      weeklyData.set(weekKey, {
        week_start: weekKey,
        active_users: new Set(),
        total_sessions: new Set(),
        card_views: 0,
        scenario_starts: 0,
        searches: 0,
        total_hours: 0
      });
    }

    // Process events
    analyticsEvents?.forEach(event => {
      const eventDate = new Date(event.created_at);
      const weekStart = new Date(eventDate);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
      const weekKey = weekStart.toISOString().split('T')[0];

      const weekData = weeklyData.get(weekKey);
      if (weekData) {
        weekData.active_users.add(event.user_id);
        if (event.session_id) {
          weekData.total_sessions.add(event.session_id);
        }
        
        switch (event.event_type) {
          case 'card_view':
            weekData.card_views++;
            break;
          case 'scenario_start':
            weekData.scenario_starts++;
            break;
          case 'search':
            weekData.searches++;
            break;
        }
        
        weekData.total_hours += (event.duration_seconds || 0) / 3600;
      }
    });

    // Convert to array and calculate percentage changes
    const trendData = Array.from(weeklyData.values())
      .map(week => ({
        ...week,
        active_users: week.active_users.size,
        total_sessions: week.total_sessions.size,
        total_hours: Math.round(week.total_hours * 10) / 10
      }))
      .sort((a, b) => new Date(a.week_start).getTime() - new Date(b.week_start).getTime());

    // Calculate week-over-week percentage changes
    for (let i = 1; i < trendData.length; i++) {
      const current = trendData[i];
      const previous = trendData[i - 1];
      
      current.active_users_change_pct = previous.active_users > 0 
        ? Math.round(((current.active_users - previous.active_users) / previous.active_users) * 1000) / 10
        : 0;
        
      current.sessions_change_pct = previous.total_sessions > 0
        ? Math.round(((current.total_sessions - previous.total_sessions) / previous.total_sessions) * 1000) / 10
        : 0;
        
      current.card_views_change_pct = previous.card_views > 0
        ? Math.round(((current.card_views - previous.card_views) / previous.card_views) * 1000) / 10
        : 0;
    }

    // Set first week changes to 0
    if (trendData.length > 0) {
      trendData[0].active_users_change_pct = 0;
      trendData[0].sessions_change_pct = 0;
      trendData[0].card_views_change_pct = 0;
    }

    return NextResponse.json(trendData);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}