// Email templates management API
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const isSystemTemplate = searchParams.get('system');

    let query = supabase
      .from('email_templates')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    if (isSystemTemplate !== null) {
      query = query.eq('is_system_template', isSystemTemplate === 'true');
    }

    const { data: templates, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      templates: templates || [],
      total: templates?.length || 0
    });

  } catch (error) {
    console.error('Failed to fetch email templates:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch email templates',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const templateData = await request.json();

    // Validate required fields
    const requiredFields = ['name', 'display_name', 'subject_template', 'html_template'];
    const missingFields = requiredFields.filter(field => !templateData[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          missing_fields: missingFields
        },
        { status: 400 }
      );
    }

    // Security: Sanitize template name (alphanumeric, underscore, hyphen only)
    const sanitizedName = templateData.name.replace(/[^a-zA-Z0-9_-]/g, '');
    if (sanitizedName !== templateData.name) {
      return NextResponse.json(
        { 
          error: 'Template name contains invalid characters. Use only letters, numbers, underscore, and hyphen.'
        },
        { status: 400 }
      );
    }

    // Check if template name already exists
    const { data: existingTemplate } = await supabase
      .from('email_templates')
      .select('id')
      .eq('name', sanitizedName)
      .single();

    if (existingTemplate) {
      return NextResponse.json(
        { error: 'Template name already exists' },
        { status: 409 }
      );
    }

    // Create new template
    const { data: newTemplate, error } = await supabase
      .from('email_templates')
      .insert({
        name: sanitizedName,
        display_name: templateData.display_name,
        description: templateData.description || '',
        category: templateData.category || 'custom',
        subject_template: templateData.subject_template,
        html_template: templateData.html_template,
        text_template: templateData.text_template || '',
        variables: templateData.variables || [],
        default_variables: templateData.default_variables || {},
        brand_colors: templateData.brand_colors || {},
        logo_url: templateData.logo_url || '',
        footer_content: templateData.footer_content || '',
        is_system_template: false, // Custom templates are never system templates
        is_active: true
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Email template created successfully',
      template: newTemplate
    }, { status: 201 });

  } catch (error) {
    console.error('Failed to create email template:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create email template',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();
    const templateData = await request.json();

    if (!templateData.id) {
      return NextResponse.json(
        { error: 'Template ID is required for updates' },
        { status: 400 }
      );
    }

    // Security: Prevent updating system templates
    const { data: existingTemplate } = await supabase
      .from('email_templates')
      .select('is_system_template')
      .eq('id', templateData.id)
      .single();

    if (existingTemplate?.is_system_template) {
      return NextResponse.json(
        { error: 'Cannot modify system templates' },
        { status: 403 }
      );
    }

    // Update template
    const { data: updatedTemplate, error } = await supabase
      .from('email_templates')
      .update({
        display_name: templateData.display_name,
        description: templateData.description,
        category: templateData.category,
        subject_template: templateData.subject_template,
        html_template: templateData.html_template,
        text_template: templateData.text_template,
        variables: templateData.variables,
        default_variables: templateData.default_variables,
        brand_colors: templateData.brand_colors,
        logo_url: templateData.logo_url,
        footer_content: templateData.footer_content,
        updated_at: new Date().toISOString()
      })
      .eq('id', templateData.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Email template updated successfully',
      template: updatedTemplate
    });

  } catch (error) {
    console.error('Failed to update email template:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update email template',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('id');

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    // Security: Prevent deleting system templates
    const { data: existingTemplate } = await supabase
      .from('email_templates')
      .select('is_system_template, name')
      .eq('id', templateId)
      .single();

    if (existingTemplate?.is_system_template) {
      return NextResponse.json(
        { error: 'Cannot delete system templates' },
        { status: 403 }
      );
    }

    // Soft delete: mark as inactive instead of hard delete
    const { error } = await supabase
      .from('email_templates')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', templateId);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Email template deleted successfully'
    });

  } catch (error) {
    console.error('Failed to delete email template:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete email template',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}