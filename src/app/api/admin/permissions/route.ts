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

    // Try to fetch permissions from database first
    let permissions = [];
    let roles = [];
    
    try {
      // Fetch role-based permissions from organization_members
      const { data: roleData, error: roleError } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', organizationId);

      if (!roleError && roleData) {
        // Count users by role
        const roleCounts = roleData.reduce((acc, member) => {
          acc[member.role] = (acc[member.role] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Define role permissions based on business logic
        const rolePermissions = {
          owner: [
            'manage_users', 'view_users', 'manage_roles', 'manage_organization', 
            'manage_billing', 'delete_organization', 'manage_security', 'view_audit_logs', 
            'manage_mfa', 'manage_projects', 'view_projects', 'create_content', 
            'view_analytics', 'export_data', 'manage_integrations', 'manage_api_keys'
          ],
          admin: [
            'manage_users', 'view_users', 'manage_roles', 'manage_organization',
            'manage_security', 'view_audit_logs', 'manage_mfa', 'manage_projects', 
            'view_projects', 'create_content', 'view_analytics', 'export_data', 
            'manage_integrations'
          ],
          manager: [
            'view_users', 'manage_projects', 'view_projects', 'create_content', 
            'view_analytics', 'view_audit_logs'
          ],
          member: [
            'view_projects', 'create_content', 'view_analytics'
          ],
          viewer: [
            'view_projects', 'view_analytics'
          ]
        };

        roles = Object.keys(rolePermissions).map(role => ({
          role,
          description: getRoleDescription(role),
          users: roleCounts[role] || 0,
          permissions: rolePermissions[role as keyof typeof rolePermissions] || []
        }));
      }
    } catch (dbError) {
      console.warn('Database query failed, using fallback data:', dbError);
    }

    // Fallback to default roles if database is empty
    if (roles.length === 0) {
      roles = [
        {
          role: 'owner',
          description: 'Full access to all features and settings. Can manage billing and delete organization.',
          users: 1,
          permissions: [
            'manage_users', 'view_users', 'manage_roles', 'manage_organization', 
            'manage_billing', 'delete_organization', 'manage_security', 'view_audit_logs', 
            'manage_mfa', 'manage_projects', 'view_projects', 'create_content', 
            'view_analytics', 'export_data', 'manage_integrations', 'manage_api_keys'
          ]
        },
        {
          role: 'admin',
          description: 'Administrative access to most features. Can manage users and security settings.',
          users: 0,
          permissions: [
            'manage_users', 'view_users', 'manage_roles', 'manage_organization',
            'manage_security', 'view_audit_logs', 'manage_mfa', 'manage_projects', 
            'view_projects', 'create_content', 'view_analytics', 'export_data', 
            'manage_integrations'
          ]
        },
        {
          role: 'manager',
          description: 'Can manage projects and content. Limited user management capabilities.',
          users: 0,
          permissions: [
            'view_users', 'manage_projects', 'view_projects', 'create_content', 
            'view_analytics', 'view_audit_logs'
          ]
        },
        {
          role: 'member',
          description: 'Standard user with content creation and basic project access.',
          users: 0,
          permissions: [
            'view_projects', 'create_content', 'view_analytics'
          ]
        },
        {
          role: 'viewer',
          description: 'Read-only access to projects and analytics.',
          users: 0,
          permissions: [
            'view_projects', 'view_analytics'
          ]
        }
      ];
    }

    // Define available permissions
    permissions = [
      // User Management
      { id: 'manage_users', name: 'Manage Users', description: 'Create, edit, and delete users', category: 'user_management', risk_level: 'high' },
      { id: 'view_users', name: 'View Users', description: 'View user list and profiles', category: 'user_management', risk_level: 'low' },
      { id: 'manage_roles', name: 'Manage Roles', description: 'Assign and modify user roles', category: 'user_management', risk_level: 'critical' },
      
      // Organization Settings
      { id: 'manage_organization', name: 'Manage Organization', description: 'Modify organization settings', category: 'organization', risk_level: 'high' },
      { id: 'manage_billing', name: 'Manage Billing', description: 'Access billing and subscription settings', category: 'organization', risk_level: 'high' },
      { id: 'delete_organization', name: 'Delete Organization', description: 'Delete the entire organization', category: 'organization', risk_level: 'critical' },
      
      // Security
      { id: 'manage_security', name: 'Manage Security', description: 'Configure security settings and policies', category: 'security', risk_level: 'critical' },
      { id: 'view_audit_logs', name: 'View Audit Logs', description: 'Access security and activity logs', category: 'security', risk_level: 'medium' },
      { id: 'manage_mfa', name: 'Manage MFA', description: 'Configure multi-factor authentication', category: 'security', risk_level: 'high' },
      
      // Content & Projects
      { id: 'manage_projects', name: 'Manage Projects', description: 'Create and manage projects', category: 'content', risk_level: 'medium' },
      { id: 'view_projects', name: 'View Projects', description: 'View project content', category: 'content', risk_level: 'low' },
      { id: 'create_content', name: 'Create Content', description: 'Create and edit content', category: 'content', risk_level: 'low' },
      
      // Analytics & Reporting
      { id: 'view_analytics', name: 'View Analytics', description: 'Access analytics and reports', category: 'analytics', risk_level: 'medium' },
      { id: 'export_data', name: 'Export Data', description: 'Export organization data', category: 'analytics', risk_level: 'high' },
      
      // Integrations
      { id: 'manage_integrations', name: 'Manage Integrations', description: 'Configure third-party integrations', category: 'integrations', risk_level: 'medium' },
      { id: 'manage_api_keys', name: 'Manage API Keys', description: 'Create and manage API keys', category: 'integrations', risk_level: 'high' }
    ];

    return NextResponse.json({
      success: true,
      data: {
        permissions,
        roles
      }
    });

  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permissions' },
      { status: 500 }
    );
  }
}

function getRoleDescription(role: string): string {
  switch (role) {
    case 'owner':
      return 'Full access to all features and settings. Can manage billing and delete organization.';
    case 'admin':
      return 'Administrative access to most features. Can manage users and security settings.';
    case 'manager':
      return 'Can manage projects and content. Limited user management capabilities.';
    case 'member':
      return 'Standard user with content creation and basic project access.';
    case 'viewer':
      return 'Read-only access to projects and analytics.';
    default:
      return 'Custom role with specific permissions.';
  }
}