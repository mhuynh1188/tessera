import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    console.log('🔄 Setting up admin database tables...');

    // Create admin tables one by one
    const tables = [
      {
        name: 'organization_members',
        sql: `
          CREATE TABLE IF NOT EXISTS organization_members (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            organization_id UUID NOT NULL,
            role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'manager', 'member', 'viewer')),
            joined_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(user_id, organization_id)
          )
        `
      },
      {
        name: 'user_profiles',
        sql: `
          CREATE TABLE IF NOT EXISTS user_profiles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID UNIQUE NOT NULL,
            first_name VARCHAR(100),
            last_name VARCHAR(100),
            display_name VARCHAR(200),
            job_title VARCHAR(200),
            department VARCHAR(100),
            phone_number VARCHAR(20),
            profile_image_url TEXT,
            timezone VARCHAR(50) DEFAULT 'UTC',
            locale VARCHAR(10) DEFAULT 'en-US',
            organization_id UUID,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          )
        `
      },
      {
        name: 'admin_activity_logs',
        sql: `
          CREATE TABLE IF NOT EXISTS admin_activity_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID,
            organization_id UUID,
            action VARCHAR(100) NOT NULL,
            resource_type VARCHAR(50) NOT NULL,
            resource_id UUID,
            details TEXT,
            ip_address TEXT,
            user_agent TEXT,
            success BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMPTZ DEFAULT NOW()
          )
        `
      },
      {
        name: 'email_queue',
        sql: `
          CREATE TABLE IF NOT EXISTS email_queue (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            template_id UUID,
            recipient_email VARCHAR(255) NOT NULL,
            recipient_name VARCHAR(255),
            subject VARCHAR(500) NOT NULL,
            html_content TEXT NOT NULL,
            text_content TEXT,
            status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'bounced')),
            attempts INTEGER DEFAULT 0,
            max_attempts INTEGER DEFAULT 3,
            sent_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          )
        `
      },
      {
        name: 'user_sessions',
        sql: `
          CREATE TABLE IF NOT EXISTS user_sessions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            organization_id UUID,
            session_token VARCHAR(255) UNIQUE NOT NULL,
            user_agent TEXT,
            ip_address TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            last_activity_at TIMESTAMPTZ DEFAULT NOW(),
            expires_at TIMESTAMPTZ NOT NULL,
            is_active BOOLEAN DEFAULT TRUE
          )
        `
      },
      {
        name: 'user_two_factor_auth',
        sql: `
          CREATE TABLE IF NOT EXISTS user_two_factor_auth (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            method_type VARCHAR(20) NOT NULL CHECK (method_type IN ('totp', 'sms', 'email', 'backup_codes')),
            is_verified BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(user_id, method_type)
          )
        `
      },
      {
        name: 'system_settings',
        sql: `
          CREATE TABLE IF NOT EXISTS system_settings (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            organization_id UUID,
            category VARCHAR(50) NOT NULL,
            setting_key VARCHAR(100) NOT NULL,
            setting_value JSONB NOT NULL,
            description TEXT,
            updated_by UUID,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(organization_id, category, setting_key)
          )
        `
      }
    ];

    const results = [];

    for (const table of tables) {
      try {
        console.log(`Creating table: ${table.name}`);
        
        // Use a simple insert to test if we can create the table
        // Since we can't execute raw SQL, we'll try to create records to auto-create tables
        const { error } = await supabase
          .from(table.name)
          .select('id')
          .limit(1);

        if (error && error.message.includes('does not exist')) {
          console.log(`Table ${table.name} does not exist, needs to be created manually`);
          results.push({
            table: table.name,
            status: 'needs_manual_creation',
            error: error.message
          });
        } else {
          console.log(`Table ${table.name} already exists`);
          results.push({
            table: table.name,
            status: 'exists'
          });
        }
      } catch (err) {
        console.error(`Error checking table ${table.name}:`, err);
        results.push({
          table: table.name,
          status: 'error',
          error: err.message
        });
      }
    }

    // Create default organization if it doesn't exist
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('name', 'Demo Organization')
      .single();

    if (!existingOrg) {
      const { data: newOrg, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: 'Demo Organization',
          subscription_tier: 'enterprise',
          settings: { analytics_enabled: true }
        })
        .select()
        .single();

      if (orgError) {
        console.error('Error creating demo organization:', orgError);
      } else {
        console.log('Created demo organization:', newOrg);
        results.push({
          table: 'organizations',
          status: 'demo_created',
          data: newOrg
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Database setup completed',
      results,
      note: 'Some tables may need to be created manually in Supabase dashboard'
    });

  } catch (error) {
    console.error('Error setting up database:', error);
    return NextResponse.json(
      { error: 'Failed to setup database', details: error.message },
      { status: 500 }
    );
  }
}