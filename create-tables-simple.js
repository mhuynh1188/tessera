const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function createTables() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  console.log('Creating contest settings table...');
  
  try {
    // Try to insert settings directly into an existing table structure
    const { data, error } = await supabase
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
        }
      ], { onConflict: 'setting_key' });
    
    if (error) {
      console.log('Settings table may not exist yet, creating via SQL...');
      console.log('Error was:', error.message);
    } else {
      console.log('✅ Settings updated successfully:', data);
    }
    
    // Test hexie_votes table
    const { data: votesTest, error: votesError } = await supabase
      .from('hexie_votes')
      .select('count', { count: 'exact', head: true });
      
    if (votesError) {
      console.log('❌ hexie_votes table does not exist:', votesError.message);
      console.log('Please create it manually in Supabase dashboard');
    } else {
      console.log('✅ hexie_votes table exists');
    }
    
    // Test hexie_contests table
    const { data: contestsTest, error: contestsError } = await supabase
      .from('hexie_contests')
      .select('count', { count: 'exact', head: true });
      
    if (contestsError) {
      console.log('❌ hexie_contests table does not exist:', contestsError.message);
      console.log('Please create it manually in Supabase dashboard');
    } else {
      console.log('✅ hexie_contests table exists');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

createTables();