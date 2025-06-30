import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get search events
    const { data: searchEvents, error } = await supabase
      .from('analytics_events')
      .select(`
        user_id,
        session_id,
        event_data,
        created_at
      `)
      .eq('event_type', 'search')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .not('event_data->search_term', 'is', null);

    if (error) {
      console.error('Error fetching search events:', error);
      return NextResponse.json({ error: 'Failed to fetch search data' }, { status: 500 });
    }

    // Get subsequent card view events to determine search success
    const { data: cardViewEvents, error: cardViewError } = await supabase
      .from('analytics_events')
      .select(`
        user_id,
        session_id,
        created_at
      `)
      .eq('event_type', 'card_view')
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (cardViewError) {
      console.error('Error fetching card view events:', cardViewError);
    }

    // Process search terms and calculate success rates
    const searchTermMap = new Map();

    searchEvents?.forEach(searchEvent => {
      const searchTerm = searchEvent.event_data?.search_term;
      if (!searchTerm || searchTerm.length < 3) return; // Filter short terms

      const normalizedTerm = searchTerm.toLowerCase().trim();
      
      if (!searchTermMap.has(normalizedTerm)) {
        searchTermMap.set(normalizedTerm, {
          search_term: normalizedTerm,
          search_count: 0,
          unique_searchers: new Set(),
          successful_searches: 0,
          search_events: []
        });
      }

      const termStats = searchTermMap.get(normalizedTerm);
      termStats.search_count++;
      termStats.unique_searchers.add(searchEvent.user_id);
      termStats.search_events.push({
        user_id: searchEvent.user_id,
        session_id: searchEvent.session_id,
        created_at: new Date(searchEvent.created_at)
      });
    });

    // Calculate search success rates
    searchTermMap.forEach((termStats, term) => {
      termStats.search_events.forEach(searchEvent => {
        // Check if there was a card view within 5 minutes of this search
        const fiveMinutesLater = new Date(searchEvent.created_at.getTime() + 5 * 60 * 1000);
        
        const hasSubsequentView = cardViewEvents?.some(cardView => 
          cardView.user_id === searchEvent.user_id &&
          cardView.session_id === searchEvent.session_id &&
          new Date(cardView.created_at) >= searchEvent.created_at &&
          new Date(cardView.created_at) <= fiveMinutesLater
        );

        if (hasSubsequentView) {
          termStats.successful_searches++;
        }
      });

      // Convert unique searchers set to count
      termStats.unique_searchers = termStats.unique_searchers.size;
      
      // Calculate success rate percentage
      termStats.success_rate_pct = termStats.search_count > 0
        ? Math.round((termStats.successful_searches / termStats.search_count) * 1000) / 10
        : 0;

      // Clean up temporary data
      delete termStats.search_events;
    });

    // Convert to array and sort by popularity
    const searchTerms = Array.from(searchTermMap.values())
      .filter(term => term.search_count >= 3) // Only show terms searched at least 3 times
      .sort((a, b) => b.search_count - a.search_count)
      .slice(0, 25); // Top 25 search terms

    return NextResponse.json(searchTerms);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}