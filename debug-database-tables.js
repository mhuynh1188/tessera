#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kpzrjepaqqqdaumegfio.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwenJqZXBhcXFxZGF1bWVnZmlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwODY5ODQsImV4cCI6MjA2MzY2Mjk4NH0.Moc6P8V9t1bht1CHRijk08Cq1-CMYKsm29F2u0-T-YA';

async function checkDatabaseTables() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🔍 Checking existing database tables...\n');

  // Test each table that admin APIs are trying to use
  const tablesToCheck = [
    'organizations',
    'users', 
    'email_templates',
    'admin_activity_logs',
    'organization_members',
    'user_profiles',
    'user_sessions',
    'security_policies',
    'system_settings',
    'user_two_factor_auth',
    'hexie_cards',
    'workspaces'
  ];

  for (const table of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: EXISTS (${data?.length || 0} sample records)`);
        if (data?.length > 0) {
          console.log(`   Sample: ${JSON.stringify(Object.keys(data[0]))}`);
        }
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }

  // Check what tables actually exist by using raw SQL
  try {
    console.log('\n🔍 Attempting to list all public tables...');
    const { data, error } = await supabase.rpc('get_public_tables');
    if (error) {
      console.log('Cannot call get_public_tables RPC:', error.message);
    } else {
      console.log('Public tables found:', data);
    }
  } catch (err) {
    console.log('Error getting table list:', err.message);
  }
}

checkDatabaseTables();