'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  X, 
  Calendar, 
  Users, 
  DollarSign, 
  Target,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface InterventionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (intervention: any) => void;
  stakeholderRole: 'hr' | 'executive' | 'middle_management';
}

export const InterventionModal: React.FC<InterventionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  stakeholderRole
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_pattern: '',
    category: 'Communication',
    start_date: '',
    participants_count: 1,
    budget_allocated: 0,
    target_severity_reduction: 25,
    target_frequency_reduction: 30
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const categories = [
    'Communication',
    'Leadership', 
    'Process',
    'Culture',
    'Team Dynamics',
    'Meetings',
    'Decision Making'
  ];

  const commonPatterns = {
    hr: [
      'Communication Breakdowns',
      'Conflict Resolution',
      'Workplace Harassment',
      'Performance Issues',
      'Team Collaboration'
    ],
    executive: [
      'Leadership Development',
      'Strategic Alignment',
      'Change Management',
      'Cultural Transformation',
      'Organizational Efficiency'
    ],
    middle_management: [
      'Micromanagement',
      'Team Motivation',
      'Meeting Overload',
      'Delegation Issues',
      'Work-Life Balance'
    ]
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    // Validate form
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.target_pattern.trim()) newErrors.target_pattern = 'Target pattern is required';
    if (!formData.start_date) newErrors.start_date = 'Start date is required';
    if (formData.participants_count < 1) newErrors.participants_count = 'At least 1 participant required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      // Submit to API
      const response = await fetch('/api/interventions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          stakeholder_role: stakeholderRole
        }),
      });

      const result = await response.json();

      if (response.ok) {
        onSubmit(result.intervention);
        onClose();
        // Reset form
        setFormData({
          title: '',
          description: '',
          target_pattern: '',
          category: 'Communication',
          start_date: '',
          participants_count: 1,
          budget_allocated: 0,
          target_severity_reduction: 25,
          target_frequency_reduction: 30
        });
      } else {
        setErrors({ submit: result.error || 'Failed to create intervention' });
      }
    } catch (error) {
      console.error('Error creating intervention:', error);
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Create New Intervention</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            Design a targeted intervention to improve workplace behavior patterns
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Intervention Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Communication Skills Workshop"
              />
              {errors.title && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.title}
                </p>
              )}
            </div>

            {/* Target Pattern */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Target Behavior Pattern *
              </label>
              <select
                value={formData.target_pattern}
                onChange={(e) => handleInputChange('target_pattern', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.target_pattern ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select a behavior pattern</option>
                {commonPatterns[stakeholderRole].map(pattern => (
                  <option key={pattern} value={pattern}>{pattern}</option>
                ))}
                <option value="custom">Custom Pattern</option>
              </select>
              
              {formData.target_pattern === 'custom' && (
                <input
                  type="text"
                  value={formData.target_pattern}
                  onChange={(e) => handleInputChange('target_pattern', e.target.value)}
                  className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter custom behavior pattern"
                />
              )}
              
              {errors.target_pattern && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.target_pattern}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Describe the intervention approach, methodology, and expected outcomes..."
              />
              {errors.description && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.description}
                </p>
              )}
            </div>

            {/* Category and Start Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Target className="h-4 w-4 inline mr-1" />
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Start Date *
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleInputChange('start_date', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.start_date ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.start_date && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.start_date}
                  </p>
                )}
              </div>
            </div>

            {/* Participants and Budget */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Users className="h-4 w-4 inline mr-1" />
                  Participants Count *
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={formData.participants_count}
                  onChange={(e) => handleInputChange('participants_count', parseInt(e.target.value) || 1)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.participants_count ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.participants_count && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.participants_count}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <DollarSign className="h-4 w-4 inline mr-1" />
                  Budget (USD)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={formData.budget_allocated}
                  onChange={(e) => handleInputChange('budget_allocated', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Target Metrics */}
            <div>
              <label className="block text-sm font-medium mb-3">Target Improvement Metrics</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Severity Reduction (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.target_severity_reduction}
                    onChange={(e) => handleInputChange('target_severity_reduction', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Frequency Reduction (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.target_frequency_reduction}
                    onChange={(e) => handleInputChange('target_frequency_reduction', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Expected percentage reduction in behavior pattern severity and frequency
              </p>
            </div>

            {/* Submit Errors */}
            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  {errors.submit}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Create Intervention
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default InterventionModal;