// API endpoints for analytics reports
import { NextRequest, NextResponse } from 'next/server';
import { enhancedEmailService } from '@/lib/email/enhanced-email-service';
import { activeDirectoryService } from '@/lib/email/active-directory-integration';
import { db } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');
    const action = searchParams.get('action');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    if (action === 'recipients') {
      // Get available email recipients
      const recipients = await activeDirectoryService.getEmailRecipients(organizationId, {
        activeOnly: true
      });

      return NextResponse.json({ recipients });
    }

    // Get analytics reports
    const { data: reports, error } = await db.client
      .from('email_analytics_reports')
      .select(`
        *,
        users(first_name, last_name)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Failed to fetch analytics reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics reports' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      reportType,
      recipientEmails,
      organizationId,
      userId,
      frequency,
      dateRangeType,
      dateRangeValue,
      departmentFilter,
      roleFilter,
      customFilters,
      dayOfWeek,
      dayOfMonth,
      hourOfDay,
      timezone,
      format,
      includeCharts
    } = body;

    // Validation
    if (!name || !reportType || !recipientEmails || !organizationId || !userId || !frequency) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!Array.isArray(recipientEmails) || recipientEmails.length === 0) {
      return NextResponse.json(
        { error: 'At least one recipient email is required' },
        { status: 400 }
      );
    }

    // Calculate next run time
    const now = new Date();
    let nextRunAt = new Date(now);
    
    switch (frequency) {
      case 'daily':
        nextRunAt.setDate(now.getDate() + 1);
        nextRunAt.setHours(hourOfDay || 9, 0, 0, 0);
        break;
      case 'weekly':
        const targetDay = dayOfWeek || 1; // Default to Monday
        const currentDay = now.getDay();
        const daysUntilNext = (targetDay - currentDay + 7) % 7 || 7;
        nextRunAt.setDate(now.getDate() + daysUntilNext);
        nextRunAt.setHours(hourOfDay || 9, 0, 0, 0);
        break;
      case 'monthly':
        nextRunAt.setMonth(now.getMonth() + 1);
        nextRunAt.setDate(dayOfMonth || 1);
        nextRunAt.setHours(hourOfDay || 9, 0, 0, 0);
        break;
      case 'quarterly':
        nextRunAt.setMonth(now.getMonth() + 3);
        nextRunAt.setDate(1);
        nextRunAt.setHours(hourOfDay || 9, 0, 0, 0);
        break;
    }

    // Create analytics report
    const { data: report, error: reportError } = await db.client
      .from('email_analytics_reports')
      .insert({
        organization_id: organizationId,
        created_by: userId,
        name,
        description,
        report_type: reportType,
        recipient_emails: recipientEmails,
        date_range_type: dateRangeType || 'relative',
        date_range_value: dateRangeValue || 'last_30_days',
        department_filter: departmentFilter || [],
        role_filter: roleFilter || [],
        custom_filters: customFilters || {},
        frequency,
        day_of_week: dayOfWeek,
        day_of_month: dayOfMonth,
        hour_of_day: hourOfDay || 9,
        timezone: timezone || 'UTC',
        format: format || 'html',
        include_charts: includeCharts !== false,
        is_enabled: true,
        next_run_at: nextRunAt.toISOString()
      })
      .select()
      .single();

    if (reportError) throw reportError;

    return NextResponse.json({
      success: true,
      reportId: report.id,
      nextRunAt: nextRunAt.toISOString(),
      message: 'Analytics report created successfully'
    });
  } catch (error) {
    console.error('Failed to create analytics report:', error);
    return NextResponse.json(
      { error: 'Failed to create analytics report' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { reportId, isEnabled, updates } = body;

    if (!reportId) {
      return NextResponse.json(
        { error: 'Report ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
      ...updates
    };

    if (typeof isEnabled === 'boolean') {
      updateData.is_enabled = isEnabled;
    }

    const { data: report, error } = await db.client
      .from('email_analytics_reports')
      .update(updateData)
      .eq('id', reportId)
      .select()
      .single();

    if (error) throw error;

    // Reschedule next run if needed
    if (updates && (updates.frequency || updates.day_of_week || updates.hour_of_day)) {
      await db.client.rpc('schedule_next_analytics_report', { p_report_id: reportId });
    }

    return NextResponse.json({
      success: true,
      report,
      message: 'Analytics report updated successfully'
    });
  } catch (error) {
    console.error('Failed to update analytics report:', error);
    return NextResponse.json(
      { error: 'Failed to update analytics report' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const reportId = searchParams.get('reportId');

    if (!reportId) {
      return NextResponse.json(
        { error: 'Report ID is required' },
        { status: 400 }
      );
    }

    const { error } = await db.client
      .from('email_analytics_reports')
      .delete()
      .eq('id', reportId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Analytics report deleted successfully'
    });
  } catch (error) {
    console.error('Failed to delete analytics report:', error);
    return NextResponse.json(
      { error: 'Failed to delete analytics report' },
      { status: 500 }
    );
  }
}