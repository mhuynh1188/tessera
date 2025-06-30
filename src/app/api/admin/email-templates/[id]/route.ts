import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    const { data: orgMember } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    if (!orgMember || !['admin', 'owner'].includes(orgMember.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const templateId = params.id;

    // Verify the template belongs to the same organization
    const { data: existingTemplate } = await supabase
      .from('email_templates')
      .select('organization_id, version')
      .eq('id', templateId)
      .single();

    if (!existingTemplate || existingTemplate.organization_id !== orgMember.organization_id) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Update template
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (body.name) updateData.name = body.name;
    if (body.subject) updateData.subject = body.subject;
    if (body.template_type) updateData.template_type = body.template_type;
    if (body.category) updateData.category = body.category;
    if (body.html_content !== undefined) updateData.html_content = body.html_content;
    if (body.text_content !== undefined) updateData.text_content = body.text_content;
    if (body.template_variables) updateData.template_variables = body.template_variables;
    if (body.status) updateData.status = body.status;
    if (body.tags) updateData.tags = body.tags;
    
    // Increment version if content changed
    if (body.html_content !== undefined || body.text_content !== undefined) {
      updateData.version = (existingTemplate.version || 1) + 1;
    }

    const { data: updatedTemplate, error: updateError } = await supabase
      .from('email_templates')
      .update(updateData)
      .eq('id', templateId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating email template:', updateError);
      return NextResponse.json({ error: 'Failed to update email template' }, { status: 500 });
    }

    // Log the action
    await supabase
      .from('admin_activity_logs')
      .insert({
        user_id: user.id,
        organization_id: orgMember.organization_id,
        action: 'template_updated',
        resource_type: 'email_template',
        resource_id: templateId,
        details: `Updated email template: ${updatedTemplate.name}`,
        success: true
      });

    return NextResponse.json({
      success: true,
      data: updatedTemplate
    });

  } catch (error) {
    console.error('Error updating email template:', error);
    return NextResponse.json(
      { error: 'Failed to update email template' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    const { data: orgMember } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    if (!orgMember || !['admin', 'owner'].includes(orgMember.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const templateId = params.id;

    // Verify the template belongs to the same organization and get template info
    const { data: existingTemplate } = await supabase
      .from('email_templates')
      .select('organization_id, name, is_system_template')
      .eq('id', templateId)
      .single();

    if (!existingTemplate || existingTemplate.organization_id !== orgMember.organization_id) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Prevent deletion of system templates
    if (existingTemplate.is_system_template) {
      return NextResponse.json({ error: 'Cannot delete system templates' }, { status: 403 });
    }

    // Delete the template
    const { error: deleteError } = await supabase
      .from('email_templates')
      .delete()
      .eq('id', templateId);

    if (deleteError) {
      console.error('Error deleting email template:', deleteError);
      return NextResponse.json({ error: 'Failed to delete email template' }, { status: 500 });
    }

    // Log the action
    await supabase
      .from('admin_activity_logs')
      .insert({
        user_id: user.id,
        organization_id: orgMember.organization_id,
        action: 'template_deleted',
        resource_type: 'email_template',
        resource_id: templateId,
        details: `Deleted email template: ${existingTemplate.name}`,
        success: true
      });

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting email template:', error);
    return NextResponse.json(
      { error: 'Failed to delete email template' },
      { status: 500 }
    );
  }
}