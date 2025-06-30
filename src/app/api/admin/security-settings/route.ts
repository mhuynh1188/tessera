import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get organization_id and role for the user
    const { data: orgMember } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    if (!orgMember || !['admin', 'owner'].includes(orgMember.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get organization security settings
    const { data: orgSettings } = await supabase
      .from('organizations')
      .select('security_settings')
      .eq('id', orgMember.organization_id)
      .single();

    // Get security-related statistics
    const [
      { data: usersWithMFA },
      { data: recentSecurityEvents },
      { data: failedLogins }
    ] = await Promise.all([
      supabase
        .from('user_two_factor_auth')
        .select('user_id')
        .eq('is_verified', true),
      supabase
        .from('admin_activity_logs')
        .select('*')
        .eq('organization_id', orgMember.organization_id)
        .in('action', ['login_failed', 'suspicious_activity', 'mfa_enabled', 'password_changed'])
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('admin_activity_logs')
        .select('id')
        .eq('organization_id', orgMember.organization_id)
        .eq('action', 'login_failed')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    ]);

    const settings = orgSettings?.security_settings || {};
    
    const securityData = {
      settings: {
        require_mfa: settings.require_mfa || false,
        password_min_length: settings.password_min_length || 8,
        password_require_uppercase: settings.password_require_uppercase || false,
        password_require_lowercase: settings.password_require_lowercase || false,
        password_require_numbers: settings.password_require_numbers || false,
        password_require_symbols: settings.password_require_symbols || false,
        session_timeout_minutes: settings.session_timeout_minutes || 480,
        max_concurrent_sessions: settings.max_concurrent_sessions || 3,
        failed_login_lockout_attempts: settings.failed_login_lockout_attempts || 5,
        failed_login_lockout_duration: settings.failed_login_lockout_duration || 15,
        ip_whitelist_enabled: settings.ip_whitelist_enabled || false,
        ip_whitelist: settings.ip_whitelist || []
      },
      statistics: {
        users_with_mfa: usersWithMFA?.length || 0,
        failed_logins_24h: failedLogins?.length || 0,
        recent_security_events: recentSecurityEvents?.length || 0,
        last_security_audit: settings.last_security_audit || null
      },
      recent_events: (recentSecurityEvents || []).map(event => ({
        id: event.id,
        type: event.action,
        description: event.details,
        timestamp: event.created_at,
        severity: event.action.includes('failed') || event.action.includes('suspicious') ? 'high' : 'medium',
        user_id: event.user_id
      }))
    };

    return NextResponse.json({
      success: true,
      data: securityData
    });

  } catch (error) {
    console.error('Error fetching security settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch security settings' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
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
    const { settings } = body;

    if (!settings) {
      return NextResponse.json({ error: 'Settings are required' }, { status: 400 });
    }

    // Get current settings
    const { data: currentOrg } = await supabase
      .from('organizations')
      .select('security_settings')
      .eq('id', orgMember.organization_id)
      .single();

    const currentSettings = currentOrg?.security_settings || {};
    const updatedSettings = {
      ...currentSettings,
      ...settings,
      last_updated: new Date().toISOString(),
      updated_by: user.id
    };

    // Update organization security settings
    const { error: updateError } = await supabase
      .from('organizations')
      .update({ security_settings: updatedSettings })
      .eq('id', orgMember.organization_id);

    if (updateError) {
      console.error('Error updating security settings:', updateError);
      return NextResponse.json({ error: 'Failed to update security settings' }, { status: 500 });
    }

    // Log the action
    await supabase
      .from('admin_activity_logs')
      .insert({
        user_id: user.id,
        organization_id: orgMember.organization_id,
        action: 'security_settings_updated',
        resource_type: 'organization_settings',
        resource_id: orgMember.organization_id,
        details: `Updated security settings: ${Object.keys(settings).join(', ')}`,
        success: true
      });

    return NextResponse.json({
      success: true,
      data: updatedSettings
    });

  } catch (error) {
    console.error('Error updating security settings:', error);
    return NextResponse.json(
      { error: 'Failed to update security settings' },
      { status: 500 }
    );
  }
}