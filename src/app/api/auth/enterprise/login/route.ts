// Enterprise Login API endpoint
import { NextRequest, NextResponse } from 'next/server';
import { EnterpriseAuthService } from '@/lib/auth/enterprise-auth-service';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
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
      timestamp: new Date().toISOString()
    };

    const authService = new EnterpriseAuthService(true);
    
    // Attempt enterprise login
    const result = await authService.signInWithPassword(
      email, 
      password, 
      deviceInfo,
      ipAddress
    );
    
    if (result.error) {
      return NextResponse.json(
        { 
          error: result.error.message,
          success: false
        },
        { status: 401 }
      );
    }

    // If 2FA is required, return partial success
    if (result.requires2FA) {
      return NextResponse.json({
        success: true,
        requires2FA: true,
        userId: result.user?.id,
        sessionToken: result.session?.access_token,
        message: 'Please provide 2FA token'
      });
    }

    // Full login success
    return NextResponse.json({
      success: true,
      requires2FA: false,
      user: {
        id: result.user?.id,
        email: result.user?.email,
        organization_id: result.user?.organization_id,
        org_role: result.user?.org_role,
        department: result.user?.department,
        two_factor_enabled: result.user?.two_factor_enabled
      },
      session: result.session,
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Enterprise login error:', error);
    return NextResponse.json(
      { 
        error: 'Authentication service error',
        message: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500 }
    );
  }
}