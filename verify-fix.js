const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kpzrjepaqqqdaumegfio.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwenJqZXBhcXFxZGF1bWVnZmlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwODY5ODQsImV4cCI6MjA2MzY2Mjk4NH0.Moc6P8V9t1bht1CHRijk08Cq1-CMYKsm29F2u0-T-YA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyFix() {
  console.log('✅ Verifying RLS fix...\n');
  
  try {
    // Test the exact demo page query
    const { data: cards, error } = await supabase
      .from('hexie_cards')
      .select(`
        id, title, front_text, back_text, category, subcategory,
        color_scheme, icon_svg, subscription_tier_required, is_active,
        created_by, created_at, updated_at, references, card_references,
        tags, severity_rating, psychological_framework
      `)
      .eq('subscription_tier_required', 'free')
      .eq('is_active', true)
      .eq('is_archived', false)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('❌ Still failing:', error);
      return;
    }
    
    console.log(`🎉 SUCCESS! Found ${cards.length} free hexie cards!`);
    
    if (cards.length > 0) {
      console.log('\n📋 Cards that will now appear in demo:');
      cards.forEach((card, i) => {
        console.log(`  ${i + 1}. "${card.title}" (${card.category})`);
      });
      
      console.log('\n✅ The demo page should now show real database cards instead of fallback data!');
      console.log('🚀 Try refreshing http://localhost:3000/demo');
    } else {
      console.log('⚠️  RLS is working but no cards match the criteria. Check if cards exist with:');
      console.log('   - subscription_tier_required = \'free\'');
      console.log('   - is_active = true'); 
      console.log('   - is_archived = false');
    }
    
  } catch (error) {
    console.error('💥 Error:', error);
  }
}

verifyFix();