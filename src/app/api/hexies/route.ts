import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use anon client with RLS bypass attempt
const createSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  console.log('Creating Supabase client with anon key...');
  console.log('URL exists:', !!url);
  console.log('Anon key exists:', !!anonKey);
  
  return createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      headers: {
        'Authorization': `Bearer ${anonKey}`,
        'apikey': anonKey
      }
    }
  });
};

const supabase = createSupabaseClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subscription_tier = searchParams.get('subscription_tier') || 'free';
    const limit = parseInt(searchParams.get('limit') || '50');

    console.log('API: Environment check:');
    console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...');
    console.log('Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 30) + '...');
    console.log('API: Fetching hexie cards with anon key');

    const { data, error } = await supabase
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
      .eq('is_active', true)
      .eq('subscription_tier_required', subscription_tier)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('API: Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`API: Successfully fetched ${data?.length || 0} hexie cards`);
    
    // Transform to expected format
    const transformedCards = data?.map(card => ({
      id: card.id,
      title: card.title,
      front_text: card.front_text,
      back_text: card.back_text,
      category: card.category,
      category_name: card.category,
      tags: Array.isArray(card.tags) ? card.tags : [],
      subscription_tier_required: card.subscription_tier_required,
      color_scheme: card.color_scheme || {
        primary: '#6366f1',
        secondary: '#e0e7ff',
        text: '#1f2937'
      },
      created_at: card.created_at,
      updated_at: card.updated_at,
      created_by: 'system',
      is_active: card.is_active,
      references: card.references || [],
      card_references: card.references || []
    })) || [];

    return NextResponse.json({ data: transformedCards });
  } catch (error) {
    console.error('API: Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}