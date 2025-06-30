// API endpoint for sending payment confirmation emails
import { NextRequest, NextResponse } from 'next/server';
import { enhancedEmailService } from '@/lib/email/enhanced-email-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      userName,
      amount,
      planName,
      transactionId,
      paymentDate,
      nextBillingDate
    } = body;

    // Validation
    if (!email || !userName || !amount || !planName || !transactionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Send payment confirmation email
    const success = await enhancedEmailService.sendPaymentConfirmation({
      email,
      userName,
      amount,
      planName,
      transactionId,
      paymentDate: paymentDate || new Date().toLocaleDateString(),
      nextBillingDate: nextBillingDate || 'N/A'
    });

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to send payment confirmation email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payment confirmation email sent successfully'
    });
  } catch (error) {
    console.error('Failed to send payment confirmation:', error);
    return NextResponse.json(
      { error: 'Failed to send payment confirmation email' },
      { status: 500 }
    );
  }
}