#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = 'https://kpzrjepaqqqdaumegfio.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwenJqZXBhcXFxZGF1bWVnZmlvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODA4Njk4NCwiZXhwIjoyMDYzNjYyOTg0fQ.2Onmj0mT2FCBPTd2stoXlVlwbR8c1Bpm9gK1wQgwMMI';

async function setupAdminDatabase() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log('🔄 Setting up admin database tables...');

    // Read the SQL file
    const sqlFilePath = path.join(__dirname, '..', 'database-admin-fix.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📋 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.toLowerCase().includes('begin') || 
          statement.toLowerCase().includes('commit') ||
          statement.toLowerCase().includes('select \'admin system')) {
        console.log(`⏭️  Skipping statement ${i + 1}: ${statement.substring(0, 50)}...`);
        continue;
      }

      try {
        console.log(`🔄 Executing statement ${i + 1}/${statements.length}: ${statement.substring(0, 80)}...`);
        
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement
        });

        if (error) {
          console.log(`⚠️  Warning on statement ${i + 1}:`, error.message);
          // Continue with other statements even if one fails
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.log(`⚠️  Error on statement ${i + 1}:`, err.message);
        // Continue with other statements
      }
    }

    console.log('🎉 Admin database setup completed!');
    
    // Test the connection by querying a table
    console.log('🔍 Testing database connection...');
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .limit(1);

    if (orgError) {
      console.log('⚠️  Organizations table check:', orgError.message);
    } else {
      console.log('✅ Organizations table accessible:', orgData);
    }

  } catch (error) {
    console.error('❌ Error setting up admin database:', error);
    process.exit(1);
  }
}

setupAdminDatabase();