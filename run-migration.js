require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function runMigration() {
  try {
    console.log('🚀 Running admin system migration...');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase credentials');
      console.log('URL exists:', !!supabaseUrl);
      console.log('Key exists:', !!supabaseKey);
      return;
    }
    
    console.log('Creating Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('Reading migration file...');
    const migration = fs.readFileSync('./database/migrations/005-admin-system.sql', 'utf8');
    
    console.log('Executing migration...');
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: migration });
    
    if (error) {
      console.error('❌ Migration error:', error);
    } else {
      console.log('✅ Admin system migration completed successfully!');
      console.log('Migration data:', data);
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

runMigration();