import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export interface AuthResult {
  success: boolean;
  user?: any;
  organizationId?: string;
  role?: string;
  error?: string;
}

export async function verifyAdminAuth(request: NextRequest): Promise<AuthResult> {
  try {
    // Check for development bypass header
    const devBypass = request.headers.get('x-admin-dev-bypass');
    if (devBypass === 'true' && process.env.NODE_ENV === 'development') {
      return {
        success: true,
        user: { id: 'dev-user', email: 'dev@example.com' },
        organizationId: 'dev-org',
        role: 'owner'
      };
    }

    const supabase = createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      // In development, allow access if no user session for testing
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ Development mode: No user session, using default admin');
        return {
          success: true,
          user: { id: 'dev-user', email: 'mhuynh1188@hotmail.com' },
          organizationId: '11111111-1111-1111-1111-111111111111',
          role: 'admin'
        };
      }
      return {
        success: false,
        error: 'Unauthorized - No valid user session'
      };
    }

    // Check if user is in admin emails list (fallback method)
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || ['mhuynh1188@hotmail.com'];
    if (adminEmails.includes(user.email)) {
      return {
        success: true,
        user,
        organizationId: '11111111-1111-1111-1111-111111111111', // Default demo org
        role: 'admin'
      };
    }

    // Try to get organization_id and role for the user with error handling
    try {
      const { data: orgMember, error: orgError } = await supabase
        .from('organization_members')
        .select('organization_id, role')
        .eq('user_id', user.id)
        .single();

      if (orgError) {
        console.warn('RLS policy error on organization_members:', orgError.message);
        // If RLS error, fallback to checking admin emails
        if (adminEmails.includes(user.email)) {
          return {
            success: true,
            user,
            organizationId: '11111111-1111-1111-1111-111111111111',
            role: 'admin'
          };
        }
        throw orgError;
      }

      if (!orgMember) {
        return {
          success: false,
          error: 'User not found in any organization'
        };
      }

      if (!['admin', 'owner'].includes(orgMember.role)) {
        return {
          success: false,
          error: 'Insufficient permissions - Admin or Owner role required'
        };
      }

      return {
        success: true,
        user,
        organizationId: orgMember.organization_id,
        role: orgMember.role
      };

    } catch (dbError) {
      console.warn('Database error in auth, using email fallback:', dbError);
      // Final fallback - check admin emails
      if (adminEmails.includes(user.email)) {
        return {
          success: true,
          user,
          organizationId: '11111111-1111-1111-1111-111111111111',
          role: 'admin'
        };
      }
      
      return {
        success: false,
        error: 'Authentication verification failed'
      };
    }

  } catch (error) {
    console.error('Admin auth verification error:', error);
    return {
      success: false,
      error: 'Authentication verification failed'
    };
  }
}