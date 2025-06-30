#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kpzrjepaqqqdaumegfio.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwenJqZXBhcXFxZGF1bWVnZmlvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODA4Njk4NCwiZXhwIjoyMDYzNjYyOTg0fQ.2Onmj0mT2FCBPTd2stoXlVlwbR8c1Bpm9gK1wQgwMMI';

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, serviceKey);

async function setupDatabase() {
  console.log('🚀 Setting up database for admin system...\n');

  try {
    // First, let's check what exists
    console.log('1️⃣ Checking existing tables...');
    
    // Check organizations table
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .limit(1);
    
    if (orgError) {
      console.log('❌ Organizations table missing, creating...');
      await createOrganizationsTable();
    } else {
      console.log('✅ Organizations table exists');
    }

    // Check users table (might exist from auth)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .limit(1);
    
    if (userError) {
      console.log('❌ Users table missing, creating...');
      await createUsersTable();
    } else {
      console.log('✅ Users table exists');
    }

    // Check admin tables
    const adminTables = [
      'organization_members',
      'user_profiles', 
      'admin_activity_logs',
      'security_policies',
      'email_templates'
    ];

    for (const table of adminTables) {
      await checkAndCreateTable(table);
    }

    // Insert demo organization if none exists
    await createDemoOrganization();

    console.log('\n🎉 Database setup complete!');

  } catch (error) {
    console.error('💥 Setup failed:', error);
  }
}

async function checkAndCreateTable(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`❌ ${tableName} table missing, creating...`);
      await createTable(tableName);
    } else {
      console.log(`✅ ${tableName} table exists`);
    }
  } catch (err) {
    console.log(`❌ ${tableName} table check failed:`, err.message);
  }
}

async function createOrganizationsTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS organizations (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(255) NOT NULL,
      domain VARCHAR(255),
      subscription_tier VARCHAR(50) DEFAULT 'free',
      settings JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  
  await executeSQL(sql);
}

async function createUsersTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      email VARCHAR(255) UNIQUE NOT NULL,
      organization_id UUID REFERENCES organizations(id),
      role VARCHAR(50) DEFAULT 'member',
      is_admin BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  
  await executeSQL(sql);
}

async function createTable(tableName) {
  let sql = '';
  
  switch (tableName) {
    case 'organization_members':
      sql = `
        CREATE TABLE IF NOT EXISTS organization_members (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL,
          organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
          role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'manager', 'member', 'viewer')),
          joined_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(user_id, organization_id)
        );
      `;
      break;
      
    case 'user_profiles':
      sql = `
        CREATE TABLE IF NOT EXISTS user_profiles (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
          organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `;
      break;
      
    case 'admin_activity_logs':
      sql = `
        CREATE TABLE IF NOT EXISTS admin_activity_logs (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID,
          organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
          action VARCHAR(100) NOT NULL,
          resource_type VARCHAR(50) NOT NULL,
          resource_id UUID,
          details TEXT,
          ip_address INET,
          user_agent TEXT,
          success BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `;
      break;
      
    case 'security_policies':
      sql = `
        CREATE TABLE IF NOT EXISTS security_policies (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
          policy_name VARCHAR(200) NOT NULL,
          policy_type VARCHAR(50) NOT NULL,
          policy_config JSONB NOT NULL DEFAULT '{}',
          is_enabled BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `;
      break;
      
    case 'email_templates':
      sql = `
        CREATE TABLE IF NOT EXISTS email_templates (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name VARCHAR(255) NOT NULL,
          subject VARCHAR(500) NOT NULL,
          html_content TEXT NOT NULL,
          text_content TEXT,
          organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
          template_type VARCHAR(50) DEFAULT 'transactional',
          status VARCHAR(20) DEFAULT 'active',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `;
      break;
  }
  
  if (sql) {
    await executeSQL(sql);
  }
}

async function createDemoOrganization() {
  try {
    const { data: existing } = await supabase
      .from('organizations')
      .select('id')
      .limit(1);
    
    if (!existing || existing.length === 0) {
      console.log('Creating demo organization...');
      
      const { data, error } = await supabase
        .from('organizations')
        .insert({
          id: '11111111-1111-1111-1111-111111111111',
          name: 'Demo Organization',
          subscription_tier: 'enterprise',
          settings: { analytics_enabled: true }
        })
        .select()
        .single();
      
      if (error) {
        console.log('Error creating demo org:', error.message);
      } else {
        console.log('✅ Demo organization created');
      }
    } else {
      console.log('✅ Organization already exists');
    }
  } catch (err) {
    console.log('Organization creation error:', err.message);
  }
}

async function executeSQL(sql) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    if (error) {
      console.log('SQL execution error:', error.message);
    }
  } catch (err) {
    console.log('SQL error:', err.message);
  }
}

// Run the setup
setupDatabase();