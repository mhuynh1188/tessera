const { createClient } = require('@supabase/supabase-js');

const supabase = createClient('https://kpzrjepaqqqdaumegfio.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwenJqZXBhcXFxZGF1bWVnZmlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwODY5ODQsImV4cCI6MjA2MzY2Mjk4NH0.Moc6P8V9t1bht1CHRijk08Cq1-CMYKsm29F2u0-T-YA');

async function checkTables() {
  console.log('Checking for hexie_cards table...');
  try {
    const { data: cards, error: cardsError } = await supabase.from('hexie_cards').select('*').limit(1);
    console.log('hexie_cards table exists:', !cardsError);
    if (cardsError) console.log('hexie_cards error:', cardsError.message);
  } catch (e) {
    console.log('hexie_cards table check failed:', e.message);
  }

  console.log('Checking for hexie_categories table...');
  try {
    const { data: cats, error: catsError } = await supabase.from('hexie_categories').select('*').limit(1);
    console.log('hexie_categories table exists:', !catsError);
    if (catsError) console.log('hexie_categories error:', catsError.message);
  } catch (e) {
    console.log('hexie_categories table check failed:', e.message);
  }

  console.log('Checking for categories table...');
  try {
    const { data: cats2, error: cats2Error } = await supabase.from('categories').select('*').limit(1);
    console.log('categories table exists:', !cats2Error);
    if (cats2Error) console.log('categories error:', cats2Error.message);
  } catch (e) {
    console.log('categories table check failed:', e.message);
  }
}

checkTables().catch(console.error);