// API endpoints for Active Directory integration
import { NextRequest, NextResponse } from 'next/server';
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

    switch (action) {
      case 'config':
        // Get AD sync configuration
        const config = await activeDirectoryService.getADSyncConfig(organizationId);
        return NextResponse.json({ config });

      case 'recipients':
        // Get email recipients with AD sync info
        const recipients = await activeDirectoryService.getEmailRecipients(organizationId);
        return NextResponse.json({ recipients });

      case 'status':
        // Get sync status and statistics
        const { data: syncStats, error } = await db.client
          .from('email_recipients')
          .select('ad_sync_enabled, ad_last_sync, source')
          .eq('organization_id', organizationId);

        if (error) throw error;

        const stats = {
          totalRecipients: syncStats?.length || 0,
          adSyncEnabled: syncStats?.filter(r => r.ad_sync_enabled).length || 0,
          lastSync: syncStats?.reduce((latest, r) => {
            if (!r.ad_last_sync) return latest;
            const syncDate = new Date(r.ad_last_sync);
            return !latest || syncDate > latest ? syncDate : latest;
          }, null),
          sourceBreakdown: syncStats?.reduce((acc, r) => {
            acc[r.source] = (acc[r.source] || 0) + 1;
            return acc;
          }, {} as Record<string, number>) || {}
        };

        return NextResponse.json({ stats });

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Failed to process AD request:', error);
    return NextResponse.json(
      { error: 'Failed to process Active Directory request' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, organizationId, config } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'test_connection':
        // Test AD connection
        if (!config) {
          return NextResponse.json(
            { error: 'AD configuration is required for connection test' },
            { status: 400 }
          );
        }

        const testResult = await activeDirectoryService.testADConnection(config);
        return NextResponse.json(testResult);

      case 'sync_now':
        // Trigger immediate sync
        const currentConfig = await activeDirectoryService.getADSyncConfig(organizationId);
        if (!currentConfig || !currentConfig.enabled) {
          return NextResponse.json(
            { error: 'AD sync is not enabled for this organization' },
            { status: 400 }
          );
        }

        const syncResults = await activeDirectoryService.syncUsersFromAD(organizationId, currentConfig);
        return NextResponse.json({ 
          success: true, 
          results: syncResults,
          message: `Synced ${syncResults.synced} users successfully` 
        });

      case 'update_config':
        // Update AD sync configuration
        if (!config) {
          return NextResponse.json(
            { error: 'Configuration is required' },
            { status: 400 }
          );
        }

        const updateSuccess = await activeDirectoryService.updateADSyncConfig(organizationId, config);
        if (!updateSuccess) {
          return NextResponse.json(
            { error: 'Failed to update AD configuration' },
            { status: 500 }
          );
        }

        return NextResponse.json({ 
          success: true, 
          message: 'AD configuration updated successfully' 
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Failed to process AD request:', error);
    return NextResponse.json(
      { error: 'Failed to process Active Directory request' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, recipientId, updates } = body;

    if (!organizationId || !recipientId) {
      return NextResponse.json(
        { error: 'Organization ID and recipient ID are required' },
        { status: 400 }
      );
    }

    // Update specific recipient
    const { data: recipient, error } = await db.client
      .from('email_recipients')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', recipientId)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      recipient,
      message: 'Recipient updated successfully' 
    });
  } catch (error) {
    console.error('Failed to update recipient:', error);
    return NextResponse.json(
      { error: 'Failed to update recipient' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');
    const recipientId = searchParams.get('recipientId');

    if (!organizationId || !recipientId) {
      return NextResponse.json(
        { error: 'Organization ID and recipient ID are required' },
        { status: 400 }
      );
    }

    // Delete recipient
    const { error } = await db.client
      .from('email_recipients')
      .delete()
      .eq('id', recipientId)
      .eq('organization_id', organizationId);

    if (error) throw error;

    return NextResponse.json({ 
      success: true,
      message: 'Recipient deleted successfully' 
    });
  } catch (error) {
    console.error('Failed to delete recipient:', error);
    return NextResponse.json(
      { error: 'Failed to delete recipient' },
      { status: 500 }
    );
  }
}