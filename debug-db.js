const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kpzrjepaqqqdaumegfio.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwenJqZXBhcXFxZGF1bWVnZmlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwODY5ODQsImV4cCI6MjA2MzY2Mjk4NH0.Moc6P8V9t1bht1CHRijk08Cq1-CMYKsm29F2u0-T-YA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugDatabase() {
  console.log('=== DEBUGGING DATABASE ===\n');
  
  // Check hexie_cards table
  console.log('1. Checking hexie_cards table:');
  try {
    const { data: cards, error: cardsError } = await supabase
      .from('hexie_cards')
      .select('*')
      .limit(5);
    
    if (cardsError) {
      console.error('Error fetching hexie_cards:', cardsError);
    } else {
      console.log(`Found ${cards?.length || 0} hexie_cards`);
      if (cards && cards.length > 0) {
        console.log('Sample card:', JSON.stringify(cards[0], null, 2));
      }
    }
  } catch (error) {
    console.error('Exception fetching hexie_cards:', error.message);
  }
  
  console.log('\n2. Checking hexie_categories table:');
  try {
    const { data: categories, error: categoriesError } = await supabase
      .from('hexie_categories')
      .select('*')
      .limit(5);
    
    if (categoriesError) {
      console.error('Error fetching hexie_categories:', categoriesError);
    } else {
      console.log(`Found ${categories?.length || 0} hexie_categories`);
      if (categories && categories.length > 0) {
        console.log('Sample category:', JSON.stringify(categories[0], null, 2));
      }
    }
  } catch (error) {
    console.error('Exception fetching hexie_categories:', error.message);
  }
  
  // Check table counts
  console.log('\n3. Getting table counts:');
  try {
    const { count: cardCount } = await supabase
      .from('hexie_cards')
      .select('*', { count: 'exact', head: true });
    console.log(`Total hexie_cards: ${cardCount || 0}`);
    
    const { count: categoryCount } = await supabase
      .from('hexie_categories')
      .select('*', { count: 'exact', head: true });
    console.log(`Total hexie_categories: ${categoryCount || 0}`);
  } catch (error) {
    console.error('Exception getting counts:', error.message);
  }
  
  // Check for any sample data we can use
  console.log('\n4. Checking for existing data structure:');
  try {
    const { data: schema } = await supabase.rpc('get_columns_for_table', { table_name: 'hexie_cards' });
    console.log('hexie_cards table structure:', schema);
  } catch (error) {
    console.log('Could not get table structure');
  }
}

debugDatabase().catch(console.error);