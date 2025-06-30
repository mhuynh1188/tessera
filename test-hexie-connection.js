const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kpzrjepaqqqdaumegfio.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwenJqZXBhcXFxZGF1bWVnZmlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwODY5ODQsImV4cCI6MjA2MzY2Mjk4NH0.Moc6P8V9t1bht1CHRijk08Cq1-CMYKsm29F2u0-T-YA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testHexieConnection() {
  console.log('🔍 Testing Hexie Database Connection...\n');
  
  try {
    // Test 1: Check hexie_cards count
    console.log('1. Checking hexie_cards table:');
    const { count: cardCount, error: cardCountError } = await supabase
      .from('hexie_cards')
      .select('*', { count: 'exact', head: true });
    
    if (cardCountError) {
      console.error('❌ Error accessing hexie_cards:', cardCountError);
    } else {
      console.log(`✅ Found ${cardCount || 0} hexie_cards`);
    }
    
    // Test 2: Get first few cards to see structure
    if (cardCount && cardCount > 0) {
      console.log('\n2. Fetching sample hexie_cards:');
      const { data: cards, error: cardsError } = await supabase
        .from('hexie_cards')
        .select('id, title, front_text, category, subscription_tier_required, is_active')
        .limit(3);
      
      if (cardsError) {
        console.error('❌ Error fetching cards:', cardsError);
      } else {
        console.log('Sample cards:');
        cards.forEach((card, index) => {
          console.log(`  ${index + 1}. ${card.title} (${card.category}) - ${card.subscription_tier_required}`);
        });
      }
    }
    
    // Test 3: Check categories
    console.log('\n3. Checking hexie_categories table:');
    const { count: categoryCount, error: categoryCountError } = await supabase
      .from('hexie_categories')
      .select('*', { count: 'exact', head: true });
    
    if (categoryCountError) {
      console.error('❌ Error accessing hexie_categories:', categoryCountError);
    } else {
      console.log(`✅ Found ${categoryCount || 0} hexie_categories`);
    }
    
    // Test 4: Get categories
    if (categoryCount && categoryCount > 0) {
      const { data: categories, error: categoriesError } = await supabase
        .from('hexie_categories')
        .select('id, name, color, is_active')
        .eq('is_active', true)
        .order('sort_order');
      
      if (categoriesError) {
        console.error('❌ Error fetching categories:', categoriesError);
      } else {
        console.log('Available categories:');
        categories.forEach((cat, index) => {
          console.log(`  ${index + 1}. ${cat.name} (${cat.color})`);
        });
      }
    }
    
    // Test 5: Check what getTesseraCards would find
    console.log('\n4. Testing subscription tier filtering (free cards):');
    const { data: freeCards, error: freeCardsError } = await supabase
      .from('hexie_cards')
      .select('id, title, subscription_tier_required')
      .eq('is_active', true)
      .eq('subscription_tier_required', 'free');
    
    if (freeCardsError) {
      console.error('❌ Error fetching free cards:', freeCardsError);
    } else {
      console.log(`✅ Found ${freeCards?.length || 0} free cards that should appear in demo`);
      if (freeCards && freeCards.length > 0) {
        freeCards.forEach((card, index) => {
          console.log(`  ${index + 1}. ${card.title}`);
        });
      }
    }
    
    // Summary
    console.log('\n📊 SUMMARY:');
    console.log(`Total hexie_cards: ${cardCount || 0}`);
    console.log(`Total hexie_categories: ${categoryCount || 0}`);
    console.log(`Free cards available: ${freeCards?.length || 0}`);
    
    if ((cardCount || 0) === 0) {
      console.log('\n💡 SOLUTION: The database tables exist but are empty.');
      console.log('   You need to populate hexie_cards and hexie_categories tables with data.');
      console.log('   This can be done through the hexies-admin interface.');
    } else if ((freeCards?.length || 0) === 0) {
      console.log('\n💡 SOLUTION: There are cards in the database, but none with subscription_tier_required="free".');
      console.log('   Either add some free cards or adjust the demo to show basic/premium cards.');
    } else {
      console.log('\n✅ Database has data! The issue may be in the hex-app configuration or code.');
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

testHexieConnection();