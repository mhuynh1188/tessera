const { createClient } = require('@supabase/supabase-js');

const supabase = createClient('https://kpzrjepaqqqdaumegfio.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwenJqZXBhcXFxZGF1bWVnZmlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwODY5ODQsImV4cCI6MjA2MzY2Mjk4NH0.Moc6P8V9t1bht1CHRijk08Cq1-CMYKsm29F2u0-T-YA');

async function checkWorkspaces() {
  console.log('Checking workspaces table...');
  try {
    const { data, error } = await supabase.from('workspaces').select('*').limit(1);
    if (error) {
      console.log('Error accessing workspaces:', error.message);
    } else {
      console.log('Workspaces table accessible');
      if (data && data.length > 0) {
        console.log('Workspaces columns:', Object.keys(data[0]));
        console.log('Sample workspace:', data[0]);
      } else {
        console.log('Workspaces table is empty');
      }
    }
  } catch (e) {
    console.log('Workspaces error:', e.message);
  }

  // Check users table
  console.log('\nChecking users table...');
  try {
    const { data, error } = await supabase.from('users').select('*').limit(1);
    if (error) {
      console.log('Error accessing users:', error.message);
    } else {
      console.log('Users table accessible');
      if (data && data.length > 0) {
        console.log('Users columns:', Object.keys(data[0]));
      } else {
        console.log('Users table is empty');
      }
    }
  } catch (e) {
    console.log('Users error:', e.message);
  }
}

checkWorkspaces();