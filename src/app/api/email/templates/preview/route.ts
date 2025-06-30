// Email template preview API
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { templateId, variables } = await request.json();

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    // Get template
    const { data: template, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', templateId)
      .eq('is_active', true)
      .single();

    if (error || !template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Merge provided variables with template defaults
    const mergedVariables = {
      ...template.default_variables,
      ...variables,
      // Add safe defaults for common variables
      user_name: variables?.user_name || 'John Doe',
      organization_name: variables?.organization_name || 'Demo Company',
      dashboard_link: variables?.dashboard_link || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      app_name: 'Hex App',
      current_year: new Date().getFullYear().toString(),
      preview_mode: true
    };

    // Simple template variable replacement
    const renderTemplate = (templateString: string, vars: Record<string, any>) => {
      return templateString.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        const value = vars[key];
        return value !== undefined ? String(value) : match;
      });
    };

    // Render subject and content
    const renderedSubject = renderTemplate(template.subject_template, mergedVariables);
    const renderedHtml = renderTemplate(template.html_template, mergedVariables);
    const renderedText = template.text_template ? 
      renderTemplate(template.text_template, mergedVariables) : 
      '';

    // Extract variables used in template for UI
    const getTemplateVariables = (templateString: string) => {
      const matches = templateString.match(/\{\{(\w+)\}\}/g);
      return matches ? matches.map(match => match.replace(/[\{\}]/g, '')) : [];
    };

    const usedVariables = [
      ...getTemplateVariables(template.subject_template),
      ...getTemplateVariables(template.html_template),
      ...(template.text_template ? getTemplateVariables(template.text_template) : [])
    ];

    const uniqueVariables = [...new Set(usedVariables)];

    return NextResponse.json({
      success: true,
      preview: {
        subject: renderedSubject,
        html: renderedHtml,
        text: renderedText
      },
      template_info: {
        id: template.id,
        name: template.name,
        display_name: template.display_name,
        category: template.category
      },
      variables_used: uniqueVariables,
      variables_provided: Object.keys(mergedVariables)
    });

  } catch (error) {
    console.error('Failed to preview email template:', error);
    return NextResponse.json(
      { 
        error: 'Failed to preview email template',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}