const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kpzrjepaqqqdaumegfio.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwenJqZXBhcXFxZGF1bWVnZmlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwODY5ODQsImV4cCI6MjA2MzY2Mjk4NH0.Moc6P8V9t1bht1CHRijk08Cq1-CMYKsm29F2u0-T-YA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection for hex-app...\n');
  
  try {
    // Test the exact query that the demo page uses
    console.log('1. Testing hexie_cards query (exact demo page query):');
    const { data: cards, error: cardsError } = await supabase
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
      `)
      .eq('is_active', true)
      .eq('is_archived', false)
      .eq('subscription_tier_required', 'free')
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (cardsError) {
      console.error('❌ Query failed:', cardsError);
    } else {
      console.log(`✅ Successfully fetched ${cards.length} free, active hexie cards`);
      
      if (cards.length > 0) {
        console.log('\n📋 Sample cards found:');
        cards.slice(0, 5).forEach((card, i) => {
          console.log(`  ${i + 1}. "${card.title}" (${card.category}) - ${card.subscription_tier_required}`);
        });
        
        // Transform and check data format
        console.log('\n🔄 Testing data transformation...');
        const transformedData = cards.map((card) => ({
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
        
        console.log(`✅ Transformation successful. Sample card structure:`);
        console.log(JSON.stringify(transformedData[0], null, 2));
        
      } else {
        console.log('⚠️  No free, active hexie cards found in database');
      }
    }
    
    // Check total counts for debugging
    console.log('\n📊 Database statistics:');
    
    const { count: totalCards } = await supabase
      .from('hexie_cards')
      .select('*', { count: 'exact', head: true });
    
    const { count: activeCards } = await supabase
      .from('hexie_cards')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    
    const { count: freeCards } = await supabase
      .from('hexie_cards')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_tier_required', 'free');
    
    const { count: archivedCards } = await supabase
      .from('hexie_cards')
      .select('*', { count: 'exact', head: true })
      .eq('is_archived', true);
    
    console.log(`  Total cards: ${totalCards || 0}`);
    console.log(`  Active cards: ${activeCards || 0}`);
    console.log(`  Free tier cards: ${freeCards || 0}`);
    console.log(`  Archived cards: ${archivedCards || 0}`);
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

testDatabaseConnection();