// API endpoint for sending account creation confirmation emails
import { NextRequest, NextResponse } from 'next/server';
import { enhancedEmailService } from '@/lib/email/enhanced-email-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      userName,
      organizationName,
      activationLink,
      temporaryPassword
    } = body;

    // Validation
    if (!email || !userName) {
      return NextResponse.json(
        { error: 'Email and userName are required' },
        { status: 400 }
      );
    }

    // Send account creation email
    const success = await enhancedEmailService.sendAccountCreated({
      email,
      userName,
      organizationName,
      activationLink,
      temporaryPassword
    });

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to send account creation email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Account creation email sent successfully'
    });
  } catch (error) {
    console.error('Failed to send account creation email:', error);
    return NextResponse.json(
      { error: 'Failed to send account creation email' },
      { status: 500 }
    );
  }
}