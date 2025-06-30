'use client';

import React, { useState } from 'react';
import { RotateCcw, ExternalLink, X, BookOpen, Youtube, Headphones, FileText, Library, Globe, Video, Microscope } from 'lucide-react';
import { HexieReference } from '@/types';
import { StableModal } from './StableModal';

interface HexagonShapeProps {
  size?: number;
  color?: string;
  borderColor?: string;
  shadowColor?: string;
  title?: string;
  frontText?: string;
  backText?: string;
  references?: HexieReference[];
  className?: string;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onDelete?: () => void;
  isFlipped?: boolean;
  onFlip?: () => void;
  showDelete?: boolean;
  showFlipButton?: boolean;
  showReferencesButton?: boolean;
  onAddToWorkspace?: () => void;
}

// Helper function to truncate text to fit in hexagon
const truncateText = (text: string | undefined | null, maxLength: number) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

export const HexagonShape: React.FC<HexagonShapeProps> = ({
  size = 140,
  color = '#3b82f6',
  borderColor = '#1e40af',
  shadowColor = 'rgba(59, 130, 246, 0.3)',
  title = '',
  frontText = '',
  backText = '',
  references = [],
  className = '',
  style = {},
  onClick,
  onMouseDown,
  onDoubleClick,
  onContextMenu,
  onDelete,
  isFlipped = false,
  onFlip,
  showDelete = false,
  showFlipButton = false,
  showReferencesButton = false
}) => {
  const [showReferences, setShowReferences] = useState(false);
  
  // Perfect regular hexagon centered in the square
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.45; // Increased radius to reduce padding
  
  // Create a perfect regular hexagon with proper angles
  const angle = Math.PI / 3; // 60 degrees
  const points = [];
  for (let i = 0; i < 6; i++) {
    const x = centerX + radius * Math.cos(angle * i - Math.PI / 2); // Start from top
    const y = centerY + radius * Math.sin(angle * i - Math.PI / 2);
    points.push(`${x},${y}`);
  }
  
  const hexagonPath = `M ${points.join(' L ')} Z`;

  // Calculate text limits based on size - generous sizing for larger hexagons
  const titleMaxLength = Math.floor(size / 6); // More generous title length for larger hexies
  const textMaxLength = Math.floor(size / 2); // More generous content length for larger hexies

  const handleReferencesClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowReferences(true);
  };

  const handleFlipClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFlip?.();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.();
  };

  return (
    <>
      <div
        className={`relative ${className} select-none`}
        style={{
          width: size,
          height: size,
          ...style
        }}
        onClick={onClick}
        onMouseDown={onMouseDown}
        onContextMenu={onContextMenu}
      >
        {/* Shadow layer removed for cleaner appearance */}
        
        {/* Main hexagon */}
        <svg
          className="absolute inset-0"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
        >
          <path
            d={hexagonPath}
            fill={color}
            stroke={borderColor}
            strokeWidth={3}
            className="transition-all duration-300"
          />
        </svg>
        
        {/* Content overlay - properly fitted to hexagon */}
        <div 
          className="absolute text-center text-white flex flex-col justify-center items-center select-none p-2"
          style={{
            left: `${centerX}px`,
            top: `${centerY}px`,
            width: `${radius * 1.4}px`,
            height: `${radius * 1.6}px`,
            transform: 'translate(-50%, -50%)',
            zIndex: 10
          }}
        >
          {/* Title */}
          <div className="flex-shrink-0 mb-1">
            <h3 
              className="font-bold leading-tight select-none text-center"
              style={{ 
                fontSize: '14px', // Fixed size instead of scaling with hexagon
                lineHeight: '1.0'
              }}
            >
              {title || 'Untitled'}
            </h3>
          </div>
          
          {/* Content Text */}
          <div className="flex-1 flex items-center justify-center px-1 overflow-hidden">
            <p 
              className="text-center break-words hyphens-auto select-none leading-tight"
              style={{ 
                fontSize: '12px', // Fixed size instead of scaling with hexagon
                lineHeight: '1.1',
                maxHeight: `${radius * 1.2}px`,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: Math.floor(radius / 8),
                WebkitBoxOrient: 'vertical'
              }}
            >
              {isFlipped 
                ? (backText || 'No back text available')
                : (frontText || 'No front text available')
              }
            </p>
          </div>
          
          
          {/* Side indicator */}
          <div 
            className="flex-shrink-0 opacity-90 font-medium select-none mt-1"
            style={{ fontSize: '10px' }} // Fixed size instead of scaling with hexagon
          >
            {isFlipped ? 'Back' : 'Front'}
          </div>
        </div>

        {/* Control buttons */}
        <div className="absolute top-2 right-2 flex space-x-1">
          {/* References button */}
          {showReferencesButton && references && references.length > 0 && (
            <button
              onClick={handleReferencesClick}
              className={`${size > 140 ? 'w-6 h-6' : 'w-8 h-8'} bg-green-500/90 hover:bg-green-500 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 relative overflow-hidden`}
              title="View references"
              style={{
                minWidth: size > 140 ? '24px' : '32px',
                minHeight: size > 140 ? '24px' : '32px',
                padding: '0',
                border: 'none',
                outline: 'none'
              }}
            >
              <BookOpen className={`${size > 140 ? 'w-3 h-3' : 'w-4 h-4'} text-white`} />
            </button>
          )}
          
          {/* Flip button with improved accuracy */}
          {showFlipButton && onFlip && (
            <button
              onClick={handleFlipClick}
              className={`${size > 140 ? 'w-6 h-6' : 'w-8 h-8'} bg-blue-500/90 hover:bg-blue-500 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 relative overflow-hidden`}
              title="Flip hexagon"
              style={{
                minWidth: size > 140 ? '24px' : '32px',
                minHeight: size > 140 ? '24px' : '32px',
                padding: '0',
                border: 'none',
                outline: 'none'
              }}
            >
              <RotateCcw className={`${size > 140 ? 'w-3 h-3' : 'w-4 h-4'} text-white`} />
            </button>
          )}
          
          {/* Delete button */}
          {showDelete && (
            <button
              onClick={handleDeleteClick}
              className={`${size > 140 ? 'w-6 h-6' : 'w-8 h-8'} bg-red-500/90 hover:bg-red-500 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 relative overflow-hidden`}
              title="Delete hexagon"
              style={{
                minWidth: size > 140 ? '24px' : '32px',
                minHeight: size > 140 ? '24px' : '32px',
                padding: '0',
                border: 'none',
                outline: 'none'
              }}
            >
              <X className={`${size > 140 ? 'w-3 h-3' : 'w-4 h-4'} text-white`} />
            </button>
          )}
        </div>
      </div>

      {/* References Modal - Completely stable using Portal */}
      <StableModal 
        isOpen={showReferences} 
        onClose={() => setShowReferences(false)}
      >
        <div style={{ padding: '24px' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">{title}</h3>
              <button
                onClick={() => setShowReferences(false)}
                className="p-2 bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="mb-4">
              <h4 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                <Library className="w-5 h-5 mr-2 text-blue-600" />
                Research & References
              </h4>
              <p className="text-sm text-gray-600">Scientific research, articles, and resources supporting this content</p>
            </div>
            
            {references && references.length > 0 ? (
              <div className="space-y-4">
                {references.map((ref, index) => {
                  const getTypeIcon = (type: string) => {
                    switch (type) {
                      case 'video':
                        return <Video className="w-4 h-4 text-red-500" />;
                      case 'podcast':
                        return <Headphones className="w-4 h-4 text-purple-500" />;
                      case 'article':
                        return <FileText className="w-4 h-4 text-blue-500" />;
                      case 'research':
                        return <Microscope className="w-4 h-4 text-indigo-500" />;
                      case 'book':
                        return <BookOpen className="w-4 h-4 text-green-500" />;
                      case 'website':
                        return <Globe className="w-4 h-4 text-gray-500" />;
                      default:
                        return <ExternalLink className="w-4 h-4 text-gray-500" />;
                    }
                  };
                  
                  const getTypeColor = (type: string) => {
                    switch (type) {
                      case 'video':
                        return 'bg-red-100 text-red-800';
                      case 'podcast':
                        return 'bg-purple-100 text-purple-800';
                      case 'article':
                        return 'bg-blue-100 text-blue-800';
                      case 'research':
                        return 'bg-indigo-100 text-indigo-800';
                      case 'book':
                        return 'bg-green-100 text-green-800';
                      case 'website':
                        return 'bg-gray-100 text-gray-800';
                      default:
                        return 'bg-gray-100 text-gray-800';
                    }
                  };
                  
                  return (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getTypeIcon(ref.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-semibold text-gray-900 mb-2 break-words">{ref.title}</h5>
                          
                          {/* Publication and Authors */}
                          <div className="flex flex-wrap items-center gap-2 mb-2 text-sm text-gray-600">
                            {ref.publication && (
                              <span className="font-medium">{ref.publication}</span>
                            )}
                            {ref.authors && (
                              <span>• by {ref.authors}</span>
                            )}
                            {ref.year && (
                              <span>• {ref.year}</span>
                            )}
                          </div>
                          
                          {ref.description && (
                            <p className="text-gray-600 text-sm mb-3 leading-relaxed break-words">{ref.description}</p>
                          )}
                          
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            {ref.url && (
                              <a
                                href={ref.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-blue-600 text-sm font-medium"
                              >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                {ref.type === 'video' ? 'Watch Video' : 
                                 ref.type === 'podcast' ? 'Listen to Podcast' :
                                 ref.type === 'research' ? 'View Research' :
                                 ref.type === 'book' ? 'View Book' :
                                 ref.type === 'article' ? 'Read Article' :
                                 'Visit Website'}
                              </a>
                            )}
                            <span className={`inline-block text-xs px-3 py-1 rounded-full font-medium ${getTypeColor(ref.type)}`}>
                              {ref.type.charAt(0).toUpperCase() + ref.type.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Library className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-lg">No references available for this hexie.</p>
                <p className="text-gray-400 text-sm mt-2">References may include research papers, articles, books, videos, and other evidence-based resources.</p>
              </div>
            )}
        </div>
      </StableModal>
    </>
  );
};

export default HexagonShape;