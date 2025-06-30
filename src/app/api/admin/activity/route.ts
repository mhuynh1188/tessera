import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAdminAuth } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { user, organizationId } = authResult;
    const supabase = createClient();

    // Get recent activity from admin_activity_logs
    const { data: activities, error } = await supabase
      .from('admin_activity_logs')
      .select(`
        id,
        action,
        resource_type,
        details,
        success,
        created_at,
        user_id
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching activities:', error);
      // Return empty data instead of error to make it more resilient
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    // Transform the data for the frontend
    const transformedActivities = (activities || []).map(activity => {
      const userName = 'Admin User';

      // Determine activity type and severity
      let type = 'general';
      let severity = 'info';

      if (activity.action.includes('login')) {
        type = 'user_login';
        severity = activity.success ? 'info' : 'warning';
      } else if (activity.action.includes('security') || activity.action.includes('2fa')) {
        type = 'security';
        severity = activity.success ? 'success' : 'warning';
      } else if (activity.action.includes('email') || activity.action.includes('template')) {
        type = 'email';
        severity = 'info';
      } else if (activity.action.includes('user')) {
        type = 'user_management';
        severity = 'info';
      }

      // Create a human-readable message
      let message = activity.details || activity.action;
      if (activity.action === 'login_success') {
        message = `${userName} logged in successfully`;
      } else if (activity.action === 'login_failed') {
        message = `Failed login attempt for ${userName}`;
      } else if (activity.action === 'template_created') {
        message = `${userName} created a new email template`;
      } else if (activity.action === 'user_created') {
        message = `${userName} created a new user account`;
      } else if (activity.action === 'mfa_enabled') {
        message = `2FA enabled for ${userName}`;
      }

      return {
        id: activity.id,
        type,
        message,
        user: userName,
        timestamp: formatTimestamp(activity.created_at),
        severity,
        success: activity.success
      };
    });

    return NextResponse.json({
      success: true,
      data: transformedActivities
    });

  } catch (error) {
    console.error('Error fetching admin activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin activity' },
      { status: 500 }
    );
  }
}

function formatTimestamp(timestamp: string): string {
  const now = new Date();
  const activityTime = new Date(timestamp);
  const diffInMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
  } else if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  } else {
    const days = Math.floor(diffInMinutes / 1440);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }
}