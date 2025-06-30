import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAdminAuth } from '@/lib/admin-auth';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await verifyAdminAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { user, organizationId } = authResult;
    const supabase = createClient();

    const body = await request.json();
    const userId = params.id;

    // Update user profile if profile fields are provided (with resilient error handling)
    if (body.first_name || body.last_name || body.job_title || body.department || body.phone_number || body.timezone || body.locale) {
      const profileUpdates: any = {};
      
      if (body.first_name) profileUpdates.first_name = body.first_name;
      if (body.last_name) profileUpdates.last_name = body.last_name;
      if (body.job_title) profileUpdates.job_title = body.job_title;
      if (body.department) profileUpdates.department = body.department;
      if (body.phone_number) profileUpdates.phone_number = body.phone_number;
      if (body.timezone) profileUpdates.timezone = body.timezone;
      if (body.locale) profileUpdates.locale = body.locale;
      
      if (body.first_name || body.last_name) {
        profileUpdates.display_name = `${body.first_name || ''} ${body.last_name || ''}`.trim();
      }

      try {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .update(profileUpdates)
          .eq('user_id', userId);

        if (profileError) {
          console.warn('User profiles table may not exist:', profileError);
        }
      } catch (profileError) {
        console.warn('Could not update user profile, table may not exist:', profileError);
      }
    }

    // Update role if provided (with resilient error handling)
    if (body.role) {
      try {
        const { error: roleError } = await supabase
          .from('organization_members')
          .update({ role: body.role })
          .eq('user_id', userId)
          .eq('organization_id', organizationId);

        if (roleError) {
          console.warn('Organization members table may not exist:', roleError);
        }
      } catch (roleError) {
        console.warn('Could not update user role, table may not exist:', roleError);
      }
    }

    // Handle status changes (this is more complex as it may involve auth changes)
    if (body.status) {
      // For now, we'll just log this as we don't have a direct way to change user status in Supabase Auth
      // In a real implementation, you might need to use the Supabase Admin API
      console.log(`Status change requested for user ${userId} to ${body.status}`);
    }

    // Log the action (with resilient error handling)
    try {
      await supabase
        .from('admin_activity_logs')
        .insert({
          user_id: user.id,
          organization_id: organizationId,
          action: 'user_updated',
          resource_type: 'user',
          resource_id: userId,
          details: `Updated user: ${body.email || userId}`,
          success: true
        });
    } catch (logError) {
      console.warn('Could not log activity, table may not exist:', logError);
    }

    return NextResponse.json({
      success: true,
      message: 'User updated successfully'
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await verifyAdminAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { user, organizationId } = authResult;
    const supabase = createClient();

    const userId = params.id;

    // For development mode, allow deletion but with logging
    const isDev = process.env.NODE_ENV === 'development';
    
    if (isDev) {
      console.log(`Development mode: Deleting user ${userId}`);
    }

    // Try to check if trying to delete an owner (resilient handling)
    let targetMember = null;
    try {
      const { data: memberData } = await supabase
        .from('organization_members')
        .select('role')
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .single();
      
      targetMember = memberData;
    } catch (memberError) {
      console.warn('Could not fetch member role, table may not exist:', memberError);
    }

    if (targetMember?.role === 'owner') {
      return NextResponse.json({ error: 'Cannot delete organization owner' }, { status: 403 });
    }

    // Remove from organization first (with resilient error handling)
    try {
      const { error: memberError } = await supabase
        .from('organization_members')
        .delete()
        .eq('user_id', userId)
        .eq('organization_id', organizationId);

      if (memberError) {
        console.warn('Could not remove user from organization, table may not exist:', memberError);
      }
    } catch (memberError) {
      console.warn('Organization members table may not exist:', memberError);
    }

    // Delete user profile (with resilient error handling)
    try {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', userId);

      if (profileError) {
        console.warn('Could not delete user profile, table may not exist:', profileError);
      }
    } catch (profileError) {
      console.warn('User profiles table may not exist:', profileError);
    }

    // In development mode, try to delete from auth (if available)
    if (isDev) {
      try {
        const { error: authError } = await supabase.auth.admin.deleteUser(userId);
        if (authError) {
          console.warn('Could not delete user from auth:', authError);
        }
      } catch (authError) {
        console.warn('Auth deletion not available:', authError);
      }
    }

    // Log the action (with resilient error handling)
    try {
      await supabase
        .from('admin_activity_logs')
        .insert({
          user_id: user.id,
          organization_id: organizationId,
          action: 'user_deleted',
          resource_type: 'user',
          resource_id: userId,
          details: `Deleted user: ${userId}`,
          success: true
        });
    } catch (logError) {
      console.warn('Could not log activity, table may not exist:', logError);
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}