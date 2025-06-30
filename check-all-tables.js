const { createClient } = require('@supabase/supabase-js');

const supabase = createClient('https://kpzrjepaqqqdaumegfio.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwenJqZXBhcXFxZGF1bWVnZmlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwODY5ODQsImV4cCI6MjA2MzY2Mjk4NH0.Moc6P8V9t1bht1CHRijk08Cq1-CMYKsm29F2u0-T-YA');

async function checkAllTables() {
  console.log('Testing various table names for hexie data...\n');
  
  const tablesToTest = [
    'hexie_cards',
    'hexie_categories', 
    'categories',
    'tessera_cards',
    'tessera_categories'
  ];
  
  for (const tableName of tablesToTest) {
    try {
      console.log(`Testing table: ${tableName}`);
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`  ❌ Error: ${error.message}`);
      } else {
        console.log(`  ✅ Table exists with ${count || 0} rows`);
        
        // If table exists and has data, show a few sample rows
        if (count > 0) {
          const { data: sample } = await supabase
            .from(tableName)
            .select('*')
            .limit(2);
          console.log(`  📝 Sample data:`, sample?.map(row => ({ id: row.id, title: row.title || row.name, ...row })));
        }
      }
    } catch (e) {
      console.log(`  💥 Failed to test ${tableName}:`, e.message);
    }
    console.log('');
  }
}

checkAllTables().catch(console.error);