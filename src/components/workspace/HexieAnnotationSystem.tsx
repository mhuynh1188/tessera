'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  Edit3, 
  Eye, 
  EyeOff, 
  Shield, 
  AlertTriangle,
  Lightbulb,
  Heart,
  Brain,
  Target,
  X,
  Save,
  Lock,
  Users,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';

interface AnnotationData {
  id: string;
  content: string;
  annotation_type: 'note' | 'question' | 'insight' | 'concern' | 'solution' | 'reflection';
  position: { x: number; y: number }; // Relative position (0-1)
  style: {
    color: string;
    fontSize: number;
    opacity: number;
    background: string;
  };
  visibility: 'private' | 'team' | 'public';
  is_anonymous: boolean;
  safety_level: 'safe' | 'sensitive' | 'private';
  created_by: string;
  created_at: string;
  updated_at?: string;
}

interface HexieAnnotationSystemProps {
  hexieId: string;
  annotations: AnnotationData[];
  hexieSize: { width: number; height: number };
  isEditable: boolean;
  userPermissions: {
    canAnnotate: boolean;
    canViewPrivate: boolean;
    canModerate: boolean;
  };
  subscriptionTier: 'free' | 'basic' | 'premium';
  onAnnotationAdd: (annotation: Omit<AnnotationData, 'id' | 'created_at' | 'updated_at'>) => void;
  onAnnotationUpdate: (id: string, updates: Partial<AnnotationData>) => void;
  onAnnotationDelete: (id: string) => void;
  onSafetyAlert?: (alert: { type: string; content: string; severity: number }) => void;
}

export const HexieAnnotationSystem: React.FC<HexieAnnotationSystemProps> = ({
  hexieId,
  annotations,
  hexieSize,
  isEditable,
  userPermissions,
  subscriptionTier,
  onAnnotationAdd,
  onAnnotationUpdate,
  onAnnotationDelete,
  onSafetyAlert
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newAnnotationPosition, setNewAnnotationPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    content: '',
    annotation_type: 'note' as AnnotationData['annotation_type'],
    visibility: 'team' as AnnotationData['visibility'],
    is_anonymous: false,
    safety_level: 'safe' as AnnotationData['safety_level']
  });

  const hexieRef = useRef<HTMLDivElement>(null);

  // Subscription limits
  const getSubscriptionLimits = () => {
    switch (subscriptionTier) {
      case 'free':
        return { maxAnnotations: 3, maxCharacters: 100, canUseAdvancedTypes: false };
      case 'basic':
        return { maxAnnotations: 10, maxCharacters: 300, canUseAdvancedTypes: true };
      case 'premium':
        return { maxAnnotations: 50, maxCharacters: 1000, canUseAdvancedTypes: true };
      default:
        return { maxAnnotations: 3, maxCharacters: 100, canUseAdvancedTypes: false };
    }
  };

  const limits = getSubscriptionLimits();

  // Handle clicking on the hexie to create annotation
  const handleHexieClick = (e: React.MouseEvent) => {
    if (!userPermissions.canAnnotate || !isEditable || annotations.length >= limits.maxAnnotations) {
      if (annotations.length >= limits.maxAnnotations) {
        toast.error(`Annotation limit reached. Upgrade to add more annotations.`);
      }
      return;
    }

    e.preventDefault();
    const rect = hexieRef.current?.getBoundingClientRect();
    if (!rect) return;

    const relativeX = (e.clientX - rect.left) / rect.width;
    const relativeY = (e.clientY - rect.top) / rect.height;

    // Ensure position is within bounds
    const clampedX = Math.max(0.1, Math.min(0.9, relativeX));
    const clampedY = Math.max(0.1, Math.min(0.9, relativeY));

    setNewAnnotationPosition({ x: clampedX, y: clampedY });
    setIsCreating(true);
    setFormData({
      content: '',
      annotation_type: 'note',
      visibility: 'team',
      is_anonymous: false,
      safety_level: 'safe'
    });
  };

  // Auto-detect safety level based on content
  const detectSafetyLevel = (content: string): AnnotationData['safety_level'] => {
    const sensitiveKeywords = [
      'stress', 'anxiety', 'difficult', 'struggle', 'problem', 'conflict',
      'frustrated', 'overwhelmed', 'pressure', 'worried', 'concerned'
    ];
    const privateKeywords = [
      'personal', 'private', 'confidential', 'intimate', 'secret',
      'family', 'relationship', 'health', 'financial'
    ];
    
    const lowerContent = content.toLowerCase();
    
    if (privateKeywords.some(keyword => lowerContent.includes(keyword))) {
      return 'private';
    }
    if (sensitiveKeywords.some(keyword => lowerContent.includes(keyword))) {
      return 'sensitive';
    }
    return 'safe';
  };

  // Handle content change with safety detection
  const handleContentChange = (content: string) => {
    setFormData(prev => ({
      ...prev,
      content,
      safety_level: detectSafetyLevel(content)
    }));

    // Trigger safety alerts for concerning content
    if (content.length > 20) {
      const concerningPatterns = [
        'want to quit', 'can\'t handle', 'breaking point', 'giving up',
        'hate my job', 'toxic', 'abuse', 'harassment'
      ];
      
      const lowerContent = content.toLowerCase();
      const matchedPatterns = concerningPatterns.filter(pattern => 
        lowerContent.includes(pattern)
      );

      if (matchedPatterns.length > 0 && onSafetyAlert) {
        onSafetyAlert({
          type: 'concerning_content',
          content: content,
          severity: matchedPatterns.length > 1 ? 3 : 2
        });
      }
    }
  };

  // Save annotation
  const handleSave = () => {
    if (!formData.content.trim() || !newAnnotationPosition) return;

    if (formData.content.length > limits.maxCharacters) {
      toast.error(`Content too long. Maximum ${limits.maxCharacters} characters.`);
      return;
    }

    const annotation: Omit<AnnotationData, 'id' | 'created_at' | 'updated_at'> = {
      content: formData.content.trim(),
      annotation_type: formData.annotation_type,
      position: newAnnotationPosition,
      style: getAnnotationStyle(formData.annotation_type),
      visibility: formData.visibility,
      is_anonymous: formData.is_anonymous,
      safety_level: formData.safety_level,
      created_by: 'current_user' // Replace with actual user ID
    };

    onAnnotationAdd(annotation);
    setIsCreating(false);
    setNewAnnotationPosition(null);
    toast.success('Annotation added successfully');
  };

  // Get annotation style based on type
  const getAnnotationStyle = (type: AnnotationData['annotation_type']) => {
    const styles = {
      note: { color: '#fbbf24', background: 'rgba(251, 191, 36, 0.1)' },
      question: { color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)' },
      insight: { color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' },
      concern: { color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)' },
      solution: { color: '#8b5cf6', background: 'rgba(139, 92, 246, 0.1)' },
      reflection: { color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)' }
    };

    return {
      ...styles[type],
      fontSize: 12,
      opacity: 0.9
    };
  };

  // Get annotation icon
  const getAnnotationIcon = (type: AnnotationData['annotation_type']) => {
    const icons = {
      note: MessageSquare,
      question: Brain,
      insight: Lightbulb,
      concern: AlertTriangle,
      solution: Target,
      reflection: Heart
    };
    return icons[type];
  };

  // Get visibility icon
  const getVisibilityIcon = (visibility: AnnotationData['visibility'], isAnonymous: boolean) => {
    if (visibility === 'private') return Lock;
    if (visibility === 'team') return Users;
    if (visibility === 'public') return Globe;
    return Users;
  };

  // Filter annotations based on permissions and visibility
  const visibleAnnotations = annotations.filter(annotation => {
    if (annotation.visibility === 'private' && !userPermissions.canViewPrivate) {
      return annotation.created_by === 'current_user'; // Only show user's own private annotations
    }
    return true;
  });

  const displayedAnnotations = showAll ? visibleAnnotations : visibleAnnotations.slice(0, 3);

  return (
    <div className="relative">
      {/* Hexie area - clickable for new annotations */}
      <div
        ref={hexieRef}
        className={`relative ${isEditable && userPermissions.canAnnotate ? 'cursor-crosshair' : ''}`}
        style={{ width: hexieSize.width, height: hexieSize.height }}
        onClick={handleHexieClick}
      >
        {/* Existing annotations */}
        {displayedAnnotations.map((annotation) => {
          const AnnotationIcon = getAnnotationIcon(annotation.annotation_type);
          const VisibilityIcon = getVisibilityIcon(annotation.visibility, annotation.is_anonymous);
          
          return (
            <div
              key={annotation.id}
              className={`absolute cursor-pointer transition-all duration-200 ${
                selectedAnnotation === annotation.id ? 'z-20 scale-110' : 'z-10'
              }`}
              style={{
                left: `${annotation.position.x * 100}%`,
                top: `${annotation.position.y * 100}%`,
                transform: 'translate(-50%, -50%)'
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedAnnotation(selectedAnnotation === annotation.id ? null : annotation.id);
              }}
            >
              {/* Annotation marker */}
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-white/20 ${
                  annotation.safety_level === 'private' ? 'animate-pulse' : ''
                }`}
                style={{
                  backgroundColor: annotation.style.color,
                  opacity: annotation.style.opacity
                }}
              >
                <AnnotationIcon className="h-3 w-3 text-white" />
              </div>

              {/* Safety indicator */}
              {annotation.safety_level !== 'safe' && (
                <div className="absolute -top-1 -right-1">
                  <Shield 
                    className={`h-3 w-3 ${
                      annotation.safety_level === 'private' ? 'text-red-400' : 'text-yellow-400'
                    }`} 
                  />
                </div>
              )}

              {/* Expanded annotation content */}
              {selectedAnnotation === annotation.id && (
                <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-30">
                  <Card className="w-64 bg-gray-900/95 border-gray-700 shadow-xl backdrop-blur-sm">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant="secondary"
                            className="text-xs"
                            style={{ backgroundColor: annotation.style.background, color: annotation.style.color }}
                          >
                            {annotation.annotation_type}
                          </Badge>
                          <VisibilityIcon className="h-3 w-3 text-gray-400" />
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAnnotation(null);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <p className="text-sm text-gray-200 mb-2">{annotation.content}</p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>
                          {annotation.is_anonymous ? 'Anonymous' : 'You'}
                        </span>
                        <span>
                          {new Date(annotation.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Safety warning */}
                      {annotation.safety_level !== 'safe' && (
                        <div className={`mt-2 p-2 rounded text-xs ${
                          annotation.safety_level === 'private' 
                            ? 'bg-red-500/10 text-red-300 border border-red-500/20' 
                            : 'bg-yellow-500/10 text-yellow-300 border border-yellow-500/20'
                        }`}>
                          <div className="flex items-center space-x-1">
                            <Shield className="h-3 w-3" />
                            <span>
                              {annotation.safety_level === 'private' ? 'Private content' : 'Sensitive content'}
                            </span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          );
        })}

        {/* New annotation position marker */}
        {isCreating && newAnnotationPosition && (
          <div
            className="absolute z-20 animate-pulse"
            style={{
              left: `${newAnnotationPosition.x * 100}%`,
              top: `${newAnnotationPosition.y * 100}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center border-2 border-white shadow-lg">
              <Edit3 className="h-3 w-3 text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Annotation form modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="w-96 bg-gray-900 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Add Annotation</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsCreating(false);
                    setNewAnnotationPosition(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                {/* Annotation type */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Type
                  </label>
                  <select
                    value={formData.annotation_type}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      annotation_type: e.target.value as AnnotationData['annotation_type'] 
                    }))}
                    className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                  >
                    <option value="note">💭 Note</option>
                    <option value="question">❓ Question</option>
                    {limits.canUseAdvancedTypes && (
                      <>
                        <option value="insight">💡 Insight</option>
                        <option value="concern">⚠️ Concern</option>
                        <option value="solution">✅ Solution</option>
                        <option value="reflection">🤔 Reflection</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Content
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => handleContentChange(e.target.value)}
                    placeholder="Share your thoughts, insights, or questions..."
                    className="w-full p-3 bg-gray-800 border border-gray-600 rounded text-white text-sm resize-none"
                    rows={3}
                    maxLength={limits.maxCharacters}
                  />
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500">
                      {formData.content.length}/{limits.maxCharacters} characters
                    </span>
                    {formData.safety_level !== 'safe' && (
                      <Badge 
                        variant="secondary"
                        className={`text-xs ${
                          formData.safety_level === 'private' ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'
                        }`}
                      >
                        <Shield className="h-3 w-3 mr-1" />
                        {formData.safety_level}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Visibility settings */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Visibility
                    </label>
                    <select
                      value={formData.visibility}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        visibility: e.target.value as AnnotationData['visibility'] 
                      }))}
                      className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                    >
                      <option value="private">🔒 Private</option>
                      <option value="team">👥 Team</option>
                      {subscriptionTier !== 'free' && (
                        <option value="public">🌍 Public</option>
                      )}
                    </select>
                  </div>

                  <div className="flex items-end">
                    <label className="flex items-center space-x-2 text-sm text-gray-300">
                      <input
                        type="checkbox"
                        checked={formData.is_anonymous}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          is_anonymous: e.target.checked 
                        }))}
                        className="rounded"
                      />
                      <span>Anonymous</span>
                    </label>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-end space-x-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreating(false);
                      setNewAnnotationPosition(null);
                    }}
                    className="border-gray-600 text-gray-300"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={!formData.content.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Annotations summary */}
      {visibleAnnotations.length > 0 && (
        <div className="mt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {visibleAnnotations.length} annotation{visibleAnnotations.length !== 1 ? 's' : ''}
            </span>
            {visibleAnnotations.length > 3 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowAll(!showAll)}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                {showAll ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                {showAll ? 'Show less' : `Show all ${visibleAnnotations.length}`}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HexieAnnotationSystem;