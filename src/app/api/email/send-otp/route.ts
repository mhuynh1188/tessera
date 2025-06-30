// API route for sending OTP emails
import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email';
import { rateLimiter } from '@/lib/rate-limiter';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const isAllowed = await rateLimiter.check('email-otp', ip, 5, 60); // 5 requests per minute
    
    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const { email, otp, userName, expiryMinutes } = await request.json();

    // Validate input
    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Send OTP email
    const success = await emailService.sendOTPEmail({
      email,
      otp,
      userName: userName || 'User',
      expiryMinutes: expiryMinutes || 10
    });

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'OTP email sent successfully'
    });

  } catch (error) {
    console.error('Error sending OTP email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}