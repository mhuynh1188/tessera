import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get user sessions data
    const { data: sessions, error: sessionsError } = await supabase
      .from('user_sessions')
      .select(`
        user_id,
        started_at,
        ended_at,
        page_views,
        actions_performed,
        users!inner (
          id,
          first_name,
          last_name,
          email,
          departments (
            name
          )
        )
      `)
      .gte('started_at', thirtyDaysAgo.toISOString());

    if (sessionsError) {
      console.error('Error fetching user sessions:', sessionsError);
      return NextResponse.json({ error: 'Failed to fetch user engagement data' }, { status: 500 });
    }

    // Get card usage data
    const { data: cardUsage, error: cardError } = await supabase
      .from('card_usage_analytics')
      .select('user_id, card_id')
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (cardError) {
      console.error('Error fetching card usage:', cardError);
    }

    // Get scenario analytics data
    const { data: scenarioData, error: scenarioError } = await supabase
      .from('scenario_analytics')
      .select('user_id, scenario_id, completion_status, effectiveness_rating')
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (scenarioError) {
      console.error('Error fetching scenario data:', scenarioError);
    }

    // Process user engagement data
    const userEngagementMap = new Map();

    // Process sessions
    sessions?.forEach(session => {
      const userId = session.user_id;
      const user = session.users;
      
      if (!userEngagementMap.has(userId)) {
        userEngagementMap.set(userId, {
          id: userId,
          first_name: user.first_name || 'Unknown',
          last_name: user.last_name || 'User',
          email: user.email,
          department_name: user.departments?.name || 'No Department',
          total_sessions: 0,
          total_page_views: 0,
          total_actions: 0,
          unique_cards_used: new Set(),
          unique_scenarios_attempted: new Set(),
          scenarios_completed: 0,
          total_hours_active: 0,
          avg_scenario_rating: 0,
          scenario_ratings: []
        });
      }

      const userStats = userEngagementMap.get(userId);
      userStats.total_sessions++;
      userStats.total_page_views += session.page_views || 0;
      userStats.total_actions += session.actions_performed || 0;
      
      // Calculate session duration
      if (session.started_at && session.ended_at) {
        const duration = new Date(session.ended_at).getTime() - new Date(session.started_at).getTime();
        userStats.total_hours_active += duration / (1000 * 60 * 60); // Convert to hours
      }
    });

    // Process card usage
    cardUsage?.forEach(usage => {
      const userStats = userEngagementMap.get(usage.user_id);
      if (userStats) {
        userStats.unique_cards_used.add(usage.card_id);
      }
    });

    // Process scenario data
    scenarioData?.forEach(scenario => {
      const userStats = userEngagementMap.get(scenario.user_id);
      if (userStats) {
        userStats.unique_scenarios_attempted.add(scenario.scenario_id);
        
        if (scenario.completion_status === 'completed') {
          userStats.scenarios_completed++;
        }
        
        if (scenario.effectiveness_rating) {
          userStats.scenario_ratings.push(scenario.effectiveness_rating);
        }
      }
    });

    // Calculate final metrics and engagement scores
    const userEngagement = Array.from(userEngagementMap.values())
      .map(user => {
        // Calculate average scenario rating
        user.avg_scenario_rating = user.scenario_ratings.length > 0
          ? user.scenario_ratings.reduce((sum, rating) => sum + rating, 0) / user.scenario_ratings.length
          : 0;

        // Convert sets to counts
        user.unique_cards_used = user.unique_cards_used.size;
        user.unique_scenarios_attempted = user.unique_scenarios_attempted.size;

        // Calculate engagement score
        user.engagement_score = (
          user.total_sessions * 5 +
          user.unique_cards_used * 3 +
          user.scenarios_completed * 10 +
          Math.min(user.total_hours_active * 2, 50) // Cap hours contribution at 25 hours
        );

        // Remove temporary arrays
        delete user.scenario_ratings;

        return user;
      })
      .filter(user => user.total_sessions > 0) // Only include users with activity
      .sort((a, b) => b.engagement_score - a.engagement_score)
      .slice(0, 50); // Top 50 users

    // Add engagement rank
    userEngagement.forEach((user, index) => {
      user.engagement_rank = index + 1;
    });

    return NextResponse.json(userEngagement);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}