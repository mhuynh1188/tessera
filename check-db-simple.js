const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkTables() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY  // Use anon key instead
  );
  
  console.log('🔍 Checking table accessibility...\n');
  
  const tables = ['hexie_votes', 'hexie_contests', 'hexie_contest_settings', 'hexie_cards'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        if (error.message.includes('does not exist')) {
          console.log(`❌ ${table}: TABLE DOES NOT EXIST`);
        } else if (error.message.includes('policy')) {
          console.log(`🔒 ${table}: EXISTS (blocked by RLS policy)`);
        } else {
          console.log(`⚠️ ${table}: ${error.message}`);
        }
      } else {
        console.log(`✅ ${table}: EXISTS (${data} rows)`);
      }
    } catch (e) {
      console.log(`❌ ${table}: Error - ${e.message}`);
    }
  }
  
  console.log('\n🎯 Based on the errors you reported:');
  console.log('- "policy already exists" means the tables DO exist');
  console.log('- We just need to fix the actual data issues, not create new tables');
}

checkTables();