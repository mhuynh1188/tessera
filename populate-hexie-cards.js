const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kpzrjepaqqqdaumegfio.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwenJqZXBhcXFxZGF1bWVnZmlvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODA4Njk4NCwiZXhwIjoyMDYzNjYyOTg0fQ.2Onmj0mT2FCBPTd2stoXlVlwbR8c1Bpm9gK1wQgwMMI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Sample tessera cards matching the database schema
const tesseraCards = [
  {
    title: 'Silent Participants',
    front_text: 'Team members who never speak up in meetings',
    back_text: 'Strategies: Direct questions, breakout rooms, anonymous input tools',
    category: 'Communication',
    tags: ['communication', 'meetings', 'team-dynamics'],
    subscription_tier_required: 'free',
    color_scheme: { primary: '#ef4444', secondary: '#dc2626', text: '#ffffff' },
    is_public: true
  },
  {
    title: 'Information Hoarding',
    front_text: 'Key information is held by single individuals',
    back_text: 'Solutions: Knowledge sharing sessions, documentation requirements, redundancy planning',
    category: 'Communication',
    tags: ['communication', 'information-sharing', 'productivity'],
    subscription_tier_required: 'free',
    color_scheme: { primary: '#f59e0b', secondary: '#d97706', text: '#ffffff' },
    is_public: true
  },
  {
    title: 'Meeting Overload',
    front_text: 'Too many meetings with unclear purposes',
    back_text: 'Solutions: Meeting audits, standing agenda templates, time blocking',
    category: 'Meetings',
    tags: ['meetings', 'productivity', 'time-management'],
    subscription_tier_required: 'free',
    color_scheme: { primary: '#8b5cf6', secondary: '#7c3aed', text: '#ffffff' },
    is_public: true
  },
  {
    title: 'Micromanagement',
    front_text: 'Leaders who control every detail and decision',
    back_text: 'Approaches: Trust-building exercises, delegation frameworks, regular check-ins',
    category: 'Leadership',
    tags: ['leadership', 'management', 'trust'],
    subscription_tier_required: 'free',
    color_scheme: { primary: '#10b981', secondary: '#059669', text: '#ffffff' },
    is_public: true
  },
  {
    title: 'Analysis Paralysis',
    front_text: 'Over-analyzing decisions instead of taking action',
    back_text: 'Methods: Time-boxed decisions, 70% rule, fail-fast mentality',
    category: 'Decision Making',
    tags: ['decision-making', 'productivity', 'problem-solving'],
    subscription_tier_required: 'free',
    color_scheme: { primary: '#06b6d4', secondary: '#0891b2', text: '#ffffff' },
    is_public: true
  },
  {
    title: 'Blame Culture',
    front_text: 'Focus on finding fault rather than solving problems',
    back_text: 'Solutions: Blameless post-mortems, learning culture, psychological safety',
    category: 'Culture',
    tags: ['culture', 'communication', 'psychological-safety'],
    subscription_tier_required: 'free',
    color_scheme: { primary: '#ec4899', secondary: '#db2777', text: '#ffffff' },
    is_public: true
  },
  {
    title: 'Email Overload',
    front_text: 'Excessive email volume hampering productivity',
    back_text: 'Solutions: Email-free time blocks, communication channel guidelines, async tools',
    category: 'Communication',
    tags: ['communication', 'productivity', 'email'],
    subscription_tier_required: 'basic',
    color_scheme: { primary: '#ef4444', secondary: '#dc2626', text: '#ffffff' },
    is_public: true
  },
  {
    title: 'Decision Fatigue',
    front_text: 'Too many decisions overwhelming team members',
    back_text: 'Solutions: Decision hierarchies, automated workflows, delegation matrices',
    category: 'Decision Making',
    tags: ['decision-making', 'workload', 'stress'],
    subscription_tier_required: 'basic',
    color_scheme: { primary: '#06b6d4', secondary: '#0891b2', text: '#ffffff' },
    is_public: true
  },
  {
    title: 'Innovation Theater',
    front_text: 'Surface-level innovation activities without real change',
    back_text: 'Solutions: Outcome-focused metrics, experimentation budget, failure tolerance',
    category: 'Culture',
    tags: ['innovation', 'culture', 'change-management'],
    subscription_tier_required: 'premium',
    color_scheme: { primary: '#ec4899', secondary: '#db2777', text: '#ffffff' },
    is_public: true
  },
  {
    title: 'Expertise Bottleneck',
    front_text: 'Critical knowledge concentrated in one person',
    back_text: 'Solutions: Knowledge transfer sessions, documentation, cross-training',
    category: 'Leadership',
    tags: ['knowledge-sharing', 'risk-management', 'succession-planning'],
    subscription_tier_required: 'premium',
    color_scheme: { primary: '#10b981', secondary: '#059669', text: '#ffffff' },
    is_public: true
  }
];

async function populateHexieCards() {
  console.log('🚀 Starting hexie cards population...\n');
  
  try {
    // First check if cards already exist
    const { count: existingCount } = await supabase
      .from('hexie_cards')
      .select('*', { count: 'exact', head: true });
    
    console.log(`Found ${existingCount || 0} existing hexie cards`);
    
    if (existingCount > 0) {
      console.log('❌ Hexie cards already exist. Skipping population.');
      console.log('💡 If you want to repopulate, first delete existing cards.');
      return;
    }
    
    // Insert tessera cards
    console.log('🃏 Inserting tessera cards...');
    const { data: insertedCards, error: cardsError } = await supabase
      .from('hexie_cards')
      .insert(tesseraCards)
      .select();
      
    if (cardsError) {
      console.error('❌ Error inserting tessera cards:', cardsError);
      return;
    }
    
    console.log(`✅ Successfully inserted ${insertedCards.length} tessera cards`);
    
    // Verify the data
    console.log('\n🔍 Verifying inserted data...');
    
    const { count: cardCount } = await supabase
      .from('hexie_cards')
      .select('*', { count: 'exact', head: true });
    
    const { count: freeCardCount } = await supabase
      .from('hexie_cards')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_tier_required', 'free');
    
    console.log(`Total hexie cards: ${cardCount || 0}`);
    console.log(`Free tier cards: ${freeCardCount || 0}`);
    
    // Test API endpoint
    console.log('\n🔍 Testing API endpoint...');
    try {
      const response = await fetch('http://localhost:3000/api/hexies?subscription_tier=free&limit=50');
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ API endpoint works! Returns ${result.data?.length || 0} cards`);
      } else {
        console.log(`❌ API endpoint failed: ${response.status}`);
      }
    } catch (apiError) {
      console.log('⚠️  Could not test API endpoint (server might not be running)');
    }
    
    console.log('\n🎉 Database population completed successfully!');
    console.log('💡 Now the demo page should load real hexie cards from the database instead of fallback data.');
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

populateHexieCards();