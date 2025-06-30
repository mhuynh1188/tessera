const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kpzrjepaqqqdaumegfio.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwenJqZXBhcXFxZGF1bWVnZmlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwODY5ODQsImV4cCI6MjA2MzY2Mjk4NH0.Moc6P8V9t1bht1CHRijk08Cq1-CMYKsm29F2u0-T-YA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Replicate the exact DatabaseService.getHexieCards method
async function testDatabaseServiceMethod() {
  console.log('🧪 Testing DatabaseService.getHexieCards method...\n');
  
  const filters = {
    subscription_tier: 'free',
    is_active: true
  };
  
  try {
    // Optimized query - only select needed fields for better performance
    let query = supabase
      .from('hexie_cards')
      .select(`
        id,
        title,
        front_text,
        back_text,
        category,
        subcategory,
        color_scheme,
        icon_svg,
        subscription_tier_required,
        is_active,
        created_by,
        created_at,
        updated_at,
        references,
        card_references,
        tags,
        severity_rating,
        psychological_framework
      `);

    // Filter by subscription tier access with proper indexing
    if (filters.subscription_tier) {
      const tierHierarchy = { free: 0, basic: 1, premium: 2 };
      const userTierLevel = tierHierarchy[filters.subscription_tier] || 0;
      
      if (userTierLevel === 0) {
        query = query.eq('subscription_tier_required', 'free');
      } else if (userTierLevel === 1) {
        query = query.in('subscription_tier_required', ['free', 'basic']);
      }
      // Premium users get everything (no filter)
    }

    // Use is_active filter with proper index
    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    } else {
      // Default to only active cards
      query = query.eq('is_active', true);
    }

    // Filter out archived cards for performance
    query = query.eq('is_archived', false);

    // Order and limit for performance
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(100); // Limit to prevent large data fetches

    if (error) {
      console.error('❌ Database query error:', error);
      throw error;
    }

    console.log(`✅ Raw query returned ${data?.length || 0} cards`);

    if (data && data.length > 0) {
      console.log('\n📋 Sample raw cards:');
      data.slice(0, 3).forEach((card, i) => {
        console.log(`  ${i + 1}. "${card.title}" (${card.category}) - tier: ${card.subscription_tier_required}, active: ${card.is_active}`);
      });
    }

    // Transform data to match expected TesseraCard interface
    const transformedData = (data || []).map((card) => ({
      id: card.id,
      title: card.title,
      front_text: card.front_text,
      back_text: card.back_text,
      category: card.category,
      subcategory: card.subcategory,
      subscription_tier_required: card.subscription_tier_required,
      color_scheme: card.color_scheme || {
        primary: '#3b82f6',
        secondary: '#1e40af',
        text: '#ffffff'
      },
      icon_svg: card.icon_svg,
      created_at: card.created_at,
      updated_at: card.updated_at,
      created_by: card.created_by,
      is_active: card.is_active,
      tags: card.tags || [],
      references: card.references || card.card_references || [],
      card_references: card.card_references || card.references || [],
      severity_rating: card.severity_rating,
      psychological_framework: card.psychological_framework
    }));

    console.log(`\n🔄 Transformed ${transformedData.length} cards successfully`);
    
    if (transformedData.length > 0) {
      console.log('\n✅ Sample transformed card:');
      console.log(JSON.stringify(transformedData[0], null, 2));
    }

    return transformedData;
    
  } catch (error) {
    console.error('💥 DatabaseService method error:', error);
    throw error;
  }
}

// Test if we can see cards without filtering
async function testRawAccess() {
  console.log('\n🔍 Testing raw table access...\n');
  
  try {
    // Test basic table access
    const { data: allCards, error: allError } = await supabase
      .from('hexie_cards')
      .select('id, title, subscription_tier_required, is_active, is_archived')
      .limit(10);
    
    if (allError) {
      console.error('❌ Raw access failed:', allError);
    } else {
      console.log(`✅ Raw access found ${allCards?.length || 0} cards total`);
      if (allCards && allCards.length > 0) {
        console.log('Sample cards:');
        allCards.forEach(card => {
          console.log(`  - "${card.title}" (tier: ${card.subscription_tier_required}, active: ${card.is_active}, archived: ${card.is_archived})`);
        });
      }
    }
    
    // Test free tier specifically
    const { data: freeCards, error: freeError } = await supabase
      .from('hexie_cards')
      .select('id, title, subscription_tier_required, is_active, is_archived')
      .eq('subscription_tier_required', 'free')
      .limit(5);
    
    if (freeError) {
      console.error('❌ Free cards access failed:', freeError);
    } else {
      console.log(`\n✅ Free tier cards: ${freeCards?.length || 0}`);
    }
    
    // Test active cards
    const { data: activeCards, error: activeError } = await supabase
      .from('hexie_cards')
      .select('id, title, subscription_tier_required, is_active, is_archived')
      .eq('is_active', true)
      .limit(5);
    
    if (activeError) {
      console.error('❌ Active cards access failed:', activeError);
    } else {
      console.log(`✅ Active cards: ${activeCards?.length || 0}`);
    }
    
  } catch (error) {
    console.error('💥 Raw access error:', error);
  }
}

async function runCompleteTest() {
  console.log('🚀 Complete Database Flow Test\n');
  console.log('This tests the exact same flow as the hex-app demo page\n');
  
  // Test raw access first
  await testRawAccess();
  
  // Test the DatabaseService method
  try {
    const result = await testDatabaseServiceMethod();
    
    if (result.length === 0) {
      console.log('\n❌ ISSUE FOUND: No cards returned by DatabaseService method');
      console.log('This explains why the demo page shows fallback data instead of real cards');
      console.log('\nPossible causes:');
      console.log('1. RLS policies are too restrictive for anonymous users');
      console.log('2. No cards match the filter criteria (free + active + not archived)');
      console.log('3. Database connection issue');
      console.log('\nRecommended fix: Apply the RLS policy update in fix-hexie-cards-rls.sql');
    } else {
      console.log('\n✅ SUCCESS: DatabaseService method working correctly!');
      console.log(`Found ${result.length} cards that should appear in the demo`);
    }
    
  } catch (error) {
    console.log('\n❌ CRITICAL ERROR: DatabaseService method failed completely');
    console.error(error);
  }
}

runCompleteTest();