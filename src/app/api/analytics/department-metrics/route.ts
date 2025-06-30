import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get department-level engagement data
    const { data: departmentData, error } = await supabase
      .from('users')
      .select(`
        id,
        organization_id,
        departments (
          name
        ),
        user_sessions!inner (
          started_at,
          actions_performed
        ),
        analytics_events (
          created_at,
          duration_seconds
        )
      `)
      .not('is_archived', 'eq', true)
      .gte('user_sessions.started_at', thirtyDaysAgo.toISOString())
      .gte('analytics_events.created_at', thirtyDaysAgo.toISOString());

    if (error) {
      console.error('Error fetching department data:', error);
      return NextResponse.json({ error: 'Failed to fetch department metrics' }, { status: 500 });
    }

    // Process department metrics
    const departmentMap = new Map();

    departmentData?.forEach(user => {
      const departmentName = user.departments?.name || 'No Department';
      
      if (!departmentMap.has(departmentName)) {
        departmentMap.set(departmentName, {
          department_name: departmentName,
          total_users: new Set(),
          active_users_30d: new Set(),
          total_actions: 0,
          total_hours: 0,
          session_count: 0
        });
      }

      const deptStats = departmentMap.get(departmentName);
      deptStats.total_users.add(user.id);

      // Process user sessions
      if (user.user_sessions && user.user_sessions.length > 0) {
        deptStats.active_users_30d.add(user.id);
        
        user.user_sessions.forEach(session => {
          deptStats.session_count++;
          deptStats.total_actions += session.actions_performed || 0;
        });
      }

      // Process analytics events for time tracking
      if (user.analytics_events) {
        user.analytics_events.forEach(event => {
          deptStats.total_hours += (event.duration_seconds || 0) / 3600;
        });
      }
    });

    // Calculate final metrics
    const departmentMetrics = Array.from(departmentMap.values())
      .map(dept => {
        const totalUsers = dept.total_users.size;
        const activeUsers = dept.active_users_30d.size;
        
        return {
          department_name: dept.department_name,
          total_users: totalUsers,
          active_users_30d: activeUsers,
          activity_rate: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 1000) / 10 : 0,
          avg_actions_per_user: activeUsers > 0 ? Math.round((dept.total_actions / activeUsers) * 10) / 10 : 0,
          total_department_hours: Math.round(dept.total_hours * 10) / 10
        };
      })
      .filter(dept => dept.total_users > 0) // Only include departments with users
      .sort((a, b) => b.activity_rate - a.activity_rate); // Sort by activity rate

    return NextResponse.json(departmentMetrics);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}