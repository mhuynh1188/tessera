// 2FA Setup API endpoint
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { EnterpriseAuthService } from '@/lib/auth/enterprise-auth-service';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const authService = new EnterpriseAuthService(true);
    
    // Setup 2FA for user
    const setup = await authService.setupTwoFactor(user.id);
    
    return NextResponse.json({
      success: true,
      setup: {
        qrCode: setup.qrCode,
        manualEntryKey: setup.manualEntryKey,
        backupCodes: setup.backupCodes
      }
    });

  } catch (error) {
    console.error('2FA setup error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to setup 2FA',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();
    const { token } = await request.json();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    const authService = new EnterpriseAuthService(true);
    
    // Verify token and enable 2FA
    const success = await authService.verifyAndEnable2FA(user.id, token);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '2FA enabled successfully'
    });

  } catch (error) {
    console.error('2FA enable error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to enable 2FA',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    const { currentPassword } = await request.json();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!currentPassword) {
      return NextResponse.json(
        { error: 'Current password is required' },
        { status: 400 }
      );
    }

    const authService = new EnterpriseAuthService(true);
    
    // Disable 2FA
    const success = await authService.disable2FA(user.id, currentPassword);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to disable 2FA' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '2FA disabled successfully'
    });

  } catch (error) {
    console.error('2FA disable error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to disable 2FA',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}