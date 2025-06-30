const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kpzrjepaqqqdaumegfio.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwenJqZXBhcXFxZGF1bWVnZmlvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODA4Njk4NCwiZXhwIjoyMDYzNjYyOTg0fQ.2Onmj0mT2FCBPTd2stoXlVlwbR8c1Bpm9gK1wQgwMM';

// Try with anon key first
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwenJqZXBhcXFxZGF1bWVnZmlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwODY5ODQsImV4cCI6MjA2MzY2Mjk4NH0.Moc6P8V9t1bht1CHRijk08Cq1-CMYKsm29F2u0-T-YA';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Sample categories
const categories = [
  {
    name: 'Communication',
    description: 'Issues related to team communication and information sharing',
    color: '#ef4444',
    is_active: true,
    sort_order: 1
  },
  {
    name: 'Leadership',
    description: 'Leadership and management-related antipatterns',
    color: '#10b981',
    is_active: true,
    sort_order: 2
  },
  {
    name: 'Meetings',
    description: 'Meeting-related inefficiencies and problems',
    color: '#8b5cf6',
    is_active: true,
    sort_order: 3
  },
  {
    name: 'Culture',
    description: 'Organizational culture and team dynamics issues',
    color: '#ec4899',
    is_active: true,
    sort_order: 4
  },
  {
    name: 'Decision Making',
    description: 'Decision-making processes and related challenges',
    color: '#06b6d4',
    is_active: true,
    sort_order: 5
  },
  {
    name: 'Productivity',
    description: 'Productivity and workflow-related issues',
    color: '#f59e0b',
    is_active: true,
    sort_order: 6
  }
];

// Sample tessera cards
const tesseraCards = [
  {
    title: 'Silent Participants',
    front_text: 'Team members who never speak up in meetings',
    back_text: 'Strategies: Direct questions, breakout rooms, anonymous input tools',
    category: 'Communication',
    tags: ['communication', 'meetings', 'team-dynamics'],
    subscription_tier_required: 'free',
    color_scheme: { primary: '#ef4444', secondary: '#dc2626', text: '#ffffff' },
    is_active: true,
    references: [
      {
        id: 'ref-1',
        title: 'The Silent Treatment: Why Some Team Members Don\'t Speak Up',
        url: 'https://hbr.org/2019/06/the-silent-treatment',
        type: 'article',
        authors: 'Amy Edmondson',
        publication: 'Harvard Business Review',
        year: 2019,
        description: 'Research on psychological safety and how to encourage participation in team meetings.'
      }
    ]
  },
  {
    title: 'Information Hoarding',
    front_text: 'Key information is held by single individuals',
    back_text: 'Solutions: Knowledge sharing sessions, documentation requirements, redundancy planning',
    category: 'Communication',
    tags: ['communication', 'information-sharing', 'productivity'],
    subscription_tier_required: 'free',
    color_scheme: { primary: '#f59e0b', secondary: '#d97706', text: '#ffffff' },
    is_active: true
  },
  {
    title: 'Meeting Overload',
    front_text: 'Too many meetings with unclear purposes',
    back_text: 'Solutions: Meeting audits, standing agenda templates, time blocking',
    category: 'Meetings',
    tags: ['meetings', 'productivity', 'time-management'],
    subscription_tier_required: 'free',
    color_scheme: { primary: '#8b5cf6', secondary: '#7c3aed', text: '#ffffff' },
    is_active: true
  },
  {
    title: 'Micromanagement',
    front_text: 'Leaders who control every detail and decision',
    back_text: 'Approaches: Trust-building exercises, delegation frameworks, regular check-ins',
    category: 'Leadership',
    tags: ['leadership', 'management', 'trust'],
    subscription_tier_required: 'free',
    color_scheme: { primary: '#10b981', secondary: '#059669', text: '#ffffff' },
    is_active: true,
    references: [
      {
        id: 'ref-3',
        title: 'The Micromanagement Trap: How to Avoid It and Lead Effectively',
        url: 'https://www.mckinsey.com/business-functions/people-and-organizational-performance/our-insights/the-micromanagement-trap',
        type: 'article',
        authors: 'McKinsey & Company',
        publication: 'McKinsey Insights',
        year: 2020,
        description: 'Practical strategies for leaders to overcome micromanagement tendencies.'
      }
    ]
  },
  {
    title: 'Analysis Paralysis',
    front_text: 'Over-analyzing decisions instead of taking action',
    back_text: 'Methods: Time-boxed decisions, 70% rule, fail-fast mentality',
    category: 'Decision Making',
    tags: ['decision-making', 'productivity', 'problem-solving'],
    subscription_tier_required: 'free',
    color_scheme: { primary: '#06b6d4', secondary: '#0891b2', text: '#ffffff' },
    is_active: true
  },
  {
    title: 'Blame Culture',
    front_text: 'Focus on finding fault rather than solving problems',
    back_text: 'Solutions: Blameless post-mortems, learning culture, psychological safety',
    category: 'Culture',
    tags: ['culture', 'communication', 'psychological-safety'],
    subscription_tier_required: 'free',
    color_scheme: { primary: '#ec4899', secondary: '#db2777', text: '#ffffff' },
    is_active: true
  },
  {
    title: 'Email Overload',
    front_text: 'Excessive email volume hampering productivity',
    back_text: 'Solutions: Email-free time blocks, communication channel guidelines, async tools',
    category: 'Communication',
    tags: ['communication', 'productivity', 'email'],
    subscription_tier_required: 'basic',
    color_scheme: { primary: '#ef4444', secondary: '#dc2626', text: '#ffffff' },
    is_active: true
  },
  {
    title: 'Decision Fatigue',
    front_text: 'Too many decisions overwhelming team members',
    back_text: 'Solutions: Decision hierarchies, automated workflows, delegation matrices',
    category: 'Decision Making',
    tags: ['decision-making', 'workload', 'stress'],
    subscription_tier_required: 'basic',
    color_scheme: { primary: '#06b6d4', secondary: '#0891b2', text: '#ffffff' },
    is_active: true
  },
  {
    title: 'Innovation Theater',
    front_text: 'Surface-level innovation activities without real change',
    back_text: 'Solutions: Outcome-focused metrics, experimentation budget, failure tolerance',
    category: 'Culture',
    tags: ['innovation', 'culture', 'change-management'],
    subscription_tier_required: 'premium',
    color_scheme: { primary: '#ec4899', secondary: '#db2777', text: '#ffffff' },
    is_active: true
  },
  {
    title: 'Expertise Bottleneck',
    front_text: 'Critical knowledge concentrated in one person',
    back_text: 'Solutions: Knowledge transfer sessions, documentation, cross-training',
    category: 'Leadership',
    tags: ['knowledge-sharing', 'risk-management', 'succession-planning'],
    subscription_tier_required: 'premium',
    color_scheme: { primary: '#10b981', secondary: '#059669', text: '#ffffff' },
    is_active: true
  }
];

async function populateDatabase() {
  console.log('🚀 Starting database population...\n');
  
  try {
    // 1. Insert categories first
    console.log('📁 Inserting categories...');
    const { data: insertedCategories, error: categoriesError } = await supabase
      .from('hexie_categories')
      .insert(categories)
      .select();
      
    if (categoriesError) {
      console.error('❌ Error inserting categories:', categoriesError);
      return;
    }
    console.log(`✅ Successfully inserted ${insertedCategories.length} categories`);
    
    // 2. Insert tessera cards
    console.log('\n🃏 Inserting tessera cards...');
    const { data: insertedCards, error: cardsError } = await supabase
      .from('hexie_cards')
      .insert(tesseraCards)
      .select();
      
    if (cardsError) {
      console.error('❌ Error inserting tessera cards:', cardsError);
      return;
    }
    console.log(`✅ Successfully inserted ${insertedCards.length} tessera cards`);
    
    // 3. Verify the data
    console.log('\n🔍 Verifying inserted data...');
    
    const { count: categoryCount } = await supabase
      .from('hexie_categories')
      .select('*', { count: 'exact', head: true });
    console.log(`📊 Total categories in database: ${categoryCount}`);
    
    const { count: cardCount } = await supabase
      .from('hexie_cards')
      .select('*', { count: 'exact', head: true });
    console.log(`📊 Total tessera cards in database: ${cardCount}`);
    
    // 4. Show breakdown by subscription tier
    console.log('\n📈 Cards by subscription tier:');
    for (const tier of ['free', 'basic', 'premium']) {
      const { count } = await supabase
        .from('hexie_cards')
        .select('*', { count: 'exact', head: true })
        .eq('subscription_tier_required', tier);
      console.log(`  ${tier}: ${count} cards`);
    }
    
    console.log('\n🎉 Database population completed successfully!');
    console.log('💡 You can now refresh your tessera app to see the cards loaded from the database.');
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

populateDatabase();