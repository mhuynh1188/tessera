import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get most popular hexie cards by organization
    const { data, error } = await supabase
      .from('card_usage_analytics')
      .select(`
        card_id,
        user_id,
        time_spent_seconds,
        was_helpful,
        created_at,
        hexie_cards!inner (
          id,
          title,
          category,
          hexie_categories (
            name
          )
        )
      `)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (error) {
      console.error('Error fetching content usage:', error);
      return NextResponse.json({ error: 'Failed to fetch content usage' }, { status: 500 });
    }

    // Process the data to calculate usage metrics per card
    const cardUsageMap = new Map();

    data?.forEach(usage => {
      const cardId = usage.card_id;
      const card = usage.hexie_cards;
      
      if (!cardUsageMap.has(cardId)) {
        cardUsageMap.set(cardId, {
          id: cardId,
          title: card.title,
          category: card.category,
          category_name: card.hexie_categories?.name || card.category,
          usage_count: 0,
          unique_users: new Set(),
          total_time: 0,
          helpful_votes: 0,
          not_helpful_votes: 0,
          feedback_count: 0
        });
      }

      const cardStats = cardUsageMap.get(cardId);
      cardStats.usage_count++;
      cardStats.unique_users.add(usage.user_id);
      cardStats.total_time += usage.time_spent_seconds || 0;
      
      if (usage.was_helpful === true) {
        cardStats.helpful_votes++;
        cardStats.feedback_count++;
      } else if (usage.was_helpful === false) {
        cardStats.not_helpful_votes++;
        cardStats.feedback_count++;
      }
    });

    // Convert to array and calculate final metrics
    const contentUsage = Array.from(cardUsageMap.values())
      .map(card => ({
        ...card,
        unique_users: card.unique_users.size,
        avg_time_spent: card.usage_count > 0 ? card.total_time / card.usage_count : 0,
        helpfulness_percentage: card.feedback_count > 0 
          ? (card.helpful_votes / card.feedback_count) * 100 
          : 0
      }))
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, 20); // Top 20 most used cards

    return NextResponse.json(contentUsage);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}