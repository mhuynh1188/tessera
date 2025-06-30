const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function runSQL() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  console.log('Creating voting and contest system tables...');
  
  // Create tables directly using individual queries
  try {
    // Create hexie_votes table
    const { error: votesError } = await supabase.rpc('exec', { 
      sql: `
        CREATE TABLE IF NOT EXISTS public.hexie_votes (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          hexie_instance_id UUID NOT NULL,
          participant_id TEXT NOT NULL,
          vote_type TEXT NOT NULL CHECK (vote_type IN ('agree', 'disagree', 'neutral')),
          severity_level INTEGER CHECK (severity_level BETWEEN 1 AND 5),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(hexie_instance_id, participant_id)
        );
      `
    });
    
    if (votesError && !votesError.message.includes('already exists')) {
      console.warn('Votes table warning:', votesError.message);
    }
    
    // Create hexie_contests table
    const { error: contestsError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.hexie_contests (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          hexie_id UUID NOT NULL,
          contest_type TEXT NOT NULL CHECK (contest_type IN ('disagree', 'incorrect', 'suggestions', 'feedback')),
          reason TEXT NOT NULL,
          details TEXT,
          status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'resolved')),
          created_by UUID,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          resolved_at TIMESTAMPTZ,
          resolved_by UUID,
          admin_notes TEXT
        );
      `
    });
    
    if (contestsError && !contestsError.message.includes('already exists')) {
      console.warn('Contests table warning:', contestsError.message);
    }
    
    // Create settings table
    const { error: settingsError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.hexie_contest_settings (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          setting_key TEXT NOT NULL UNIQUE,
          setting_value BOOLEAN NOT NULL DEFAULT true,
          description TEXT,
          updated_by UUID,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    });
    
    if (settingsError && !settingsError.message.includes('already exists')) {
      console.warn('Settings table warning:', settingsError.message);
    }
    
    // Insert default settings
    const { error: insertError } = await supabase
      .from('hexie_contest_settings')
      .upsert([
        {
          setting_key: 'allow_anonymous_contests',
          setting_value: true,
          description: 'Allow non-logged-in users to contest cards'
        },
        {
          setting_key: 'require_login_for_contests', 
          setting_value: false,
          description: 'Require users to be logged in to contest cards'
        },
        {
          setting_key: 'voting_system_enabled',
          setting_value: true,
          description: 'Enable the voting system for hexie cards'
        },
        {
          setting_key: 'contest_system_enabled',
          setting_value: true,
          description: 'Enable the contest system for hexie cards'
        }
      ], { onConflict: 'setting_key' });
    
    if (insertError) {
      console.warn('Settings insert warning:', insertError.message);
    }
    
    // Test tables
    const { data: votesData, error: votesTestError } = await supabase
      .from('hexie_votes')
      .select('count', { count: 'exact', head: true });
    
    const { data: contestsData, error: contestsTestError } = await supabase
      .from('hexie_contests')  
      .select('count', { count: 'exact', head: true });
      
    const { data: settingsData, error: settingsTestError } = await supabase
      .from('hexie_contest_settings')
      .select('*');
    
    if (!votesTestError) {
      console.log('✅ hexie_votes table ready');
    } else {
      console.error('❌ hexie_votes table error:', votesTestError.message);
    }
    
    if (!contestsTestError) {
      console.log('✅ hexie_contests table ready');
    } else {
      console.error('❌ hexie_contests table error:', contestsTestError.message);  
    }
    
    if (!settingsTestError) {
      console.log('✅ hexie_contest_settings table ready');
      console.log('📋 Current settings:', settingsData);
    } else {
      console.error('❌ hexie_contest_settings table error:', settingsTestError.message);
    }
    
    console.log('\n🎉 Database setup complete! You can now test voting and contest features.');
    
  } catch (error) {
    console.error('Migration error:', error);
  }
}

runSQL();