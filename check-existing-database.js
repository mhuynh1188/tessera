const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkDatabase() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  console.log('🔍 Scanning existing database schema...\n');
  
  // Check if hexie_votes table exists
  try {
    const { data: votesData, error: votesError } = await supabase
      .from('hexie_votes')
      .select('*')
      .limit(1);
    
    if (votesError) {
      console.log('❌ hexie_votes table:', votesError.message);
    } else {
      console.log('✅ hexie_votes table: EXISTS');
      console.log('   Sample data count:', await getTableCount('hexie_votes'));
    }
  } catch (e) {
    console.log('❌ hexie_votes table: Error -', e.message);
  }
  
  // Check if hexie_contests table exists
  try {
    const { data: contestsData, error: contestsError } = await supabase
      .from('hexie_contests')
      .select('*')
      .limit(1);
    
    if (contestsError) {
      console.log('❌ hexie_contests table:', contestsError.message);
    } else {
      console.log('✅ hexie_contests table: EXISTS');
      console.log('   Sample data count:', await getTableCount('hexie_contests'));
      
      // Check the actual schema
      const { data: schemaData } = await supabase
        .from('hexie_contests')
        .select('*')
        .limit(1);
      
      if (schemaData && schemaData.length > 0) {
        console.log('   Schema fields:', Object.keys(schemaData[0]));
      }
    }
  } catch (e) {
    console.log('❌ hexie_contests table: Error -', e.message);
  }
  
  // Check if hexie_contest_settings table exists
  try {
    const { data: settingsData, error: settingsError } = await supabase
      .from('hexie_contest_settings')
      .select('*')
      .limit(1);
    
    if (settingsError) {
      console.log('❌ hexie_contest_settings table:', settingsError.message);
    } else {
      console.log('✅ hexie_contest_settings table: EXISTS');
      console.log('   Sample data count:', await getTableCount('hexie_contest_settings'));
      
      // Check current settings
      const { data: allSettings } = await supabase
        .from('hexie_contest_settings')
        .select('*');
      
      if (allSettings) {
        console.log('   Current settings:');
        allSettings.forEach(setting => {
          console.log(`     ${setting.setting_key || setting.hexie_id}: ${setting.setting_value || setting.contest_disabled}`);
        });
      }
    }
  } catch (e) {
    console.log('❌ hexie_contest_settings table: Error -', e.message);
  }
  
  // Check hexie_cards table for reference
  try {
    const cardCount = await getTableCount('hexie_cards');
    console.log(`✅ hexie_cards table: EXISTS (${cardCount} cards)`);
  } catch (e) {
    console.log('❌ hexie_cards table: Error -', e.message);
  }
  
  async function getTableCount(tableName) {
    try {
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      return error ? 'unknown' : count;
    } catch {
      return 'unknown';
    }
  }
  
  console.log('\n🎯 RECOMMENDATION:');
  console.log('Based on the scan above, I can provide the exact SQL needed to fix any issues.');
}

checkDatabase().catch(console.error);