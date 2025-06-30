'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  Upload,
  Image,
  FileText,
  Download,
  Trash2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Grid,
  Layers,
  Plus,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';

interface Template {
  id: string;
  name: string;
  type: 'image' | 'svg' | 'pdf';
  url: string;
  thumbnail?: string;
  isLocked: boolean;
  created_at: string;
  file_size?: number;
}

interface TemplateManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateSelect: (template: Template | null) => void;
  currentTemplate: Template | null;
  userTier: 'free' | 'basic' | 'premium';
}

const TEMPLATE_LIMITS = {
  free: { maxTemplates: 0, maxFileSize: 0, allowedTypes: [] },
  basic: { maxTemplates: 3, maxFileSize: 5 * 1024 * 1024, allowedTypes: ['image'] }, // 5MB
  premium: { maxTemplates: 20, maxFileSize: 50 * 1024 * 1024, allowedTypes: ['image', 'svg', 'pdf'] } // 50MB
};

// Default templates (built-in)
const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'default-grid',
    name: 'Grid Template',
    type: 'svg',
    url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwMCIgaGVpZ2h0PSI4MDAiIHZpZXdCb3g9IjAgMCAxMDAwIDgwMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGRlZnM+CjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPgo8cGF0aCBkPSJNIDUwIDAgTCAwIDAgMCA1MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZTVlN2ViIiBzdHJva2Utd2lkdGg9IjEiLz4KPC9wYXR0ZXJuPgo8L2RlZnM+CjxyZWN0IHdpZHRoPSIxMDAwIiBoZWlnaHQ9IjgwMCIgZmlsbD0idXJsKCNncmlkKSIvPgo8L3N2Zz4=',
    isLocked: false,
    created_at: new Date().toISOString()
  },
  {
    id: 'default-kanban',
    name: 'Kanban Board',
    type: 'svg',
    url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwMCIgaGVpZ2h0PSI4MDAiIHZpZXdCb3g9IjAgMCAxMDAwIDgwMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSI3NjAiIHg9IjIwIiB5PSIyMCIgZmlsbD0iI2Y5ZmFmYiIgc3Ryb2tlPSIjZTVlN2ViIiBzdHJva2Utd2lkdGg9IjIiIHJ4PSI4Ii8+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iNzYwIiB4PSIzNDAiIHk9IjIwIiBmaWxsPSIjZWZmNmZmIiBzdHJva2U9IiNkMWZhZTUiIHN0cm9rZS13aWR0aD0iMiIgcng9IjgiLz4KPHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSI3NjAiIHg9IjY2MCIgeT0iMjAiIGZpbGw9IiNmZWY5ZjkiIHN0cm9rZT0iI2JkZTlmNCIgc3Ryb2tlLXdpZHRoPSIyIiByeD0iOCIvPgo8L3N2Zz4=',
    isLocked: false,
    created_at: new Date().toISOString()
  },
  {
    id: 'estuarine-map',
    name: 'Estuarine Map',
    type: 'svg',
    url: 'estuarine-template', // Special identifier for built-in SVG component
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDIwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIxNTAiIGZpbGw9IiNmOGZhZmMiLz48ZWxsaXBzZSBjeD0iNDAiIGN5PSIxMjAiIHJ4PSIzMCIgcnk9IjIwIiBmaWxsPSIjMTBiOTgxIiBvcGFjaXR5PSIwLjMiLz48ZWxsaXBzZSBjeD0iMTQwIiBjeT0iNTAiIHJ4PSIzNSIgcnk9IjI1IiBmaWxsPSIjZjU5ZTBiIiBvcGFjaXR5PSIwLjMiLz48cGF0aCBkPSJNIDEyMCAyMCBRIDE2MCAyNSAxODAgNDAgUSAxODUgNjAgMTcwIDgwIGZpbGw9IiNlZjQ0NDQiIG9wYWNpdHk9IjAuNCIvPjx0ZXh0IHg9IjEwMCIgeT0iMTQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjEwIiBmaWxsPSIjMzc0MTUxIj5Fc3R1YXJpbmUgTWFwPC90ZXh0Pjwvc3ZnPg==',
    isLocked: false,
    created_at: new Date().toISOString()
  }
];

export const TemplateManager: React.FC<TemplateManagerProps> = ({
  isOpen,
  onClose,
  onTemplateSelect,
  currentTemplate,
  userTier
}) => {
  const [templates, setTemplates] = useState<Template[]>(DEFAULT_TEMPLATES);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const limits = TEMPLATE_LIMITS[userTier];

  const handleFileUpload = useCallback(async (files: FileList) => {
    if (userTier === 'free') {
      toast.error('Template uploads available in Basic tier and above');
      return;
    }

    if (templates.length >= limits.maxTemplates) {
      toast.error(`Maximum ${limits.maxTemplates} templates allowed for ${userTier} tier`);
      return;
    }

    const file = files[0];
    if (!file) return;

    // Validate file type
    const fileType = file.type.split('/')[0];
    const isValidType = limits.allowedTypes.includes(fileType) || 
                       (file.type === 'image/svg+xml' && limits.allowedTypes.includes('svg')) ||
                       (file.type === 'application/pdf' && limits.allowedTypes.includes('pdf'));

    if (!isValidType) {
      toast.error(`File type not supported for ${userTier} tier. Allowed: ${limits.allowedTypes.join(', ')}`);
      return;
    }

    // Validate file size
    if (file.size > limits.maxFileSize) {
      toast.error(`File size exceeds ${limits.maxFileSize / (1024 * 1024)}MB limit`);
      return;
    }

    setIsUploading(true);

    try {
      // Create object URL for preview
      const url = URL.createObjectURL(file);
      
      const newTemplate: Template = {
        id: `template-${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
        type: fileType === 'image' ? 'image' : 
              file.type === 'image/svg+xml' ? 'svg' : 'pdf',
        url,
        isLocked: false,
        created_at: new Date().toISOString(),
        file_size: file.size
      };

      setTemplates(prev => [...prev, newTemplate]);
      toast.success(`Template "${newTemplate.name}" uploaded successfully!`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload template');
    } finally {
      setIsUploading(false);
    }
  }, [userTier, templates.length, limits]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  if (!isOpen) return null;

  const toggleTemplateLock = (templateId: string) => {
    setTemplates(prev => prev.map(t => 
      t.id === templateId ? { ...t, isLocked: !t.isLocked } : t
    ));
  };

  const deleteTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template?.url.startsWith('blob:')) {
      URL.revokeObjectURL(template.url);
    }
    setTemplates(prev => prev.filter(t => t.id !== templateId));
    
    if (currentTemplate?.id === templateId) {
      onTemplateSelect(null);
    }
    
    toast.success('Template deleted');
  };

  const selectTemplate = (template: Template) => {
    onTemplateSelect(template);
    toast.success(`Template "${template.name}" applied to workspace`);
  };

  const clearTemplate = () => {
    onTemplateSelect(null);
    toast.success('Template cleared from workspace');
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return mb > 1 ? `${mb.toFixed(1)}MB` : `${(bytes / 1024).toFixed(0)}KB`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        <CardHeader className="border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl text-white flex items-center">
                <Layers className="h-5 w-5 mr-2" />
                Workspace Templates
              </CardTitle>
              <p className="text-gray-400 text-sm mt-1">
                Add background templates like Miro or Mural boards
              </p>
            </div>
            <Button variant="ghost" onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Upload Area */}
          {userTier !== 'free' && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-lg p-8 mb-6 text-center transition-colors ${
                dragOver 
                  ? 'border-blue-500 bg-blue-500/10' 
                  : 'border-gray-600 hover:border-gray-500'
              }`}
            >
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-white font-medium mb-2">
                Drop files here or click to upload
              </p>
              <p className="text-gray-400 text-sm mb-4">
                Supports: {limits.allowedTypes.join(', ').toUpperCase()} • Max: {formatFileSize(limits.maxFileSize)}
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || templates.length >= limits.maxTemplates}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                {isUploading ? 'Uploading...' : 'Choose Files'}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={userTier === 'premium' ? 'image/*,.svg,.pdf' : 'image/*'}
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                className="hidden"
              />
            </div>
          )}

          {/* Free Tier Limitation */}
          {userTier === 'free' && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <Lock className="h-5 w-5 text-blue-400 mr-3" />
                <div>
                  <p className="text-blue-300 font-medium">Template Uploads</p>
                  <p className="text-gray-400 text-sm">Available in Basic tier and above</p>
                </div>
              </div>
            </div>
          )}

          {/* Current Template */}
          {currentTemplate && (
            <div className="mb-6">
              <h3 className="text-white font-medium mb-3">Current Template</h3>
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                        {currentTemplate.type === 'image' && <Image className="h-6 w-6 text-gray-400" />}
                        {currentTemplate.type === 'svg' && <Grid className="h-6 w-6 text-gray-400" />}
                        {currentTemplate.type === 'pdf' && <FileText className="h-6 w-6 text-gray-400" />}
                      </div>
                      <div>
                        <h4 className="text-white font-medium">{currentTemplate.name}</h4>
                        <p className="text-gray-400 text-sm capitalize">{currentTemplate.type} template</p>
                      </div>
                    </div>
                    <Button
                      onClick={clearTemplate}
                      variant="outline"
                      size="sm"
                      className="border-gray-600"
                    >
                      <EyeOff className="h-4 w-4 mr-2" />
                      Clear
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Templates Grid */}
          <div>
            <h3 className="text-white font-medium mb-3">Available Templates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {templates.map((template) => (
                <Card key={template.id} className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Template Preview */}
                      <div className="w-full h-24 bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                        {template.type === 'image' || template.type === 'svg' ? (
                          <img
                            src={template.url}
                            alt={template.name}
                            className="w-full h-full object-cover rounded-lg"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling!.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`flex items-center justify-center ${template.type === 'image' || template.type === 'svg' ? 'hidden' : ''}`}>
                          {template.type === 'image' && <Image className="h-8 w-8 text-gray-400" />}
                          {template.type === 'svg' && <Grid className="h-8 w-8 text-gray-400" />}
                          {template.type === 'pdf' && <FileText className="h-8 w-8 text-gray-400" />}
                        </div>
                      </div>

                      {/* Template Info */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-white font-medium text-sm truncate flex-1">
                            {template.name}
                          </h4>
                          {template.isLocked && <Lock className="h-3 w-3 text-yellow-400" />}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="text-xs capitalize">
                            {template.type}
                          </Badge>
                          {template.file_size && (
                            <span className="text-xs text-gray-400">
                              {formatFileSize(template.file_size)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => selectTemplate(template)}
                          size="sm"
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                          disabled={template.id === currentTemplate?.id}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          {template.id === currentTemplate?.id ? 'Active' : 'Apply'}
                        </Button>
                        
                        {!DEFAULT_TEMPLATES.find(t => t.id === template.id) && (
                          <>
                            <Button
                              onClick={() => toggleTemplateLock(template.id)}
                              size="sm"
                              variant="outline"
                              className="border-gray-600"
                            >
                              {template.isLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                            </Button>
                            <Button
                              onClick={() => deleteTemplate(template.id)}
                              size="sm"
                              variant="outline"
                              className="border-red-600 text-red-400 hover:bg-red-600/20"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Tier Limitations */}
          <div className="mt-6 pt-4 border-t border-gray-700">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">
                Templates: {templates.length}/{userTier === 'free' ? '0' : limits.maxTemplates}
              </span>
              <span className="text-gray-400 capitalize">
                {userTier} tier
              </span>
            </div>
          </div>
        </CardContent>
      </div>
    </div>
  );
};

export default TemplateManager;