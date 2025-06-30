// API endpoints for email campaigns
import { NextRequest, NextResponse } from 'next/server';
import { enhancedEmailService } from '@/lib/email/enhanced-email-service';
import { db } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const { data: campaigns, error } = await db.client
      .from('email_campaigns')
      .select(`
        *,
        email_templates(name, display_name),
        users(first_name, last_name)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error('Failed to fetch campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      name, 
      templateId, 
      targetCriteria, 
      organizationId, 
      userId,
      scheduledAt,
      isRecurring,
      recurrencePattern,
      subject
    } = body;

    // Validation
    if (!name || !templateId || !organizationId || !userId || !subject) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create campaign
    const { data: campaign, error: campaignError } = await db.client
      .from('email_campaigns')
      .insert({
        organization_id: organizationId,
        created_by: userId,
        name,
        template_id: templateId,
        subject,
        target_criteria: targetCriteria,
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        schedule_type: scheduledAt ? 'scheduled' : 'immediate',
        recurrence_pattern: isRecurring ? recurrencePattern : {},
        status: scheduledAt ? 'scheduled' : 'draft'
      })
      .select()
      .single();

    if (campaignError) throw campaignError;

    return NextResponse.json({ 
      success: true, 
      campaignId: campaign.id,
      message: 'Campaign created successfully' 
    });
  } catch (error) {
    console.error('Failed to create campaign:', error);
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { campaignId, status, updates } = body;

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
      ...updates
    };

    if (status) {
      updateData.status = status;
      
      if (status === 'sending') {
        updateData.started_at = new Date().toISOString();
      } else if (status === 'completed' || status === 'cancelled') {
        updateData.completed_at = new Date().toISOString();
      }
    }

    const { data: campaign, error } = await db.client
      .from('email_campaigns')
      .update(updateData)
      .eq('id', campaignId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      campaign,
      message: 'Campaign updated successfully' 
    });
  } catch (error) {
    console.error('Failed to update campaign:', error);
    return NextResponse.json(
      { error: 'Failed to update campaign' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const campaignId = searchParams.get('campaignId');

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    const { error } = await db.client
      .from('email_campaigns')
      .delete()
      .eq('id', campaignId);

    if (error) throw error;

    return NextResponse.json({ 
      success: true,
      message: 'Campaign deleted successfully' 
    });
  } catch (error) {
    console.error('Failed to delete campaign:', error);
    return NextResponse.json(
      { error: 'Failed to delete campaign' },
      { status: 500 }
    );
  }
}