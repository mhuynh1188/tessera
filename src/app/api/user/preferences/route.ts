import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { validateInput } from '@/lib/validation';
import { CSRFProtection } from '@/lib/csrf';
import { supabase } from '@/lib/supabase';

// User preferences schema
const preferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']).default('auto'),
  notifications: z.object({
    email: z.boolean().default(true),
    browser: z.boolean().default(true),
    workspace_invites: z.boolean().default(true),
    collaboration_updates: z.boolean().default(true),
  }).default({
    email: true,
    browser: true,
    workspace_invites: true,
    collaboration_updates: true,
  }),
  privacy: z.object({
    profile_visibility: z.enum(['public', 'private']).default('private'),
    activity_tracking: z.boolean().default(true),
  }).default({
    profile_visibility: 'private',
    activity_tracking: true,
  }),
  workspace: z.object({
    default_grid_size: z.number().min(10).max(100).default(50),
    auto_save: z.boolean().default(true),
    snap_to_grid: z.boolean().default(true),
    show_collaboration_cursors: z.boolean().default(true),
  }).default({
    default_grid_size: 50,
    auto_save: true,
    snap_to_grid: true,
    show_collaboration_cursors: true,
  }),
});

// Get user preferences
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', success: false },
        { status: 401 }
      );
    }

    // Get preferences from database
    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .select('preferences')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch preferences', success: false },
        { status: 500 }
      );
    }

    // Return stored preferences or defaults
    const userPreferences = preferences?.preferences || {
      theme: 'auto',
      notifications: {
        email: true,
        browser: true,
        workspace_invites: true,
        collaboration_updates: true,
      },
      privacy: {
        profile_visibility: 'private',
        activity_tracking: true,
      },
      workspace: {
        default_grid_size: 50,
        auto_save: true,
        snap_to_grid: true,
        show_collaboration_cursors: true,
      },
    };
    
    return NextResponse.json({
      data: userPreferences,
      success: true,
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences', success: false },
      { status: 500 }
    );
  }
}

// Update user preferences
export async function PATCH(request: NextRequest) {
  try {
    // CSRF Protection in production
    if (process.env.NODE_ENV === 'production' && !CSRFProtection.validateCSRFToken(request)) {
      return NextResponse.json(
        { error: 'Invalid CSRF token', success: false },
        { status: 403 }
      );
    }

    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', success: false },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = validateInput(preferencesSchema.partial(), body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validation.error,
          success: false 
        },
        { status: 400 }
      );
    }

    // Get current preferences
    const { data: currentPrefs } = await supabase
      .from('user_preferences')
      .select('preferences')
      .eq('user_id', user.id)
      .single();

    // Merge with existing preferences
    const mergedPreferences = {
      ...(currentPrefs?.preferences || {}),
      ...validation.data,
    };

    // Upsert preferences
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        preferences: mergedPreferences,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to save preferences', success: false },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      data: data.preferences,
      message: 'Preferences updated successfully',
      success: true,
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences', success: false },
      { status: 500 }
    );
  }
}

// Reset preferences to defaults
export async function DELETE(request: NextRequest) {
  try {
    // CSRF Protection in production
    if (process.env.NODE_ENV === 'production' && !CSRFProtection.validateCSRFToken(request)) {
      return NextResponse.json(
        { error: 'Invalid CSRF token', success: false },
        { status: 403 }
      );
    }

    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', success: false },
        { status: 401 }
      );
    }

    // Delete user preferences (will fall back to defaults)
    const { error } = await supabase
      .from('user_preferences')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to reset preferences', success: false },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: 'Preferences reset to defaults',
      success: true,
    });
  } catch (error) {
    console.error('Reset preferences error:', error);
    return NextResponse.json(
      { error: 'Failed to reset preferences', success: false },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed', success: false },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed', success: false },
    { status: 405 }
  );
}