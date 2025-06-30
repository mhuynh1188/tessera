// API endpoint to start the email scheduler
import { NextRequest, NextResponse } from 'next/server';
import { emailScheduler } from '@/lib/email/email-scheduler';

export async function POST(request: NextRequest) {
  try {
    // Start the email scheduler
    emailScheduler.start();

    return NextResponse.json({
      success: true,
      message: 'Email scheduler started successfully'
    });
  } catch (error) {
    console.error('Failed to start email scheduler:', error);
    return NextResponse.json(
      { error: 'Failed to start email scheduler' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Stop the email scheduler
    emailScheduler.stop();

    return NextResponse.json({
      success: true,
      message: 'Email scheduler stopped successfully'
    });
  } catch (error) {
    console.error('Failed to stop email scheduler:', error);
    return NextResponse.json(
      { error: 'Failed to stop email scheduler' },
      { status: 500 }
    );
  }
}