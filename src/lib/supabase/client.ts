import { createBrowserClient } from '@supabase/ssr'
import { config } from '../config'

export function createClient() {
  // Handle missing configuration gracefully
  if (!config.database.url || !config.database.anonKey) {
    console.warn('⚠️  Supabase configuration missing. Some features will be unavailable.');
    // Return a mock client for development
    return {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        signUp: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
        signInWithPassword: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
        signOut: () => Promise.resolve({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: null }, error: null }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
            order: () => Promise.resolve({ data: [], error: null }),
            limit: () => Promise.resolve({ data: [], error: null }),
          }),
          order: () => ({
            limit: () => Promise.resolve({ data: [], error: null }),
          }),
          then: (resolve: Function) => resolve({ data: [], error: null })
        }),
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') })
          })
        }),
        update: () => ({
          eq: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') })
            })
          })
        }),
        delete: () => ({
          eq: () => Promise.resolve({ error: new Error('Supabase not configured') })
        }),
      }),
    } as any;
  }

  return createBrowserClient(
    config.database.url!,
    config.database.anonKey!
  )
}