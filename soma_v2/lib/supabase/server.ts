import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  // Create a supabase client on the server with project's credentials
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ 
              name, 
              value, 
              ...options,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/',
              httpOnly: name.includes('refresh') ? true : false, // Refresh tokens should be httpOnly
              // For PKCE verifier cookies, ensure they're accessible to client-side JS
              ...(name.includes('code-verifier') || name.includes('pkce') ? { httpOnly: false } : {})
            })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
            console.warn('Cookie set failed in Server Component:', error)
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ 
              name, 
              value: '', 
              ...options,
              expires: new Date(0),
              maxAge: 0 
            })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
            console.warn('Cookie removal failed in Server Component:', error)
          }
        },
      },
      auth: {
        flowType: 'pkce',
        autoRefreshToken: false, // Handled by middleware
        persistSession: true,
        debug: false, // Disable verbose Supabase logging
        // Ensure server can handle PKCE flow properly
        detectSessionInUrl: false, // Server shouldn't try to detect URL sessions
        storage: undefined, // Server uses cookies, not localStorage
        storageKey: 'sb-auth-token' // Match client-side storage key
      }
    }
  )
}

// Service client for background tasks, middleware, and other contexts
// where user authentication is not needed or available
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          'X-Client-Info': 'supabase-service-role'
        }
      }
    }
  )
}

// Enhanced server client that safely handles cookie-related errors
// IMPORTANT: Does NOT fall back to service client to prevent RLS bypass
export async function createClientSafe() {
  try {
    return await createClient()
  } catch (error) {
    console.error('Failed to create authenticated server client:', error)
    throw new Error('Could not create authenticated Supabase client. Ensure this is called from a Server Component or Route Handler.')
  }
}

// Service client for background tasks and server-side operations only
// WARNING: This bypasses RLS - never use in user-facing request handlers
export function createClientSync() {
  console.warn('createClientSync uses service role - ensure this is only used for background tasks')
  return createServiceClient()
}
