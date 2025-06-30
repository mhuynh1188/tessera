import { useState, useEffect } from 'react';
import { db } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

interface VoteData {
  userVote: 'up' | 'down' | null;
  upvotes: number;
  downvotes: number;
}

export function useVoting(hexieInstanceId: string, userId?: string) {
  const [voteData, setVoteData] = useState<VoteData>({
    userVote: null,
    upvotes: 0,
    downvotes: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  // Load existing votes for this hexie instance
  useEffect(() => {
    loadVotes();
  }, [hexieInstanceId]);

  const loadVotes = async () => {
    try {
      // Get all votes for this hexie instance
      const { data: votes, error } = await db
        .from('hexie_votes')
        .select('*')
        .eq('hexie_instance_id', hexieInstanceId);

      if (error) throw error;

      const upvotes = votes?.filter(v => v.vote_type === 'agree').length || 0;
      const downvotes = votes?.filter(v => v.vote_type === 'disagree').length || 0;
      
      // Find current user's vote if they're logged in
      let userVote: 'up' | 'down' | null = null;
      if (userId) {
        const userVoteRecord = votes?.find(v => v.participant_id === userId);
        if (userVoteRecord) {
          userVote = userVoteRecord.vote_type === 'agree' ? 'up' : 'down';
        }
      }

      setVoteData({ userVote, upvotes, downvotes });
    } catch (error) {
      console.error('Error loading votes:', error);
    }
  };

  const vote = async (voteType: 'up' | 'down') => {
    if (!userId) {
      toast.error('Please log in to vote');
      return;
    }

    if (isLoading) return;

    setIsLoading(true);

    try {
      const voteTypeDb = voteType === 'up' ? 'agree' : 'disagree';

      // Check if user already voted
      const { data: existingVote } = await db
        .from('hexie_votes')
        .select('*')
        .eq('hexie_instance_id', hexieInstanceId)
        .eq('participant_id', userId)
        .single();

      if (existingVote) {
        if (existingVote.vote_type === voteTypeDb) {
          // Same vote - remove it (toggle off)
          const { error } = await db
            .from('hexie_votes')
            .delete()
            .eq('id', existingVote.id);

          if (error) throw error;

          toast.success('Vote removed');
        } else {
          // Different vote - update it
          const { error } = await db
            .from('hexie_votes')
            .update({ 
              vote_type: voteTypeDb,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingVote.id);

          if (error) throw error;

          toast.success(`Vote changed to ${voteType === 'up' ? 'helpful' : 'not helpful'}`);
        }
      } else {
        // New vote
        const { error } = await db
          .from('hexie_votes')
          .insert({
            hexie_instance_id: hexieInstanceId,
            participant_id: userId,
            vote_type: voteTypeDb,
            severity_level: null // Not used for basic voting
          });

        if (error) throw error;

        toast.success(`Voted ${voteType === 'up' ? 'helpful' : 'not helpful'}`);
      }

      // Reload votes to get updated counts
      await loadVotes();
    } catch (error) {
      console.error('Error voting:', error);
      toast.error('Failed to record vote');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    voteData,
    vote,
    isLoading,
    refresh: loadVotes
  };
}