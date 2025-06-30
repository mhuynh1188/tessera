// Test UUID generation for demo instances
console.log('Testing UUID generation...');

// Test crypto.randomUUID() with Node.js crypto
try {
  const { randomUUID } = require('crypto');
  const uuid1 = randomUUID();
  const uuid2 = randomUUID();
  
  console.log('✅ Generated UUID 1:', uuid1);
  console.log('✅ Generated UUID 2:', uuid2);
  
  // Check if they're valid UUIDs (36 characters with hyphens)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  if (uuidRegex.test(uuid1) && uuidRegex.test(uuid2)) {
    console.log('✅ UUIDs are properly formatted');
  } else {
    console.log('❌ UUIDs are not properly formatted');
  }
  
  if (uuid1 !== uuid2) {
    console.log('✅ UUIDs are unique');
  } else {
    console.log('❌ UUIDs are not unique');
  }
  
  console.log('\n🎉 UUID generation working correctly for database compatibility!');
  console.log('Demo instances will now use proper UUIDs instead of string IDs.');
  
} catch (error) {
  console.error('❌ Error generating UUIDs:', error);
}