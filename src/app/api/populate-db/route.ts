import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

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

// Sample tessera cards (without references for now - those go in separate table)
const tesseraCards = [
  {
    title: 'Silent Participants',
    front_text: 'Team members who never speak up in meetings',
    back_text: 'Strategies: Direct questions, breakout rooms, anonymous input tools',
    category: 'Communication',
    tags: ['communication', 'meetings', 'team-dynamics'],
    subscription_tier_required: 'free',
    color_scheme: { primary: '#ef4444', secondary: '#dc2626', text: '#ffffff' },
    is_active: true
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
    is_active: true
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

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase admin client not available' }, { status: 500 });
    }

    console.log('🚀 Starting database population...');
    
    // 1. Skip categories since they already exist
    console.log('📁 Skipping categories (already exist in database)...');
    
    // 2. Insert tessera cards
    console.log('🃏 Inserting tessera cards...');
    const { data: insertedCards, error: cardsError } = await supabaseAdmin
      .from('hexie_cards')
      .insert(tesseraCards)
      .select();
      
    if (cardsError) {
      console.error('❌ Error inserting tessera cards:', cardsError);
      return NextResponse.json({ error: 'Failed to insert tessera cards', details: cardsError }, { status: 500 });
    }
    console.log(`✅ Successfully inserted ${insertedCards.length} tessera cards`);
    
    // 3. Verify the data
    console.log('🔍 Verifying inserted data...');
    
    const { count: categoryCount } = await supabaseAdmin
      .from('categories')
      .select('*', { count: 'exact', head: true });
    
    const { count: cardCount } = await supabaseAdmin
      .from('hexie_cards')
      .select('*', { count: 'exact', head: true });
    
    console.log('🎉 Database population completed successfully!');
    
    return NextResponse.json({
      success: true,
      message: 'Database populated successfully',
      data: {
        categoriesInserted: 0, // categories already existed
        cardsInserted: insertedCards.length,
        totalCategories: categoryCount,
        totalCards: cardCount
      }
    });
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
    return NextResponse.json({ error: 'Unexpected error occurred', details: error }, { status: 500 });
  }
}

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase admin client not available' }, { status: 500 });
    }

    // Check current data counts
    const { count: categoryCount } = await supabaseAdmin
      .from('categories')
      .select('*', { count: 'exact', head: true });
    
    const { count: cardCount } = await supabaseAdmin
      .from('hexie_cards')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      currentData: {
        categories: categoryCount || 0,
        cards: cardCount || 0
      },
      needsPopulation: (categoryCount || 0) === 0 || (cardCount || 0) === 0
    });
  } catch (error) {
    console.error('Error checking database:', error);
    return NextResponse.json({ error: 'Failed to check database' }, { status: 500 });
  }
}