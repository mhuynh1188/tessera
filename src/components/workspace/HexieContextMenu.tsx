'use client';

import React, { useState } from 'react';
import { 
  MoreVertical, 
  Star, 
  RotateCcw, 
  Copy, 
  Trash2, 
  ExternalLink,
  AlertTriangle,
  BookOpen,
  Heart,
  MessageSquare,
  Share2,
  Edit,
  ThumbsUp,
  Bookmark,
  Flag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { isFeatureEnabled } from '@/lib/features';
import { useVoting } from '@/hooks/useVoting';
import { useBookmarks } from '@/hooks/useBookmarks';

interface HexieContextMenuProps {
  hexieId: string;
  hexieInstanceId: string; // For voting
  tesseraCardId: string; // For bookmarking
  title: string;
  isVisible: boolean;
  position: { x: number; y: number };
  referenceCount: number;
  annotationCount: number;
  severityScore?: number;
  userTier: 'free' | 'basic' | 'premium';
  userId?: string; // Current user ID
  onClose: () => void;
  onAnnotate: () => void;
  onViewReferences: () => void;
  onRateSeverity: () => void;
  onBookmark?: () => void; // Keep for backward compatibility
  onShare: () => void;
  onEdit: () => void;
  onVote?: (type: 'up' | 'down') => void; // Keep for backward compatibility
  onContest: () => void;
  onDelete?: () => void;
}

export const HexieContextMenu: React.FC<HexieContextMenuProps> = ({
  hexieId,
  hexieInstanceId,
  tesseraCardId,
  title,
  isVisible,
  position,
  referenceCount,
  annotationCount,
  severityScore,
  userTier,
  userId,
  onClose,
  onAnnotate,
  onViewReferences,
  onRateSeverity,
  onBookmark,
  onShare,
  onEdit,
  onVote,
  onContest,
  onDelete
}) => {
  // Use the voting and bookmark hooks
  const { voteData, vote, isLoading: voteLoading } = useVoting(hexieInstanceId, userId);
  const { isBookmarked, toggleBookmark, isLoading: bookmarkLoading } = useBookmarks(userId);
  
  if (!isVisible) return null;

  const getSeverityColor = (severity?: number): string => {
    if (!severity) return 'text-gray-400';
    if (severity <= 1.5) return 'text-green-400';
    if (severity <= 2.5) return 'text-yellow-400';
    if (severity <= 3.5) return 'text-orange-400';
    return 'text-red-400';
  };

  const getSeverityLabel = (severity?: number): string => {
    if (!severity) return 'Unrated';
    if (severity <= 1.5) return 'Low';
    if (severity <= 2.5) return 'Medium';
    if (severity <= 3.5) return 'High';
    return 'Critical';
  };

  return (
    <>
      {/* Backdrop to close menu */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />
      
      {/* Context Menu */}
      <Card 
        data-context-menu="true"
        className="fixed z-50 bg-gray-800/95 border-gray-600 backdrop-blur-xl shadow-xl min-w-[220px] max-w-[280px]"
        style={{
          left: Math.min(position.x, window.innerWidth - 300),
          top: Math.min(position.y, window.innerHeight - 400),
        }}
      >
        <CardContent className="p-3">
          {/* Header */}
          <div className="px-1 py-1 border-b border-gray-600 mb-3">
            <h4 className="text-sm font-medium text-white truncate mb-1">{title}</h4>
            <div className="flex items-center space-x-3 text-xs text-gray-400">
              {annotationCount > 0 && (
                <div className="flex items-center space-x-1">
                  <MessageSquare className="h-3 w-3" />
                  <span>{annotationCount}</span>
                </div>
              )}
              {referenceCount > 0 && (
                <div className="flex items-center space-x-1">
                  <BookOpen className="h-3 w-3" />
                  <span>{referenceCount}</span>
                </div>
              )}
              {severityScore && (
                <div className={`flex items-center space-x-1 ${getSeverityColor(severityScore)}`}>
                  <AlertTriangle className="h-3 w-3" />
                  <span>{getSeverityLabel(severityScore)} ({severityScore.toFixed(1)})</span>
                </div>
              )}
            </div>
          </div>

          {/* Menu Items */}
          <div className="space-y-1">
            {/* Add Annotation */}
            <Button
              onClick={() => { onAnnotate(); onClose(); }}
              variant="ghost"
              size="sm"
              className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-700/50"
            >
              <MessageSquare className="h-4 w-4 mr-3" />
              Add Annotation
              {annotationCount > 0 && (
                <Badge variant="secondary" className="ml-auto text-xs bg-blue-600/20 text-blue-300">
                  {annotationCount}
                </Badge>
              )}
            </Button>

            {/* Rate Severity */}
            <Button
              onClick={() => { onRateSeverity(); onClose(); }}
              variant="ghost"
              size="sm"
              className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-700/50"
            >
              <AlertTriangle className="h-4 w-4 mr-3" />
              Rate Severity
              {severityScore && (
                <Badge 
                  variant="secondary" 
                  className={`ml-auto text-xs ${
                    severityScore <= 1.5 ? 'bg-green-600/20 text-green-300' :
                    severityScore <= 2.5 ? 'bg-yellow-600/20 text-yellow-300' :
                    severityScore <= 3.5 ? 'bg-orange-600/20 text-orange-300' :
                    'bg-red-600/20 text-red-300'
                  }`}
                >
                  {severityScore.toFixed(1)}
                </Badge>
              )}
            </Button>

            {/* View References */}
            <Button
              onClick={() => { onViewReferences(); onClose(); }}
              variant="ghost"
              size="sm"
              className={`w-full justify-start hover:bg-gray-700/50 ${
                referenceCount > 0 
                  ? 'text-gray-300 hover:text-white' 
                  : 'text-gray-500 cursor-not-allowed'
              }`}
              disabled={referenceCount === 0}
            >
              <BookOpen className="h-4 w-4 mr-3" />
              View References
              {referenceCount > 0 && (
                <Badge variant="secondary" className="ml-auto text-xs bg-green-600/20 text-green-300">
                  {referenceCount}
                </Badge>
              )}
            </Button>

            {/* Bookmark */}
            <Button
              onClick={() => { 
                toggleBookmark(tesseraCardId);
                onBookmark?.(); // Call legacy callback if provided
                onClose(); 
              }}
              variant="ghost"
              size="sm"
              className={`w-full justify-start hover:bg-gray-700/50 ${
                isBookmarked(tesseraCardId) 
                  ? 'text-yellow-400 hover:text-yellow-300' 
                  : 'text-gray-300 hover:text-white'
              }`}
              disabled={bookmarkLoading}
            >
              <Bookmark 
                className={`h-4 w-4 mr-3 ${isBookmarked(tesseraCardId) ? 'fill-current' : ''}`} 
              />
              {isBookmarked(tesseraCardId) ? 'Bookmarked' : 'Bookmark'}
            </Button>

            {/* Separator */}
            <div className="border-t border-gray-600 my-2" />

            {/* Share */}
            <Button
              onClick={() => { onShare(); onClose(); }}
              variant="ghost"
              size="sm"
              className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-700/50"
            >
              <Share2 className="h-4 w-4 mr-3" />
              Share Hexie
            </Button>

            {/* Edit - Premium feature */}
            <Button
              onClick={() => { onEdit(); onClose(); }}
              variant="ghost"
              size="sm"
              className={`w-full justify-start hover:bg-gray-700/50 ${
                userTier === 'free' 
                  ? 'text-gray-500 cursor-not-allowed' 
                  : 'text-gray-300 hover:text-white'
              }`}
              disabled={userTier === 'free'}
            >
              <Edit className="h-4 w-4 mr-3" />
              Edit Hexie
              {userTier === 'free' && (
                <Badge variant="secondary" className="ml-auto text-xs bg-purple-600/20 text-purple-300">
                  Pro
                </Badge>
              )}
            </Button>

            {/* Vote - Feature Flag Controlled */}
            {isFeatureEnabled('VOTING_SYSTEM_ENABLED') && (
              <div className="space-y-2">
                <div className="flex space-x-1">
                  <Button
                    onClick={() => { 
                      vote('up'); 
                      onVote?.('up'); // Call legacy callback if provided
                      onClose(); 
                    }}
                    variant="ghost"
                    size="sm"
                    className={`flex-1 justify-center hover:bg-green-500/10 ${
                      voteData.userVote === 'up' 
                        ? 'text-green-400 bg-green-500/20' 
                        : 'text-gray-300 hover:text-green-400'
                    }`}
                    title="Vote helpful"
                    disabled={voteLoading}
                  >
                    <ThumbsUp className="h-4 w-4" />
                    {voteData.upvotes > 0 && (
                      <span className="ml-1 text-xs">{voteData.upvotes}</span>
                    )}
                  </Button>
                  <Button
                    onClick={() => { 
                      vote('down'); 
                      onVote?.('down'); // Call legacy callback if provided
                      onClose(); 
                    }}
                    variant="ghost"
                    size="sm"
                    className={`flex-1 justify-center hover:bg-red-500/10 ${
                      voteData.userVote === 'down' 
                        ? 'text-red-400 bg-red-500/20' 
                        : 'text-gray-300 hover:text-red-400'
                    }`}
                    title="Vote not helpful"
                    disabled={voteLoading}
                  >
                    <ThumbsUp className="h-4 w-4 rotate-180" />
                    {voteData.downvotes > 0 && (
                      <span className="ml-1 text-xs">{voteData.downvotes}</span>
                    )}
                  </Button>
                </div>
                {/* Show vote status */}
                {(voteData.upvotes > 0 || voteData.downvotes > 0) && (
                  <div className="text-xs text-gray-400 text-center">
                    {voteData.upvotes + voteData.downvotes} vote{voteData.upvotes + voteData.downvotes !== 1 ? 's' : ''}
                    {voteData.userVote && (
                      <span className="ml-2 text-blue-400">
                        (You voted {voteData.userVote === 'up' ? 'helpful' : 'not helpful'})
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Contest Card - Feature Flag Controlled */}
            {isFeatureEnabled('CONTEST_SYSTEM_ENABLED') && (
              <Button
                onClick={() => { onContest(); onClose(); }}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-gray-300 hover:text-yellow-400 hover:bg-yellow-500/10"
              >
                <Flag className="h-4 w-4 mr-3" />
                Contest Card
              </Button>
            )}

            {/* Delete - if provided */}
            {onDelete && (
              <>
                <div className="border-t border-gray-600 my-2" />
                <Button
                  onClick={() => { onDelete(); onClose(); }}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20"
                >
                  <Trash2 className="h-4 w-4 mr-3" />
                  Remove from Workspace
                </Button>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="mt-3 pt-2 border-t border-gray-600">
            <p className="text-xs text-gray-500 text-center">
              Right-click menu • Press Esc to close
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default HexieContextMenu;