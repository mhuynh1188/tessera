// Test Supabase connection and verify free hexie cards are available
// Run with: node test-supabase-connection.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('SUPABASE_URL:', supabaseUrl ? '✓ Set' : '❌ Missing');
  console.log('SUPABASE_ANON_KEY:', supabaseKey ? '✓ Set' : '❌ Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔄 Testing Supabase connection...');
  
  try {
    // Test 1: Basic connection
    const { data: tables, error: tablesError } = await supabase
      .from('hexie_cards')
      .select('count', { count: 'exact', head: true });
    
    if (tablesError) {
      console.error('❌ Connection failed:', tablesError.message);
      return false;
    }
    
    console.log('✅ Connected to Supabase successfully');
    console.log(`📊 Total hexie_cards in database: ${tables}`);
    
    // Test 2: Fetch free cards specifically
    const { data: freeCards, error: freeError } = await supabase
      .from('hexie_cards')
      .select(`
        id,
        title,
        subscription_tier_required,
        is_active,
        category,
        created_at
      `)
      .eq('subscription_tier_required', 'free')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (freeError) {
      console.error('❌ Error fetching free cards:', freeError.message);
      return false;
    }
    
    console.log(`🎮 Free hexie cards available: ${freeCards?.length || 0}`);
    
    if (freeCards && freeCards.length > 0) {
      console.log('\n📋 Sample free cards:');
      freeCards.slice(0, 5).forEach((card, index) => {
        console.log(`  ${index + 1}. ${card.title} (${card.category})`);
      });
      
      // Test 3: Verify the public API format works
      console.log('\n🔧 Testing API format transformation...');
      const apiFormatCard = {
        id: freeCards[0].id,
        title: freeCards[0].title,
        subscription_tier_required: freeCards[0].subscription_tier_required,
        is_active: freeCards[0].is_active,
        category: freeCards[0].category
      };
      console.log('✅ API format works:', JSON.stringify(apiFormatCard, null, 2));
      
      return true;
    } else {
      console.log('⚠️  No free hexie cards found in database');
      console.log('💡 This might mean:');
      console.log('   - No cards have been created yet');
      console.log('   - Cards exist but are not marked as subscription_tier_required="free"');
      console.log('   - Cards exist but are not marked as is_active=true');
      
      // Test 4: Check what cards do exist
      const { data: allCards, error: allError } = await supabase
        .from('hexie_cards')
        .select('subscription_tier_required, is_active, count(*)')
        .limit(10);
      
      if (!allError && allCards) {
        console.log('\n📋 Sample of existing cards:');
        allCards.forEach(card => {
          console.log(`   - Tier: ${card.subscription_tier_required}, Active: ${card.is_active}`);
        });
      }
      
      return false;
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

// Run the test
testConnection().then(success => {
  if (success) {
    console.log('\n✅ Demo system should work! Free hexie cards are available.');
    console.log('🚀 Try running the demo at http://localhost:3000/demo');
  } else {
    console.log('\n❌ Demo system will fall back to offline data.');
    console.log('🔧 Check your Supabase database and ensure free cards exist.');
  }
  process.exit(success ? 0 : 1);
});