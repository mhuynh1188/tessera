import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/workspace';
  const origin = requestUrl.origin;

  if (code) {
    const supabase = createClient(
      config.database.url,
      config.database.anonKey
    );

    try {
      const { data: authData, error: authError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (authError) {
        console.error('OAuth callback error:', authError);
        return NextResponse.redirect(`${origin}/auth/login?error=oauth_error`);
      }

      if (authData?.user) {
        // Create user profile if it doesn't exist
        const { error: profileError } = await supabase
          .from('users')
          .upsert([
            {
              id: authData.user.id,
              email: authData.user.email,
              name: authData.user.user_metadata?.full_name || 
                    authData.user.user_metadata?.name || 
                    authData.user.email?.split('@')[0],
              subscription_tier: 'free',
              subscription_status: 'trial',
              two_factor_enabled: false,
              last_login: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ], {
            onConflict: 'id'
          });

        if (profileError) {
          console.warn('Profile upsert error:', profileError);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    } catch (error) {
      console.error('Unexpected OAuth error:', error);
      return NextResponse.redirect(`${origin}/auth/login?error=unexpected_error`);
    }
  }

  // Return the user to an error page if no code is present
  return NextResponse.redirect(`${origin}/auth/login?error=no_code`);
}