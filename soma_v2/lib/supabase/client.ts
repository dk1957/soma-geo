import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Create a supabase client on the browser with project's credentials
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'pkce',
        autoRefreshToken: true,
        persistSession: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 'sb-auth-token',
        debug: false, // Disable verbose Supabase logging
        // Enhanced settings for consistent session management
        detectSessionInUrl: true
      },
      cookieOptions: {
        name: 'sb-auth-token',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 100 * 365 * 24 * 60 * 60 // 100 years
      },
      global: {
        headers: {
          'X-Client-Info': 'supabase-js-web',
          'X-Client-Platform': 'web',
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    }
  )
}

// Singleton instance for consistent client usage across the app
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

// Enhanced getSupabaseClient that ensures proper PKCE initialization
export function getSupabaseClient() {
  if (typeof window === 'undefined') {
    throw new Error('getSupabaseClient should only be called on the client side')
  }
  
  if (!supabaseClient) {
    supabaseClient = createClient()
    
    // Ensure PKCE flow is properly initialized by checking localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      // Clear any stale PKCE state that might interfere
      const pkceKeys = Object.keys(localStorage).filter(key => 
        key.includes('pkce') || 
        key.includes('code-verifier') || 
        key.includes('flow-state')
      )
      
      // Only clear if they're older than 10 minutes (stale)
      pkceKeys.forEach(key => {
        try {
          const item = localStorage.getItem(key)
          if (item) {
            const parsed = JSON.parse(item)
            const timestamp = parsed.timestamp || parsed.created_at
            if (timestamp && Date.now() - timestamp > 10 * 60 * 1000) {
              localStorage.removeItem(key)
              // Removed verbose logging for cleaner output
            }
          }
        } catch (e) {
          // If we can't parse it, it might be stale - remove it
          localStorage.removeItem(key)
        }
      })
    }
  }
  
  return supabaseClient
}
