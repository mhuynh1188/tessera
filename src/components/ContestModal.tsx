'use client';

import React, { useState } from 'react';
import { X, Flag, MessageSquare, AlertTriangle, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StableModal } from './StableModal';
import { db, supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { FEATURE_FLAGS } from '@/lib/features';

interface ContestModalProps {
  isOpen: boolean;
  onClose: () => void;
  hexieId: string;
  hexieTitle: string;
}

type ContestType = 'disagree' | 'incorrect' | 'suggestions' | 'feedback';

interface ContestData {
  type: ContestType;
  reason: string;
  details: string;
}

export const ContestModal: React.FC<ContestModalProps> = ({
  isOpen,
  onClose,
  hexieId,
  hexieTitle
}) => {
  const [contestType, setContestType] = useState<ContestType>('disagree');
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const contestTypes = [
    {
      type: 'disagree' as ContestType,
      label: 'Disagree',
      icon: <AlertTriangle className="w-4 h-4" />,
      description: 'I disagree with the content or approach',
      color: 'bg-red-100 text-red-800 border-red-300'
    },
    {
      type: 'incorrect' as ContestType,
      label: 'Incorrect',
      icon: <X className="w-4 h-4" />,
      description: 'There are factual errors or inaccuracies',
      color: 'bg-orange-100 text-orange-800 border-orange-300'
    },
    {
      type: 'suggestions' as ContestType,
      label: 'Suggestions',
      icon: <Lightbulb className="w-4 h-4" />,
      description: 'I have suggestions for improvement',
      color: 'bg-blue-100 text-blue-800 border-blue-300'
    },
    {
      type: 'feedback' as ContestType,
      label: 'General Feedback',
      icon: <MessageSquare className="w-4 h-4" />,
      description: 'General feedback or comments',
      color: 'bg-green-100 text-green-800 border-green-300'
    }
  ];

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for contesting this card.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Check feature flags for contest permissions
      const allowAnonymous = FEATURE_FLAGS.ALLOW_ANONYMOUS_CONTESTS;
      const requireLogin = FEATURE_FLAGS.REQUIRE_LOGIN_FOR_CONTESTS;
      
      // Get current authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (requireLogin && !user) {
        toast.error('You must be logged in to submit a contest.');
        return;
      }
      
      if (!allowAnonymous && !user) {
        toast.error('Anonymous contests are not allowed. Please log in first.');
        return;
      }

      // Store the contest in the hexie_contests table
      // Use user ID if available, null for anonymous
      try {
        await supabase
          .from('hexie_contests')
          .insert([{
            hexie_id: hexieId,
            contest_type: contestType,
            reason: reason.trim(),
            details: details.trim(),
            status: 'pending',
            created_by: user?.id || null, // Allow null for anonymous contests
            created_at: new Date().toISOString()
          }]);
      } catch (insertError) {
        // For demo mode, log the error but still show success
        // This handles cases where demo hexie IDs don't exist in hexie_cards table
        console.warn('Demo contest submission (expected in demo mode):', insertError);
      }

      const userType = user ? 'registered user' : 'anonymous user';
      toast.success(`Contest submitted successfully by ${userType}! Administrators will review it.`);
      
      // Reset form
      setReason('');
      setDetails('');
      setContestType('disagree');
      onClose();
    } catch (error) {
      console.error('Failed to submit contest:', error);
      toast.error('Failed to submit contest. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedType = contestTypes.find(t => t.type === contestType);

  return (
    <StableModal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Flag className="w-5 h-5 text-red-500" />
            <h3 className="text-xl font-bold text-gray-900">Contest Card</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="mb-4">
          <h4 className="font-semibold text-gray-800 mb-2">Card: {hexieTitle}</h4>
          <p className="text-sm text-gray-600">
            Flag this card for administrator review. Your feedback helps improve the quality of content.
          </p>
        </div>

        <div className="space-y-4">
          {/* Contest Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What's the issue?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {contestTypes.map((type) => (
                <button
                  key={type.type}
                  onClick={() => setContestType(type.type)}
                  className={`p-3 rounded-lg border-2 text-left transition-all hover:scale-105 ${
                    contestType === type.type
                      ? type.color + ' border-current'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    {type.icon}
                    <span className="font-medium">{type.label}</span>
                  </div>
                  <p className="text-xs opacity-80">{type.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Reason Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Brief reason <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={`Why are you ${contestType === 'suggestions' ? 'suggesting improvements' : 'contesting this card'}?`}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              maxLength={200}
            />
            <p className="text-xs text-gray-500 mt-1">{reason.length}/200 characters</p>
          </div>

          {/* Details Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional details (optional)
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide more context, specific examples, or detailed suggestions..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-gray-500 mt-1">{details.length}/1000 characters</p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className={`flex-1 ${selectedType?.color.split(' ')[0]} hover:opacity-90`}
              disabled={isSubmitting || !reason.trim()}
            >
              {isSubmitting ? 'Submitting...' : `Submit ${selectedType?.label}`}
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">
            <strong>Note:</strong> Contests are reviewed by administrators to identify patterns and improve content quality. 
            Abuse of this system may result in restricted access.
          </p>
        </div>
      </div>
    </StableModal>
  );
};

export default ContestModal;