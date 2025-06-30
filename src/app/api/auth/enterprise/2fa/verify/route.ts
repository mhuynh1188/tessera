// 2FA Verification API endpoint
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { EnterpriseAuthService } from '@/lib/auth/enterprise-auth-service';

export async function POST(request: NextRequest) {
  try {
    const { userId, token, sessionToken } = await request.json();
    
    if (!userId || !token || !sessionToken) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get device and IP info
    const userAgent = request.headers.get('user-agent') || '';
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0] || realIp || 'unknown';

    const deviceInfo = {
      userAgent,
      // In a real app, you'd get more device fingerprinting data from the client
    };

    const authService = new EnterpriseAuthService(true);
    
    // Verify 2FA token
    const result = await authService.verifyTwoFactor(
      userId, 
      token, 
      { access_token: sessionToken }, // Simplified session object
      deviceInfo,
      ipAddress
    );
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Invalid 2FA token' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      sessionId: result.sessionId,
      message: '2FA verification successful'
    });

  } catch (error) {
    console.error('2FA verification error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to verify 2FA',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}