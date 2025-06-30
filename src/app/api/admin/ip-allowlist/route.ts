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

    // Get organization IP allowlist settings
    const { data: orgSettings } = await supabase
      .from('organizations')
      .select('ip_allowlist_settings, security_settings')
      .eq('id', organizationId)
      .single();

    // Get IP allowlist entries
    const { data: ipEntries } = await supabase
      .from('ip_allowlist')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    // Get recent blocked attempts
    const { data: blockedAttempts } = await supabase
      .from('admin_activity_logs')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('action', 'ip_blocked')
      .order('created_at', { ascending: false })
      .limit(50);

    const ipSettings = orgSettings?.ip_allowlist_settings || {};
    
    const allowlistData = {
      settings: {
        enabled: ipSettings.enabled || false,
        block_unknown_ips: ipSettings.block_unknown_ips || false,
        alert_on_new_ip: ipSettings.alert_on_new_ip || true,
        whitelist_mode: ipSettings.whitelist_mode || 'strict', // strict, permissive
        auto_block_threshold: ipSettings.auto_block_threshold || 5,
        block_duration_hours: ipSettings.block_duration_hours || 24
      },
      entries: (ipEntries || []).map(entry => ({
        id: entry.id,
        ip_address: entry.ip_address,
        ip_range: entry.ip_range,
        label: entry.label,
        description: entry.description,
        status: entry.status,
        created_by: entry.created_by,
        created_at: entry.created_at,
        last_used: entry.last_used,
        usage_count: entry.usage_count
      })),
      blocked_attempts: (blockedAttempts || []).map(attempt => ({
        id: attempt.id,
        ip_address: attempt.ip_address,
        user_agent: attempt.user_agent,
        details: attempt.details,
        timestamp: attempt.created_at,
        reason: getBlockReason(attempt.details)
      })),
      statistics: {
        total_entries: ipEntries?.length || 0,
        active_entries: ipEntries?.filter(e => e.status === 'active').length || 0,
        blocked_attempts_24h: blockedAttempts?.filter(a => 
          new Date(a.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        ).length || 0,
        unique_blocked_ips: new Set(blockedAttempts?.map(a => a.ip_address)).size || 0
      }
    };

    return NextResponse.json({
      success: true,
      data: allowlistData
    });

  } catch (error) {
    console.error('Error fetching IP allowlist data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch IP allowlist data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { user, organizationId } = authResult;
    const supabase = createClient();

    const body = await request.json();
    const { action, ip_address, ip_range, label, description, settings } = body;

    switch (action) {
      case 'add_ip':
        return await addIPEntry(supabase, organizationId, {
          ip_address,
          ip_range,
          label,
          description
        }, user.id);
      
      case 'remove_ip':
        return await removeIPEntry(supabase, organizationId, body.entry_id, user.id);
      
      case 'update_settings':
        return await updateIPSettings(supabase, organizationId, settings, user.id);
      
      case 'block_ip':
        return await blockIP(supabase, organizationId, ip_address, body.reason, user.id);
      
      case 'unblock_ip':
        return await unblockIP(supabase, organizationId, ip_address, user.id);
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error managing IP allowlist:', error);
    return NextResponse.json(
      { error: 'Failed to manage IP allowlist' },
      { status: 500 }
    );
  }
}

async function addIPEntry(supabase: any, organizationId: string, ipData: any, adminUserId: string) {
  const { ip_address, ip_range, label, description } = ipData;

  if (!ip_address && !ip_range) {
    return NextResponse.json({ error: 'IP address or range is required' }, { status: 400 });
  }

  // Validate IP format
  if (ip_address && !isValidIP(ip_address)) {
    return NextResponse.json({ error: 'Invalid IP address format' }, { status: 400 });
  }

  if (ip_range && !isValidIPRange(ip_range)) {
    return NextResponse.json({ error: 'Invalid IP range format' }, { status: 400 });
  }

  // Check for duplicates
  const { data: existing } = await supabase
    .from('ip_allowlist')
    .select('id')
    .eq('organization_id', organizationId)
    .or(`ip_address.eq.${ip_address},ip_range.eq.${ip_range}`)
    .single();

  if (existing) {
    return NextResponse.json({ error: 'IP address or range already exists' }, { status: 409 });
  }

  // Add IP entry
  const { data: newEntry, error: insertError } = await supabase
    .from('ip_allowlist')
    .insert({
      organization_id: organizationId,
      ip_address: ip_address || null,
      ip_range: ip_range || null,
      label: label || '',
      description: description || '',
      status: 'active',
      created_by: adminUserId,
      usage_count: 0
    })
    .select()
    .single();

  if (insertError) {
    console.error('Error adding IP entry:', insertError);
    return NextResponse.json({ error: 'Failed to add IP entry' }, { status: 500 });
  }

  // Log the action
  await supabase
    .from('admin_activity_logs')
    .insert({
      user_id: adminUserId,
      organization_id: organizationId,
      action: 'ip_allowlist_added',
      resource_type: 'ip_allowlist',
      resource_id: newEntry.id,
      details: `Added IP ${ip_address || ip_range} to allowlist`,
      success: true
    });

  return NextResponse.json({
    success: true,
    data: newEntry
  });
}

async function removeIPEntry(supabase: any, organizationId: string, entryId: string, adminUserId: string) {
  // Get entry details before deletion
  const { data: entry } = await supabase
    .from('ip_allowlist')
    .select('*')
    .eq('id', entryId)
    .eq('organization_id', organizationId)
    .single();

  if (!entry) {
    return NextResponse.json({ error: 'IP entry not found' }, { status: 404 });
  }

  // Delete entry
  const { error: deleteError } = await supabase
    .from('ip_allowlist')
    .delete()
    .eq('id', entryId)
    .eq('organization_id', organizationId);

  if (deleteError) {
    console.error('Error removing IP entry:', deleteError);
    return NextResponse.json({ error: 'Failed to remove IP entry' }, { status: 500 });
  }

  // Log the action
  await supabase
    .from('admin_activity_logs')
    .insert({
      user_id: adminUserId,
      organization_id: organizationId,
      action: 'ip_allowlist_removed',
      resource_type: 'ip_allowlist',
      resource_id: entryId,
      details: `Removed IP ${entry.ip_address || entry.ip_range} from allowlist`,
      success: true
    });

  return NextResponse.json({
    success: true,
    message: 'IP entry removed successfully'
  });
}

async function updateIPSettings(supabase: any, organizationId: string, settings: any, adminUserId: string) {
  // Get current settings
  const { data: currentOrg } = await supabase
    .from('organizations')
    .select('ip_allowlist_settings')
    .eq('id', organizationId)
    .single();

  const currentSettings = currentOrg?.ip_allowlist_settings || {};
  const updatedSettings = {
    ...currentSettings,
    ...settings,
    last_updated: new Date().toISOString(),
    updated_by: adminUserId
  };

  // Update organization IP settings
  const { error: updateError } = await supabase
    .from('organizations')
    .update({ ip_allowlist_settings: updatedSettings })
    .eq('id', organizationId);

  if (updateError) {
    console.error('Error updating IP allowlist settings:', updateError);
    return NextResponse.json({ error: 'Failed to update IP settings' }, { status: 500 });
  }

  // Log the action
  await supabase
    .from('admin_activity_logs')
    .insert({
      user_id: adminUserId,
      organization_id: organizationId,
      action: 'ip_allowlist_settings_updated',
      resource_type: 'organization_settings',
      resource_id: organizationId,
      details: `Updated IP allowlist settings: ${Object.keys(settings).join(', ')}`,
      success: true
    });

  return NextResponse.json({
    success: true,
    data: updatedSettings
  });
}

async function blockIP(supabase: any, organizationId: string, ipAddress: string, reason: string, adminUserId: string) {
  // Add to blocked IPs
  const { error: blockError } = await supabase
    .from('blocked_ips')
    .insert({
      organization_id: organizationId,
      ip_address: ipAddress,
      reason: reason || 'Manually blocked by admin',
      blocked_by: adminUserId,
      blocked_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    });

  if (blockError) {
    console.error('Error blocking IP:', blockError);
    return NextResponse.json({ error: 'Failed to block IP' }, { status: 500 });
  }

  // Log the action
  await supabase
    .from('admin_activity_logs')
    .insert({
      user_id: adminUserId,
      organization_id: organizationId,
      action: 'ip_blocked',
      ip_address: ipAddress,
      details: `Manually blocked IP: ${reason}`,
      success: true
    });

  return NextResponse.json({
    success: true,
    message: 'IP blocked successfully'
  });
}

async function unblockIP(supabase: any, organizationId: string, ipAddress: string, adminUserId: string) {
  // Remove from blocked IPs
  const { error: unblockError } = await supabase
    .from('blocked_ips')
    .delete()
    .eq('organization_id', organizationId)
    .eq('ip_address', ipAddress);

  if (unblockError) {
    console.error('Error unblocking IP:', unblockError);
    return NextResponse.json({ error: 'Failed to unblock IP' }, { status: 500 });
  }

  // Log the action
  await supabase
    .from('admin_activity_logs')
    .insert({
      user_id: adminUserId,
      organization_id: organizationId,
      action: 'ip_unblocked',
      ip_address: ipAddress,
      details: `Manually unblocked IP`,
      success: true
    });

  return NextResponse.json({
    success: true,
    message: 'IP unblocked successfully'
  });
}

function isValidIP(ip: string): boolean {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

function isValidIPRange(range: string): boolean {
  const cidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(?:[0-9]|[12][0-9]|3[0-2])$/;
  return cidrRegex.test(range);
}

function getBlockReason(details: string): string {
  if (details.includes('brute force')) return 'Brute Force Attack';
  if (details.includes('suspicious')) return 'Suspicious Activity';
  if (details.includes('rate limit')) return 'Rate Limit Exceeded';
  if (details.includes('not in allowlist')) return 'Not in Allowlist';
  return 'Security Violation';
}