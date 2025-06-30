import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { z } from 'zod';
import { config } from '@/lib/config';
import { contactFormSchema, validateInput } from '@/lib/validation';
import { CSRFProtection } from '@/lib/csrf';

// Email sending function (replace with your preferred email service)
async function sendContactEmail(data: any) {
  // In production, replace this with a real email service like:
  // - SendGrid
  // - Resend
  // - AWS SES
  // - Nodemailer with SMTP
  
  const emailContent = `
New Contact Form Submission - ${data.urgency.toUpperCase()} Priority

From: ${data.name} <${data.email}>
Company: ${data.company || 'Not provided'}
Subject: ${data.subject}
Priority: ${data.urgency}
Timestamp: ${data.timestamp}
IP: ${data.ip}

Message:
${data.message}

---
This email was sent from the Hexies contact form.
  `.trim();

  // For development, log the email content with better formatting
  console.log('\n📧 EMAIL NOTIFICATION:');
  console.log('=' .repeat(50));
  console.log(emailContent);
  console.log('=' .repeat(50));
  console.log('✅ Email logged successfully (development mode)');
  console.log('🚀 In production, this would be sent via your email service\n');
  
  // In production, uncomment and configure one of these:
  
  // Example with Resend:
  // const { Resend } = require('resend');
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({
  //   from: 'contact@yoursite.com',
  //   to: 'your-email@yoursite.com',
  //   subject: `[Hexies Contact] ${data.subject}`,
  //   text: emailContent,
  // });

  return true;
}

// Simple in-memory rate limiting (replace with Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function getRateLimitKey(ip: string): string {
  return `contact:${ip}`;
}

function isRateLimited(ip: string): boolean {
  const key = getRateLimitKey(ip);
  const now = Date.now();
  const windowMs = config.rateLimit.contact.windowMs;
  const maxRequests = config.rateLimit.contact.max;

  const record = rateLimitMap.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return false;
  }
  
  if (record.count >= maxRequests) {
    return true;
  }
  
  record.count++;
  return false;
}

// Enhanced contact form validation with Zod
function validateContactForm(data: any) {
  const enhancedSchema = contactFormSchema.extend({
    company: z.string()
      .max(100, 'Company name must be less than 100 characters')
      .optional()
      .transform((company) => company?.trim()),
    urgency: z.enum(['low', 'normal', 'high']).default('normal'),
  });

  return validateInput(enhancedSchema, data);
}

export async function POST(request: NextRequest) {
  try {
    // CSRF Protection (skip in development to prevent build issues)
    if (process.env.NODE_ENV === 'production') {
      try {
        if (!CSRFProtection.validateCSRFToken(request)) {
          return NextResponse.json(
            { 
              error: 'Invalid CSRF token',
              success: false 
            },
            { status: 403 }
          );
        }
      } catch (error) {
        console.error('CSRF validation error:', error);
        return NextResponse.json(
          { 
            error: 'Security validation failed',
            success: false 
          },
          { status: 500 }
        );
      }
    }

    const headersList = headers();
    const forwarded = headersList.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : headersList.get('x-real-ip') || 'unknown';
    
    // Rate limiting
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { 
          error: 'Too many requests. Please try again later.',
          success: false 
        },
        { status: 429 }
      );
    }
    
    const body = await request.json();
    const validation = validateContactForm(body);
    
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
    
    const contactData = {
      ...validation.data,
      ip,
      timestamp: new Date().toISOString(),
    };
    
    // Send email notification (in production, use a service like SendGrid, Resend, etc.)
    try {
      await sendContactEmail(contactData);
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      // Continue anyway - don't fail the request if email fails
    }
    
    // Log the contact form submission with better formatting
    console.log('\n📅 NEW CONTACT SUBMISSION:');
    console.log('Time:', new Date().toLocaleString());
    console.log('From:', contactData.name, '<' + contactData.email + '>');
    console.log('Subject:', contactData.subject);
    console.log('Priority:', contactData.urgency.toUpperCase());
    console.log('IP:', contactData.ip);
    console.log('Message preview:', contactData.message.substring(0, 100) + '...');
    
    // Simulate email sending delay for better UX
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return NextResponse.json({
      message: 'Thank you for your message! We\'ll get back to you within 24 hours.',
      success: true,
    });
    
  } catch (error) {
    console.error('Contact form error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error. Please try again later.',
        success: false 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      error: 'Method not allowed',
      success: false 
    },
    { status: 405 }
  );
}