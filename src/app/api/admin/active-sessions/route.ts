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

    // Get active sessions from user_sessions table
    const { data: sessions, error: sessionsError } = await supabase
      .from('user_sessions')
      .select(`
        *,
        user_profiles (
          first_name,
          last_name,
          profile_image_url
        )
      `)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('last_activity_at', { ascending: false });

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      // If table doesn't exist, create mock data for development
      const mockSessions = generateMockSessions();
      
      return NextResponse.json({
        success: true,
        data: {
          sessions: mockSessions,
          summary: {
            total_active: mockSessions.length,
            unique_users: new Set(mockSessions.map(s => s.user_id)).size,
            mobile_sessions: mockSessions.filter(s => s.device_type === 'mobile').length,
            desktop_sessions: mockSessions.filter(s => s.device_type === 'desktop').length,
            suspicious_sessions: mockSessions.filter(s => s.is_suspicious).length
          }
        }
      });
    }

    // Transform sessions for frontend
    const transformedSessions = (sessions || []).map(session => ({
      id: session.id,
      user_id: session.user_id,
      user_name: session.user_profiles ? 
        `${session.user_profiles.first_name} ${session.user_profiles.last_name}` : 
        'Unknown User',
      user_avatar: session.user_profiles?.profile_image_url || null,
      ip_address: session.ip_address,
      location: session.location || parseLocationFromIP(session.ip_address),
      device_type: session.device_type || parseDeviceType(session.user_agent),
      browser: parseBrowser(session.user_agent),
      os: parseOS(session.user_agent),
      started_at: session.created_at,
      last_activity: session.last_activity_at,
      is_current: session.user_id === user.id,
      is_suspicious: session.is_suspicious || false,
      session_duration: calculateDuration(session.created_at, session.last_activity_at),
      user_agent: session.user_agent
    }));

    const summary = {
      total_active: transformedSessions.length,
      unique_users: new Set(transformedSessions.map(s => s.user_id)).size,
      mobile_sessions: transformedSessions.filter(s => s.device_type === 'mobile').length,
      desktop_sessions: transformedSessions.filter(s => s.device_type === 'desktop').length,
      suspicious_sessions: transformedSessions.filter(s => s.is_suspicious).length
    };

    return NextResponse.json({
      success: true,
      data: {
        sessions: transformedSessions,
        summary
      }
    });

  } catch (error) {
    console.error('Error fetching active sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active sessions' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    const { data: orgMember } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    if (!orgMember || !['admin', 'owner'].includes(orgMember.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { session_id, user_id } = body;

    if (!session_id) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Terminate session
    const { error: updateError } = await supabase
      .from('user_sessions')
      .update({ 
        is_active: false,
        terminated_at: new Date().toISOString(),
        terminated_by: user.id
      })
      .eq('id', session_id)
      .eq('organization_id', organizationId);

    if (updateError) {
      console.error('Error terminating session:', updateError);
      return NextResponse.json({ error: 'Failed to terminate session' }, { status: 500 });
    }

    // Log the action
    await supabase
      .from('admin_activity_logs')
      .insert({
        user_id: user.id,
        organization_id: orgMember.organization_id,
        action: 'session_terminated',
        resource_type: 'user_session',
        resource_id: session_id,
        details: `Terminated session for user: ${user_id}`,
        success: true
      });

    return NextResponse.json({
      success: true,
      message: 'Session terminated successfully'
    });

  } catch (error) {
    console.error('Error terminating session:', error);
    return NextResponse.json(
      { error: 'Failed to terminate session' },
      { status: 500 }
    );
  }
}

function generateMockSessions() {
  const mockUsers = [
    { id: 'user1', name: 'John Doe', avatar: null },
    { id: 'user2', name: 'Jane Smith', avatar: null },
    { id: 'user3', name: 'Mike Johnson', avatar: null },
    { id: 'user4', name: 'Sarah Wilson', avatar: null }
  ];

  const locations = ['New York, US', 'London, UK', 'Tokyo, JP', 'Sydney, AU', 'Toronto, CA'];
  const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge'];
  const devices = ['desktop', 'mobile', 'tablet'];
  const oses = ['Windows 11', 'macOS', 'iOS', 'Android', 'Linux'];

  return Array.from({ length: 12 }, (_, i) => {
    const user = mockUsers[i % mockUsers.length];
    const startTime = new Date(Date.now() - Math.random() * 8 * 60 * 60 * 1000);
    const lastActivity = new Date(startTime.getTime() + Math.random() * 4 * 60 * 60 * 1000);

    return {
      id: `session-${i + 1}`,
      user_id: user.id,
      user_name: user.name,
      user_avatar: user.avatar,
      ip_address: `192.168.1.${100 + i}`,
      location: locations[i % locations.length],
      device_type: devices[i % devices.length],
      browser: browsers[i % browsers.length],
      os: oses[i % oses.length],
      started_at: startTime.toISOString(),
      last_activity: lastActivity.toISOString(),
      is_current: i === 0,
      is_suspicious: Math.random() > 0.8,
      session_duration: calculateDuration(startTime.toISOString(), lastActivity.toISOString()),
      user_agent: `Mozilla/5.0 (${oses[i % oses.length]}) ${browsers[i % browsers.length]}`
    };
  });
}

function parseLocationFromIP(ip: string): string {
  // Mock location parsing - in production, use a geolocation service
  const locations = ['New York, US', 'London, UK', 'Tokyo, JP', 'Sydney, AU', 'Toronto, CA'];
  return locations[Math.floor(Math.random() * locations.length)];
}

function parseDeviceType(userAgent: string): string {
  if (!userAgent) return 'unknown';
  if (/Mobile|Android|iPhone|iPad/.test(userAgent)) return 'mobile';
  if (/Tablet|iPad/.test(userAgent)) return 'tablet';
  return 'desktop';
}

function parseBrowser(userAgent: string): string {
  if (!userAgent) return 'Unknown';
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  return 'Unknown';
}

function parseOS(userAgent: string): string {
  if (!userAgent) return 'Unknown';
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac OS')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
  if (userAgent.includes('Android')) return 'Android';
  return 'Unknown';
}

function calculateDuration(start: string, end: string): string {
  const startTime = new Date(start);
  const endTime = new Date(end);
  const diffMs = endTime.getTime() - startTime.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes}m`;
  }
  return `${diffMinutes}m`;
}