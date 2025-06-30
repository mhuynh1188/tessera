const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kpzrjepaqqqdaumegfio.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwenJqZXBhcXFxZGF1bWVnZmlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwODY5ODQsImV4cCI6MjA2MzY2Mjk4NH0.Moc6P8V9t1bht1CHRijk08Cq1-CMYKsm29F2u0-T-YA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkHexieCardsSchema() {
  console.log('🔍 Checking hexie_cards table schema and data...\n');
  
  try {
    // Try to get any records to see the actual schema
    console.log('1. Checking current hexie_cards structure:');
    const { data: cards, error: cardsError } = await supabase
      .from('hexie_cards')
      .select('*')
      .limit(1);
    
    if (cardsError) {
      console.error('❌ Error accessing hexie_cards:', cardsError);
    } else {
      console.log('✅ hexie_cards table accessible');
      if (cards && cards.length > 0) {
        console.log('Sample record structure:', Object.keys(cards[0]));
        console.log('Sample record:', cards[0]);
      } else {
        console.log('Table is empty');
      }
    }
    
    // Check if there's a different table that might have data
    console.log('\n2. Checking for alternative table names:');
    const alternativeTables = ['tessera_cards', 'cards', 'antipatterns', 'patterns'];
    
    for (const tableName of alternativeTables) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (!error && count > 0) {
          console.log(`✅ Found data in ${tableName}: ${count} records`);
          
          // Get sample data to see structure
          const { data: sampleData } = await supabase
            .from(tableName)
            .select('*')
            .limit(2);
          
          if (sampleData && sampleData.length > 0) {
            console.log(`   Sample ${tableName} columns:`, Object.keys(sampleData[0]));
            console.log(`   Sample record:`, sampleData[0]);
          }
        }
      } catch (e) {
        // Table doesn't exist, skip
      }
    }
    
    // Check if the column names match what the API expects
    console.log('\n3. Testing API query structure:');
    const { data: testQuery, error: testError } = await supabase
      .from('hexie_cards')
      .select(`
        id,
        title,
        front_text,
        back_text,
        category,
        color_scheme,
        subscription_tier_required,
        is_active,
        created_at,
        updated_at,
        references,
        tags
      `)
      .limit(1);
    
    if (testError) {
      console.log('❌ API query structure has issues:', testError.message);
      // Try alternative column names
      console.log('   Trying alternative column names...');
      
      const alternatives = [
        'is_public', // instead of is_active
        'is_enabled', // instead of is_active
        'content', // instead of front_text/back_text
        'description' // instead of back_text
      ];
      
      for (const altColumn of alternatives) {
        try {
          const { error: altError } = await supabase
            .from('hexie_cards')
            .select(altColumn)
            .limit(1);
          
          if (!altError) {
            console.log(`   ✅ Column ${altColumn} exists`);
          }
        } catch (e) {
          // Column doesn't exist
        }
      }
    } else {
      console.log('✅ API query structure works');
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

checkHexieCardsSchema();