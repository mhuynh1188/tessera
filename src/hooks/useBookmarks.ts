import { useState, useEffect } from 'react';
import { db } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

export function useBookmarks(userId?: string) {
  const [bookmarkedCards, setBookmarkedCards] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      loadBookmarks();
    }
  }, [userId]);

  const loadBookmarks = async () => {
    if (!userId) return;

    try {
      // Load all bookmarked cards for this user
      const { data: bookmarks, error } = await db
        .from('favorites')
        .select('tessera_card_id')
        .eq('user_id', userId);

      if (error) throw error;

      const bookmarkedSet = new Set(
        bookmarks?.map(b => b.tessera_card_id) || []
      );
      setBookmarkedCards(bookmarkedSet);
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    }
  };

  const toggleBookmark = async (tesseraCardId: string) => {
    if (!userId) {
      toast.error('Please log in to bookmark cards');
      return;
    }

    if (isLoading) return;

    setIsLoading(true);

    try {
      const isBookmarked = bookmarkedCards.has(tesseraCardId);

      if (isBookmarked) {
        // Remove bookmark
        const { error } = await db
          .from('favorites')
          .delete()
          .eq('user_id', userId)
          .eq('tessera_card_id', tesseraCardId);

        if (error) throw error;

        const newBookmarks = new Set(bookmarkedCards);
        newBookmarks.delete(tesseraCardId);
        setBookmarkedCards(newBookmarks);
        
        toast.success('Bookmark removed');
      } else {
        // Add bookmark
        const { error } = await db
          .from('favorites')
          .insert({
            user_id: userId,
            tessera_card_id: tesseraCardId,
            created_at: new Date().toISOString()
          });

        if (error) throw error;

        const newBookmarks = new Set(bookmarkedCards);
        newBookmarks.add(tesseraCardId);
        setBookmarkedCards(newBookmarks);
        
        toast.success('Card bookmarked');
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      toast.error('Failed to update bookmark');
    } finally {
      setIsLoading(false);
    }
  };

  const isBookmarked = (tesseraCardId: string) => {
    return bookmarkedCards.has(tesseraCardId);
  };

  return {
    isBookmarked,
    toggleBookmark,
    isLoading,
    refresh: loadBookmarks
  };
}