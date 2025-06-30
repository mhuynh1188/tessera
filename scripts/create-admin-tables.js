#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Use the anon key for now
const supabaseUrl = 'https://kpzrjepaqqqdaumegfio.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwenJqZXBhcXFxZGF1bWVnZmlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwODY5ODQsImV4cCI6MjA2MzY2Mjk4NH0.Moc6P8V9t1bht1CHRijk08Cq1-CMYKsm29F2u0-T-YA';

async function createAdminTables() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log('🔄 Creating admin tables...');

    // Test basic connection
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(5);

    if (tablesError) {
      console.log('⚠️  Cannot access information_schema:', tablesError.message);
    } else {
      console.log('✅ Database accessible, existing tables:', tables?.map(t => t.table_name).join(', '));
    }

    // Try to create a simple test record to verify we can write
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: 'Test Organization',
        subscription_tier: 'enterprise',
        settings: { test: true }
      })
      .select()
      .single();

    if (orgError) {
      console.log('⚠️  Cannot create test organization:', orgError.message);
    } else {
      console.log('✅ Test organization created:', orgData);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createAdminTables();