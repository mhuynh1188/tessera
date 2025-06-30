import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { z } from 'zod';
import { getCurrentUser, updateUser } from '@/lib/auth';
import { validateInput } from '@/lib/validation';
import { CSRFProtection } from '@/lib/csrf';

// Profile update schema
const updateProfileSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s\-'\.]+$/, 'Name can only contain letters, spaces, hyphens, apostrophes, and periods')
    .transform((name) => name.trim())
    .optional(),
  
  email: z.string()
    .email('Invalid email address')
    .transform((email) => email.toLowerCase().trim())
    .optional(),
    
  avatar_url: z.string()
    .url('Invalid avatar URL')
    .optional()
    .nullable(),
});

// Get user profile
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', success: false },
        { status: 401 }
      );
    }

    // Remove sensitive data before sending
    const { ...userProfile } = user;
    
    return NextResponse.json({
      data: userProfile,
      success: true,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile', success: false },
      { status: 500 }
    );
  }
}

// Update user profile
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
    const validation = validateInput(updateProfileSchema, body);
    
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

    // Update only provided fields
    const updates = Object.fromEntries(
      Object.entries(validation.data).filter(([_, value]) => value !== undefined)
    );

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update', success: false },
        { status: 400 }
      );
    }

    const updatedUser = await updateUser(user.id, updates);
    
    return NextResponse.json({
      data: updatedUser,
      message: 'Profile updated successfully',
      success: true,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile', success: false },
      { status: 500 }
    );
  }
}

// Delete user account
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

    // For now, just return a placeholder response
    // In a real implementation, you would:
    // 1. Validate user's password or require re-authentication
    // 2. Delete all user's workspaces and data
    // 3. Delete user from auth.users table
    // 4. Log the deletion for audit purposes
    
    return NextResponse.json(
      { 
        error: 'Account deletion is currently disabled. Please contact support.',
        success: false 
      },
      { status: 501 }
    );
  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json(
      { error: 'Failed to delete account', success: false },
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