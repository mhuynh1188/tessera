'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Mail, 
  Plus, 
  Edit3, 
  Eye, 
  Trash2, 
  Save, 
  Copy,
  Settings,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmailTemplate {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  category: string;
  subject_template: string;
  html_template: string;
  text_template?: string;
  variables?: string[];
  default_variables?: Record<string, any>;
  brand_colors?: Record<string, string>;
  logo_url?: string;
  footer_content?: string;
  is_system_template: boolean;
  is_active: boolean;
  usage_count: number;
  last_used_at?: string;
  created_at: string;
  updated_at: string;
}

interface EmailPreview {
  subject: string;
  html: string;
  text: string;
}

const TEMPLATE_CATEGORIES = [
  'auth',
  'billing', 
  'analytics',
  'notifications',
  'marketing',
  'system',
  'custom'
];

export function EmailTemplateManager() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState<EmailPreview | null>(null);
  const [previewVariables, setPreviewVariables] = useState<Record<string, string>>({});
  
  const { toast } = useToast();

  // Form state for editing/creating templates
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    category: 'custom',
    subject_template: '',
    html_template: '',
    text_template: '',
    brand_colors: {},
    logo_url: '',
    footer_content: ''
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/email/templates');
      const data = await response.json();
      
      if (data.success) {
        setTemplates(data.templates);
      } else {
        throw new Error(data.message || 'Failed to fetch templates');
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      toast({
        title: "Error",
        description: "Failed to load email templates",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    try {
      setSaving(true);
      
      const method = isCreating ? 'POST' : 'PUT';
      const body = isCreating ? formData : { ...formData, id: selectedTemplate?.id };
      
      const response = await fetch('/api/email/templates', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success", 
          description: `Template ${isCreating ? 'created' : 'updated'} successfully`
        });
        
        await fetchTemplates();
        setIsEditing(false);
        setIsCreating(false);
        setSelectedTemplate(null);
      } else {
        throw new Error(data.message || 'Failed to save template');
      }
    } catch (error) {
      console.error('Failed to save template:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to save template',
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
      const response = await fetch(`/api/email/templates?id=${templateId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Template deleted successfully"
        });
        await fetchTemplates();
        if (selectedTemplate?.id === templateId) {
          setSelectedTemplate(null);
        }
      } else {
        throw new Error(data.message || 'Failed to delete template');
      }
    } catch (error) {
      console.error('Failed to delete template:', error);
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive"
      });
    }
  };

  const handlePreviewTemplate = async (templateId: string) => {
    try {
      setPreviewing(true);
      
      const response = await fetch('/api/email/templates/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          variables: previewVariables
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPreview(data.preview);
      } else {
        throw new Error(data.message || 'Failed to preview template');
      }
    } catch (error) {
      console.error('Failed to preview template:', error);
      toast({
        title: "Error",
        description: "Failed to preview template",
        variant: "destructive"
      });
    } finally {
      setPreviewing(false);
    }
  };

  const startCreating = () => {
    setFormData({
      name: '',
      display_name: '',
      description: '',
      category: 'custom',
      subject_template: '',
      html_template: '',
      text_template: '',
      brand_colors: {},
      logo_url: '',
      footer_content: ''
    });
    setIsCreating(true);
    setIsEditing(true);
    setSelectedTemplate(null);
  };

  const startEditing = (template: EmailTemplate) => {
    setFormData({
      name: template.name,
      display_name: template.display_name,
      description: template.description || '',
      category: template.category,
      subject_template: template.subject_template,
      html_template: template.html_template,
      text_template: template.text_template || '',
      brand_colors: template.brand_colors || {},
      logo_url: template.logo_url || '',
      footer_content: template.footer_content || ''
    });
    setSelectedTemplate(template);
    setIsEditing(true);
    setIsCreating(false);
  };

  const copyTemplate = (template: EmailTemplate) => {
    setFormData({
      name: `${template.name}_copy`,
      display_name: `${template.display_name} (Copy)`,
      description: template.description || '',
      category: template.category,
      subject_template: template.subject_template,
      html_template: template.html_template,
      text_template: template.text_template || '',
      brand_colors: template.brand_colors || {},
      logo_url: template.logo_url || '',
      footer_content: template.footer_content || ''
    });
    setIsCreating(true);
    setIsEditing(true);
    setSelectedTemplate(null);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading email templates...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Email Templates</h2>
          <p className="text-muted-foreground">
            Manage and customize email templates for your organization
          </p>
        </div>
        <Button onClick={startCreating} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Template
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Templates List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Templates ({templates.length})
              </CardTitle>
              <CardDescription>
                Select a template to view or edit
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedTemplate?.id === template.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {template.display_name}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {template.category}
                          </Badge>
                          {template.is_system_template && (
                            <Badge variant="secondary" className="text-xs">
                              System
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreviewTemplate(template.id);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {!template.is_system_template && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditing(template);
                              }}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyTemplate(template);
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTemplate(template.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Template Editor/Viewer */}
        <div className="lg:col-span-2">
          {isEditing ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  {isCreating ? 'Create New Template' : 'Edit Template'}
                </CardTitle>
                <CardDescription>
                  {isCreating ? 'Create a new email template' : 'Modify the selected template'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="content" className="space-y-6">
                  <TabsList>
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                    <TabsTrigger value="branding">Branding</TabsTrigger>
                  </TabsList>

                  <TabsContent value="content" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Template Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="template_name"
                          disabled={!isCreating}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="display_name">Display Name</Label>
                        <Input
                          id="display_name"
                          value={formData.display_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                          placeholder="Template Display Name"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe what this template is used for..."
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject Template</Label>
                      <Input
                        id="subject"
                        value={formData.subject_template}
                        onChange={(e) => setFormData(prev => ({ ...prev, subject_template: e.target.value }))}
                        placeholder="Subject with {{variables}}"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="html">HTML Template</Label>
                      <Textarea
                        id="html"
                        value={formData.html_template}
                        onChange={(e) => setFormData(prev => ({ ...prev, html_template: e.target.value }))}
                        placeholder="HTML email content with {{variables}}"
                        rows={12}
                        className="font-mono text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="text">Text Template (Optional)</Label>
                      <Textarea
                        id="text"
                        value={formData.text_template}
                        onChange={(e) => setFormData(prev => ({ ...prev, text_template: e.target.value }))}
                        placeholder="Plain text version"
                        rows={6}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="settings" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select 
                        value={formData.category} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TEMPLATE_CATEGORIES.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category.charAt(0).toUpperCase() + category.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>

                  <TabsContent value="branding" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="logo_url">Logo URL</Label>
                      <Input
                        id="logo_url"
                        value={formData.logo_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
                        placeholder="https://example.com/logo.png"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="footer">Footer Content</Label>
                      <Textarea
                        id="footer"
                        value={formData.footer_content}
                        onChange={(e) => setFormData(prev => ({ ...prev, footer_content: e.target.value }))}
                        placeholder="Footer text or HTML"
                        rows={3}
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex items-center gap-2 pt-6 border-t">
                  <Button onClick={handleSaveTemplate} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {isCreating ? 'Create Template' : 'Save Changes'}
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsEditing(false);
                      setIsCreating(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : selectedTemplate ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {selectedTemplate.display_name}
                      {selectedTemplate.is_system_template && (
                        <Badge variant="secondary">System Template</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {selectedTemplate.description || 'No description provided'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handlePreviewTemplate(selectedTemplate.id)}
                      disabled={previewing}
                    >
                      {previewing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      Preview
                    </Button>
                    {!selectedTemplate.is_system_template && (
                      <Button 
                        size="sm"
                        onClick={() => startEditing(selectedTemplate)}
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Category:</span> {selectedTemplate.category}
                    </div>
                    <div>
                      <span className="font-medium">Usage Count:</span> {selectedTemplate.usage_count}
                    </div>
                    <div>
                      <span className="font-medium">Created:</span> {new Date(selectedTemplate.created_at).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">Last Updated:</span> {new Date(selectedTemplate.updated_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Subject Template</Label>
                    <div className="p-3 bg-muted rounded-md font-mono text-sm">
                      {selectedTemplate.subject_template}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>HTML Template</Label>
                    <div className="p-3 bg-muted rounded-md font-mono text-sm max-h-48 overflow-y-auto">
                      {selectedTemplate.html_template}
                    </div>
                  </div>

                  {preview && (
                    <div className="space-y-4 border-t pt-4">
                      <h4 className="font-medium">Preview</h4>
                      <div className="space-y-2">
                        <Label>Subject:</Label>
                        <div className="p-2 bg-muted rounded text-sm">{preview.subject}</div>
                      </div>
                      <div className="space-y-2">
                        <Label>HTML Content:</Label>
                        <div 
                          className="p-4 border rounded-lg max-h-96 overflow-y-auto"
                          dangerouslySetInnerHTML={{ __html: preview.html }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12 text-center">
                <div className="space-y-2">
                  <Mail className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-lg font-medium">No Template Selected</p>
                  <p className="text-sm text-muted-foreground">
                    Select a template from the list to view or edit it
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}