// Email system test endpoint
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Test database connection by checking email tables
    const tests = await Promise.all([
      // Test 1: Check if email tables exist
      supabase.from('email_templates').select('count(*)', { count: 'exact' }),
      
      // Test 2: Check if email notifications table exists
      supabase.from('email_notifications').select('count(*)', { count: 'exact' }),
      
      // Test 3: Check if email preferences table exists
      supabase.from('email_preferences').select('count(*)', { count: 'exact' }),
      
      // Test 4: Check default templates
      supabase.from('email_templates').select('id, name, is_system_template').eq('is_system_template', true)
    ]);

    const [templatesCount, notificationsCount, preferencesCount, systemTemplates] = tests;

    const results = {
      timestamp: new Date().toISOString(),
      database_connection: 'success',
      tables: {
        email_templates: templatesCount.error ? 'error' : 'success',
        email_notifications: notificationsCount.error ? 'error' : 'success', 
        email_preferences: preferencesCount.error ? 'error' : 'success'
      },
      template_counts: {
        total_templates: templatesCount.count || 0,
        system_templates: systemTemplates.data?.length || 0
      },
      system_templates: systemTemplates.data?.map(t => ({
        id: t.id,
        name: t.name
      })) || [],
      sendgrid_configured: !!process.env.SENDGRID_API_KEY,
      environment_variables: {
        SENDGRID_API_KEY: process.env.SENDGRID_API_KEY ? 'configured' : 'missing',
        SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL ? 'configured' : 'missing',
        SENDGRID_FROM_NAME: process.env.SENDGRID_FROM_NAME ? 'configured' : 'missing'
      }
    };

    // Check if any errors occurred
    const hasErrors = tests.some(test => test.error);
    const statusCode = hasErrors ? 500 : 200;

    return NextResponse.json(results, { status: statusCode });

  } catch (error) {
    console.error('Email test failed:', error);
    return NextResponse.json(
      { 
        error: 'Email system test failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, ...testData } = await request.json();
    const supabase = createClient();

    switch (action) {
      case 'queue_test_email':
        // Queue a test email
        const { data: queueResult, error: queueError } = await supabase
          .rpc('queue_email', {
            p_template_name: 'account_created',
            p_recipient_email: testData.email || 'test@example.com',
            p_recipient_name: testData.name || 'Test User',
            p_subject: 'Test Email from Hex App',
            p_template_variables: {
              user_name: testData.name || 'Test User',
              organization_name: 'Test Organization',
              dashboard_link: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
            }
          });

        if (queueError) {
          throw queueError;
        }

        return NextResponse.json({
          success: true,
          message: 'Test email queued successfully',
          email_id: queueResult,
          queued_at: new Date().toISOString()
        });

      case 'check_queue':
        // Check email queue status
        const { data: queueStatus, error: statusError } = await supabase
          .from('email_notifications')
          .select('id, status, template_name, recipient_email, created_at, sent_at, error_message')
          .order('created_at', { ascending: false })
          .limit(10);

        if (statusError) {
          throw statusError;
        }

        return NextResponse.json({
          success: true,
          queue_status: queueStatus
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Email test action failed:', error);
    return NextResponse.json(
      { 
        error: 'Email test action failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}