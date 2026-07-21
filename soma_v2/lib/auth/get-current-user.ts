import { auth, currentUser } from '@clerk/nextjs/server'
import { createServiceClient } from '@/lib/supabase/server'

export interface CurrentUser {
  clerkUserId: string
  profile: {
    id: string
    user_id: string | null
    clerk_id: string
    email: string
    full_name: string | null
    avatar_url: string | null
    role: string
    onboarding_status: string
    onboarding_completed_at: string | null
    created_at: string
    updated_at: string
  } | null
  clerkUser: {
    id: string
    email: string
    firstName: string | null
    lastName: string | null
    imageUrl: string | null
  } | null
}

// Simple sleep utility for retries
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Fetch Clerk `currentUser()` with retries for transient errors (e.g., 502 Bad Gateway).
 * Returns `null` if unable to fetch after retries.
 */
async function fetchClerkUserWithRetry(maxAttempts = 3, baseDelayMs = 200) {
  let attempt = 0
  while (attempt < maxAttempts) {
    try {
      const cu = await currentUser()
      return cu
    } catch (err: any) {
      // Clerk API transient error — wait and retry
      const isTransient = err && (err.status === 502 || err.clerkError || err.code === 'api_response_error')
      attempt += 1
      if (!isTransient || attempt >= maxAttempts) {
        console.dir('fetchClerkUserWithRetry failed:', { error: err, clerkErrors: err.errors }, { depth: null })
        return null
      }
      const delay = baseDelayMs * Math.pow(2, attempt - 1)
      await sleep(delay)
    }
  }
  return null
}

/**
 * Get the current authenticated user from Clerk and their Supabase profile.
 * This is the main auth helper to use in all server-side code.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const { userId: clerkUserId } = await auth()
    
    if (!clerkUserId) {
      return null
    }
    
    // Get Clerk user details
    const clerkUser = await fetchClerkUserWithRetry()
    
    // Lookup profile by clerk_id in Supabase
    const supabase = createServiceClient()
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('clerk_id', clerkUserId)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile:', error)
    }
    
    return {
      clerkUserId,
      profile: profile || null,
      clerkUser: clerkUser ? {
        id: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        imageUrl: clerkUser.imageUrl,
      } : null,
    }
  } catch (error) {
    console.error('getCurrentUser error:', error)
    return null
  }
}

/**
 * Require authentication - throws/returns error response if not authenticated.
 * Use this in API routes.
 */
export async function requireAuth(): Promise<CurrentUser> {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('Unauthorized')
  }
  
  return user
}

/**
 * Get or create a profile for the current Clerk user.
 * Called on first access after signup.
 */
export async function ensureProfile(): Promise<CurrentUser['profile']> {
  const { userId: clerkUserId } = await auth()
  
  if (!clerkUserId) {
    throw new Error('Not authenticated')
  }
  
  const clerkUser = await fetchClerkUserWithRetry()
  if (!clerkUser) {
    throw new Error('Could not fetch Clerk user')
  }
  
  const supabase = createServiceClient()
  
  // Try to get existing profile
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('clerk_id', clerkUserId)
    .single()
  
  if (existingProfile) {
    return existingProfile
  }
  
  // Create new profile
  const email = clerkUser.emailAddresses[0]?.emailAddress || ''
  const fullName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ')
  
  const { data: newProfile, error } = await supabase
    .from('profiles')
    .insert({
      clerk_id: clerkUserId,
      email,
      full_name: fullName || null,
      avatar_url: clerkUser.imageUrl || null,
      auth_provider: 'clerk',
      role: 'user',
      onboarding_status: 'never_started',
      onboarding_step: 0,
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating profile:', error)
    throw new Error('Failed to create profile')
  }
  
  return newProfile
}

/**
 * Check if the current user has completed onboarding.
 */
export async function hasCompletedOnboarding(): Promise<boolean> {
  const user = await getCurrentUser()
  
  if (!user?.profile) {
    return false
  }
  
  return user.profile.onboarding_status === 'completed' && 
         user.profile.onboarding_completed_at !== null
}

/**
 * Get the current user's account (as owner or member).
 */
export async function getCurrentUserAccount() {
  const user = await getCurrentUser()
  
  if (!user?.clerkUserId) {
    return null
  }
  
  const supabase = createServiceClient()
  
  // Check owned accounts
  const { data: ownedAccount } = await supabase
    .from('accounts')
    .select('*')
    .eq('owner_clerk_id', user.clerkUserId)
    .limit(1)
    .single()
  
  if (ownedAccount) {
    return { account: ownedAccount, role: 'owner' }
  }
  
  // Check membership
  const { data: membership } = await supabase
    .from('account_users')
    .select('*, account:accounts(*)')
    .eq('clerk_id', user.clerkUserId)
    .eq('is_active', true)
    .limit(1)
    .single()
  
  if (membership) {
    return { account: membership.account, role: membership.role }
  }
  
  return null
}
