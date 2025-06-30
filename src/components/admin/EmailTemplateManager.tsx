'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { adminGet, adminPost } from '@/lib/admin-api';
import { 
  Mail, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Copy, 
  Trash2, 
  Save, 
  Send,
  Code,
  Type,
  Settings,
  BarChart3,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  Archive
} from 'lucide-react';

// Email Template Types
interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  template_type: 'marketing' | 'transactional' | 'notification' | 'system';
  category: string;
  html_content: string;
  text_content: string;
  template_variables: Record<string, any>;
  status: 'draft' | 'active' | 'archived';
  is_system_template: boolean;
  usage_count: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  tags: string[];
  version: number;
}

interface EmailCampaign {
  id: string;
  name: string;
  template_id: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled';
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  created_at: string;
  sent_at: string | null;
}

export function EmailTemplateManager() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('templates');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch templates from API
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await adminGet('/api/admin/email-templates');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setTemplates(data.data);
          } else {
            setError('Failed to load templates');
            // Create sample data if no templates exist
            const sampleTemplates: EmailTemplate[] = [
              {
                id: 'sample-1',
                name: 'Welcome Email',
                subject: 'Welcome to {{company_name}}!',
                template_type: 'system',
                category: 'onboarding',
                html_content: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb;">Welcome to {{company_name}}!</h1>
    </div>
    <div style="background: #f8fafc; padding: 20px; border-radius: 8px;">
        <p>Hi {{user_name}},</p>
        <p>Welcome to our platform! We're excited to have you on board.</p>
        <p>If you have any questions, feel free to reach out to our support team.</p>
        <p>Best regards,<br>The {{company_name}} Team</p>
    </div>
</body>
</html>`,
                text_content: 'Welcome to {{company_name}}!\n\nHi {{user_name}},\n\nWelcome to our platform! We\'re excited to have you on board.\n\nIf you have any questions, feel free to reach out to our support team.\n\nBest regards,\nThe {{company_name}} Team',
                template_variables: {
                  company_name: { type: 'string', description: 'Company name' },
                  user_name: { type: 'string', description: 'User full name' }
                },
                status: 'active',
                is_system_template: false,
                usage_count: 0,
                last_used_at: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                created_by: 'system',
                tags: ['welcome', 'onboarding'],
                version: 1
              }
            ];
            setTemplates(sampleTemplates);
          }
        } else {
          setError('Failed to fetch templates');
        }
      } catch (err) {
        console.error('Error fetching templates:', err);
        setError('Error loading templates');
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  // Get unique template types for filter
  const templateTypes = [...new Set(templates.map(t => t.template_type))];
  
  // Get unique categories for filter
  const categories = [...new Set(templates.map(t => t.category))];

  // Filter templates based on search and filters
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'all' || template.template_type === filterType;
    const matchesStatus = filterStatus === 'all' || template.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Handle template creation/editing
  const handleSaveTemplate = async (templateData: Partial<EmailTemplate>) => {
    try {
      if (selectedTemplate) {
        // Update existing template
        const response = await fetch(`/api/admin/email-templates/${selectedTemplate.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(templateData),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setTemplates(templates.map(t => 
              t.id === selectedTemplate.id 
                ? { ...t, ...templateData, updated_at: new Date().toISOString() }
                : t
            ));
            toast({ title: "Template updated successfully" });
          } else {
            toast({ title: "Error updating template", variant: "destructive" });
          }
        } else {
          toast({ title: "Error updating template", variant: "destructive" });
        }
      } else {
        // Create new template
        const response = await adminPost('/api/admin/email-templates', templateData);

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setTemplates([...templates, data.data]);
            toast({ title: "Template created successfully" });
          } else {
            toast({ title: "Error creating template", variant: "destructive" });
          }
        } else {
          toast({ title: "Error creating template", variant: "destructive" });
        }
      }
    } catch (error) {
      toast({ title: "Error saving template", variant: "destructive" });
    }
  };

  // Handle template deletion
  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/email-templates/${templateId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTemplates(templates.filter(t => t.id !== templateId));
        toast({ title: "Template deleted successfully" });
      } else {
        toast({ title: "Error deleting template", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error deleting template", variant: "destructive" });
    }
  };

  // Handle template duplication
  const handleDuplicateTemplate = async (template: EmailTemplate) => {
    const duplicatedTemplate = {
      ...template,
      name: `${template.name} (Copy)`,
      status: 'draft' as const,
      is_system_template: false,
      usage_count: 0,
      last_used_at: null,
      version: 1
    };
    
    delete (duplicatedTemplate as any).id;
    delete (duplicatedTemplate as any).created_at;
    delete (duplicatedTemplate as any).updated_at;
    
    await handleSaveTemplate(duplicatedTemplate);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Email Templates</h2>
          <p className="text-muted-foreground">
            Create and manage email templates for your organization
          </p>
        </div>
        <Button 
          onClick={() => {
            setSelectedTemplate(null);
            setIsEditing(true);
          }}
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create Template</span>
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.length}</div>
            <p className="text-xs text-muted-foreground">
              {templates.filter(t => t.status === 'active').length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Templates</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.filter(t => t.is_system_template).length}</div>
            <p className="text-xs text-muted-foreground">
              Built-in templates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {templates.reduce((acc, t) => acc + t.usage_count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Emails sent using templates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="text-xs text-muted-foreground">
              Template categories
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {templateTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Templates Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                      <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {template.subject}
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedTemplate(template);
                            setIsPreviewMode(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedTemplate(template);
                            setIsEditing(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicateTemplate(template)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        {!template.is_system_template && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTemplate(template.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={template.status === 'active' ? 'default' : template.status === 'draft' ? 'secondary' : 'outline'}>
                          {template.status}
                        </Badge>
                        <Badge variant="outline">
                          {template.template_type}
                        </Badge>
                        {template.is_system_template && (
                          <Badge variant="outline">
                            System
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Used {template.usage_count} times</span>
                        <span>v{template.version}</span>
                      </div>
                      
                      {template.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {template.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {template.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{template.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!loading && !error && filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No templates found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || filterType !== 'all' || filterStatus !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Create your first email template to get started'}
              </p>
              <Button
                onClick={() => {
                  setSelectedTemplate(null);
                  setIsEditing(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="text-center py-12">
            <Send className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">Email Campaigns</h3>
            <p className="text-muted-foreground mb-4">
              Campaign management coming soon
            </p>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">Email Analytics</h3>
            <p className="text-muted-foreground mb-4">
              Analytics dashboard coming soon
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Template Editor Modal */}
      {isEditing && (
        <EmailTemplateEditor
          template={selectedTemplate}
          onSave={async (templateData) => {
            await handleSaveTemplate(templateData);
            setIsEditing(false);
            setSelectedTemplate(null);
          }}
          onCancel={() => {
            setIsEditing(false);
            setSelectedTemplate(null);
          }}
        />
      )}

      {/* Template Preview Modal */}
      {isPreviewMode && selectedTemplate && (
        <EmailTemplatePreview
          template={selectedTemplate}
          onClose={() => {
            setIsPreviewMode(false);
            setSelectedTemplate(null);
          }}
        />
      )}
    </div>
  );
}

// Email Template Editor Component
interface EmailTemplateEditorProps {
  template: EmailTemplate | null;
  onSave: (template: Partial<EmailTemplate>) => void;
  onCancel: () => void;
}

function EmailTemplateEditor({ template, onSave, onCancel }: EmailTemplateEditorProps) {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    subject: template?.subject || '',
    template_type: template?.template_type || 'transactional',
    category: template?.category || '',
    html_content: template?.html_content || '',
    text_content: template?.text_content || '',
    template_variables: template?.template_variables || {},
    tags: template?.tags?.join(', ') || '',
    status: template?.status || 'draft'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Parse template variables from HTML content
    const variableMatches = formData.html_content.match(/{{[\s]*([^}]+)[\s]*}}/g);
    const variables: Record<string, any> = {};
    
    if (variableMatches) {
      variableMatches.forEach(match => {
        const varName = match.replace(/[{}]/g, '').trim();
        if (!variables[varName]) {
          variables[varName] = {
            type: 'string',
            description: `Variable: ${varName}`
          };
        }
      });
    }

    onSave({
      ...formData,
      template_variables: variables,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold">
            {template ? 'Edit Template' : 'Create New Template'}
          </h3>
          <Button variant="ghost" onClick={onCancel}>✕</Button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="subject">Email Subject</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="template_type">Template Type</Label>
              <Select value={formData.template_type} onValueChange={(value) => setFormData({ ...formData, template_type: value as any })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transactional">Transactional</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="notification">Notification</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as any })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="html_content">HTML Content</Label>
            <Textarea
              id="html_content"
              value={formData.html_content}
              onChange={(e) => setFormData({ ...formData, html_content: e.target.value })}
              rows={10}
              className="font-mono text-sm"
              placeholder="Enter HTML content with variables like {{user_name}}"
            />
          </div>

          <div>
            <Label htmlFor="text_content">Text Content (fallback)</Label>
            <Textarea
              id="text_content"
              value={formData.text_content}
              onChange={(e) => setFormData({ ...formData, text_content: e.target.value })}
              rows={6}
              placeholder="Enter plain text version of the email"
            />
          </div>

          <div>
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="welcome, onboarding, system"
            />
          </div>
          
          <div className="flex items-center justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {template ? 'Update Template' : 'Create Template'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Email Template Preview Component
interface EmailTemplatePreviewProps {
  template: EmailTemplate;
  onClose: () => void;
}

function EmailTemplatePreview({ template, onClose }: EmailTemplatePreviewProps) {
  const [previewData, setPreviewData] = useState<Record<string, string>>({});
  const [previewMode, setPreviewMode] = useState<'html' | 'text'>('html');

  // Initialize preview data with sample values
  useEffect(() => {
    const sampleData: Record<string, string> = {};
    Object.keys(template.template_variables).forEach(key => {
      switch (key) {
        case 'company_name':
          sampleData[key] = 'Acme Corporation';
          break;
        case 'user_name':
          sampleData[key] = 'John Doe';
          break;
        case 'reset_url':
          sampleData[key] = 'https://example.com/reset-password';
          break;
        case 'current_year':
          sampleData[key] = new Date().getFullYear().toString();
          break;
        default:
          sampleData[key] = `[${key}]`;
      }
    });
    setPreviewData(sampleData);
  }, [template]);

  // Replace template variables with preview data
  const replaceVariables = (content: string) => {
    let processedContent = content;
    Object.entries(previewData).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      processedContent = processedContent.replace(regex, value);
    });
    return processedContent;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h3 className="text-lg font-semibold">{template.name}</h3>
            <p className="text-sm text-muted-foreground">{replaceVariables(template.subject)}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Tabs value={previewMode} onValueChange={(value) => setPreviewMode(value as 'html' | 'text')}>
              <TabsList>
                <TabsTrigger value="html">HTML</TabsTrigger>
                <TabsTrigger value="text">Text</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="ghost" onClick={onClose}>✕</Button>
          </div>
        </div>
        
        <div className="p-6 h-96 overflow-auto">
          {previewMode === 'html' ? (
            <div 
              className="border rounded-lg p-4 bg-white min-h-full"
              dangerouslySetInnerHTML={{ 
                __html: replaceVariables(template.html_content) 
              }}
            />
          ) : (
            <pre className="whitespace-pre-wrap text-sm font-mono bg-gray-50 p-4 rounded-lg min-h-full">
              {replaceVariables(template.text_content || '')}
            </pre>
          )}
        </div>
        
        {Object.keys(template.template_variables).length > 0 && (
          <div className="p-6 border-t">
            <h4 className="font-medium mb-3">Template Variables</h4>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(template.template_variables).map(([key, config]) => (
                <div key={key}>
                  <Label htmlFor={key} className="text-sm font-medium">
                    {key} ({config.type})
                  </Label>
                  <Input
                    id={key}
                    value={previewData[key] || ''}
                    onChange={(e) => setPreviewData({ ...previewData, [key]: e.target.value })}
                    placeholder={config.description}
                    className="mt-1"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}