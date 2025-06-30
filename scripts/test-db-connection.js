#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://kpzrjepaqqqdaumegfio.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwenJqZXBhcXFxZGF1bWVnZmlvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODA4Njk4NCwiZXhwIjoyMDYzNjYyOTg0fQ.2Onmj0mT2FCBPTd2stoXlVlwbR8c1Bpm9gK1wQgwMMI';

async function testConnection() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log('🔄 Testing database connection...');

    // Test basic connection by listing tables
    const { data, error } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public')
      .limit(10);

    if (error) {
      console.error('❌ Connection error:', error);
      return;
    }

    console.log('✅ Database connection successful!');
    console.log('📋 Existing tables:', data?.map(t => t.tablename).join(', '));

    // Check if organizations table exists
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .limit(1);

    if (orgError) {
      console.log('⚠️  Organizations table:', orgError.message);
    } else {
      console.log('✅ Organizations table exists with data:', orgData);
    }

    // Check if users table exists
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .limit(1);

    if (userError) {
      console.log('⚠️  Users table:', userError.message);
    } else {
      console.log('✅ Users table exists with data:', userData);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testConnection();