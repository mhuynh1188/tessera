import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tier = searchParams.get('tier') || 'free';
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log('Public API: Fetching cards with params:', { tier, category, limit, offset });

    // Build query for free tier cards (no authentication required)
    let query = supabase
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
        tags,
        hexie_categories (
          name
        )
      `)
      .eq('is_active', true);

    // For demo/public access, only show free tier cards
    if (tier === 'free') {
      query = query.eq('subscription_tier_required', 'free');
    } else {
      // For non-free tiers, would need authentication
      return NextResponse.json({ 
        error: 'Authentication required for non-free content' 
      }, { status: 401 });
    }

    if (category) {
      query = query.eq('category', category);
    }

    // Apply pagination
    query = query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    const { data: cards, error } = await query;

    if (error) {
      console.error('Error fetching cards:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch cards',
        details: error.message 
      }, { status: 500 });
    }

    console.log(`Public API: Successfully fetched ${cards?.length || 0} cards`);

    // Transform data to match expected format
    const transformedCards = cards?.map(card => ({
      id: card.id,
      title: card.title,
      front_text: card.front_text,
      back_text: card.back_text,
      category: card.category,
      category_name: card.hexie_categories?.name || card.category,
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
      references: card.references || []
    })) || [];

    return NextResponse.json({
      cards: transformedCards,
      total: transformedCards.length,
      page: Math.floor(offset / limit) + 1,
      limit,
      tier
    });

  } catch (error) {
    console.error('Unexpected error in public cards API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      tier = 'free', 
      category, 
      search, 
      limit = 50, 
      offset = 0,
      user_id,
      email 
    } = body;

    console.log('Public API POST: Fetching cards with body:', { tier, category, search, limit, offset });

    // For demo access, only allow free tier without user validation
    if (tier !== 'free') {
      return NextResponse.json({ 
        error: 'Demo access limited to free tier content' 
      }, { status: 403 });
    }

    // Build query for free cards
    let query = supabase
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
        tags,
        hexie_categories (
          name
        )
      `)
      .eq('is_active', true)
      .eq('subscription_tier_required', 'free');

    if (category) {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,front_text.ilike.%${search}%,back_text.ilike.%${search}%`);
    }

    // Apply pagination
    query = query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    const { data: cards, error } = await query;

    if (error) {
      console.error('Error fetching cards:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch cards',
        details: error.message 
      }, { status: 500 });
    }

    console.log(`Public API POST: Successfully fetched ${cards?.length || 0} cards`);

    // Transform data to match expected format
    const transformedCards = cards?.map(card => ({
      id: card.id,
      title: card.title,
      front_text: card.front_text,
      back_text: card.back_text,
      category: card.category,
      category_name: card.hexie_categories?.name || card.category,
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
      references: card.references || []
    })) || [];

    return NextResponse.json({
      success: true,
      cards: transformedCards,
      total: transformedCards.length,
      page: Math.floor(offset / limit) + 1,
      limit,
      tier,
      message: `Found ${transformedCards.length} free hexie cards`
    });

  } catch (error) {
    console.error('Unexpected error in public cards API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}