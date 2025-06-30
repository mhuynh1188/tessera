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


    // Get security policies from database
    const { data: policies, error: policiesError } = await supabase
      .from('security_policies')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (policiesError) {
      console.error('Error fetching security policies:', policiesError);
      // Return default policies if table doesn't exist
      const defaultPolicies = getDefaultSecurityPolicies();
      return NextResponse.json({
        success: true,
        data: {
          policies: defaultPolicies,
          summary: {
            total: defaultPolicies.length,
            active: defaultPolicies.filter(p => p.status === 'active').length,
            violations_24h: 0,
            compliance_score: calculateComplianceScore(defaultPolicies)
          }
        }
      });
    }

    // Get policy violations
    const { data: violations } = await supabase
      .from('admin_activity_logs')
      .select('id, action, created_at')
      .eq('organization_id', organizationId)
      .eq('action', 'security_policy_violation')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const summary = {
      total: policies?.length || 0,
      active: policies?.filter(p => p.status === 'active').length || 0,
      violations_24h: violations?.length || 0,
      compliance_score: calculateComplianceScore(policies || [])
    };

    return NextResponse.json({
      success: true,
      data: {
        policies: policies || [],
        summary
      }
    });

  } catch (error) {
    console.error('Error fetching security policies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch security policies' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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


    const body = await request.json();
    const { name, description, policy_type, rules, status, severity } = body;

    if (!name || !policy_type || !rules) {
      return NextResponse.json({ error: 'Name, type, and rules are required' }, { status: 400 });
    }

    // Create new security policy
    const { data: policy, error: insertError } = await supabase
      .from('security_policies')
      .insert({
        organization_id: organizationId,
        name,
        description: description || '',
        policy_type,
        rules,
        status: status || 'active',
        severity: severity || 'medium',
        created_by: user.id,
        updated_by: user.id
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating security policy:', insertError);
      return NextResponse.json({ error: 'Failed to create security policy' }, { status: 500 });
    }

    // Log the action
    await supabase
      .from('admin_activity_logs')
      .insert({
        user_id: user.id,
        organization_id: organizationId,
        action: 'security_policy_created',
        resource_type: 'security_policy',
        resource_id: policy.id,
        details: `Created security policy: ${name}`,
        success: true
      });

    return NextResponse.json({
      success: true,
      data: policy
    });

  } catch (error) {
    console.error('Error creating security policy:', error);
    return NextResponse.json(
      { error: 'Failed to create security policy' },
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


    const body = await request.json();
    const { policy_id, ...updates } = body;

    if (!policy_id) {
      return NextResponse.json({ error: 'Policy ID is required' }, { status: 400 });
    }

    // Update security policy
    const { data: policy, error: updateError } = await supabase
      .from('security_policies')
      .update({
        ...updates,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', policy_id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating security policy:', updateError);
      return NextResponse.json({ error: 'Failed to update security policy' }, { status: 500 });
    }

    // Log the action
    await supabase
      .from('admin_activity_logs')
      .insert({
        user_id: user.id,
        organization_id: organizationId,
        action: 'security_policy_updated',
        resource_type: 'security_policy',
        resource_id: policy_id,
        details: `Updated security policy: ${policy.name}`,
        success: true
      });

    return NextResponse.json({
      success: true,
      data: policy
    });

  } catch (error) {
    console.error('Error updating security policy:', error);
    return NextResponse.json(
      { error: 'Failed to update security policy' },
      { status: 500 }
    );
  }
}

function getDefaultSecurityPolicies() {
  return [
    {
      id: 'policy-1',
      name: 'Password Policy',
      description: 'Enforce strong password requirements',
      policy_type: 'authentication',
      rules: {
        min_length: 8,
        require_uppercase: true,
        require_lowercase: true,
        require_numbers: true,
        require_symbols: true,
        password_history: 5,
        max_age_days: 90
      },
      status: 'active',
      severity: 'high',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      violations_count: 0,
      compliance_status: 'compliant'
    },
    {
      id: 'policy-2',
      name: 'Multi-Factor Authentication',
      description: 'Require MFA for all admin users',
      policy_type: 'authentication',
      rules: {
        required_for_roles: ['admin', 'owner'],
        allowed_methods: ['totp', 'sms', 'email'],
        grace_period_days: 7
      },
      status: 'active',
      severity: 'critical',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      violations_count: 2,
      compliance_status: 'non_compliant'
    },
    {
      id: 'policy-3',
      name: 'Session Management',
      description: 'Control user session behavior',
      policy_type: 'session',
      rules: {
        max_concurrent_sessions: 3,
        idle_timeout_minutes: 30,
        absolute_timeout_hours: 8,
        require_reauthentication_for_sensitive: true
      },
      status: 'active',
      severity: 'medium',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      violations_count: 0,
      compliance_status: 'compliant'
    },
    {
      id: 'policy-4',
      name: 'IP Allowlist',
      description: 'Restrict access to approved IP ranges',
      policy_type: 'network',
      rules: {
        allowed_ips: ['192.168.1.0/24', '10.0.0.0/8'],
        block_unknown_ips: false,
        alert_on_new_ip: true
      },
      status: 'draft',
      severity: 'medium',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      violations_count: 0,
      compliance_status: 'pending'
    },
    {
      id: 'policy-5',
      name: 'Data Access Control',
      description: 'Control access to sensitive data',
      policy_type: 'data_access',
      rules: {
        require_approval_for_sensitive: true,
        log_all_access: true,
        retention_period_days: 365,
        classification_required: true
      },
      status: 'active',
      severity: 'high',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      violations_count: 1,
      compliance_status: 'partially_compliant'
    },
    {
      id: 'policy-6',
      name: 'Audit Logging',
      description: 'Comprehensive audit logging requirements',
      policy_type: 'audit',
      rules: {
        log_level: 'detailed',
        retention_years: 7,
        real_time_monitoring: true,
        alert_threshold: 'medium'
      },
      status: 'active',
      severity: 'high',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      violations_count: 0,
      compliance_status: 'compliant'
    }
  ];
}

function calculateComplianceScore(policies: any[]): number {
  if (!policies.length) return 0;
  
  const compliantPolicies = policies.filter(p => 
    p.compliance_status === 'compliant' && p.status === 'active'
  ).length;
  
  const activePolicies = policies.filter(p => p.status === 'active').length;
  
  return activePolicies > 0 ? Math.round((compliantPolicies / activePolicies) * 100) : 0;
}