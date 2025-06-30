import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
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
    const { html_content, text_content, subject, variables } = body;

    if (!html_content && !text_content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Replace template variables with provided values
    const replaceVariables = (content: string, vars: Record<string, string>) => {
      let processedContent = content;
      Object.entries(vars || {}).forEach(([key, value]) => {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        processedContent = processedContent.replace(regex, value || `[${key}]`);
      });
      return processedContent;
    };

    const processedData = {
      html_content: html_content ? replaceVariables(html_content, variables) : '',
      text_content: text_content ? replaceVariables(text_content, variables) : '',
      subject: subject ? replaceVariables(subject, variables) : ''
    };

    return NextResponse.json({
      success: true,
      data: processedData
    });

  } catch (error) {
    console.error('Error processing email template preview:', error);
    return NextResponse.json(
      { error: 'Failed to process template preview' },
      { status: 500 }
    );
  }
}