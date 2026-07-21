import { getSupabaseClient } from "@/lib/supabase/client"
import { getUserOnboardingState, hasCompletedOnboarding } from "@/lib/utils/onboarding"

export interface UserStatus {
  isAuthenticated: boolean
  hasAccount: boolean
  hasBrand: boolean
  hasCompletedOnboarding: boolean
  hasSubscription: boolean
  shouldRedirectTo: 'dashboard' | 'report' | 'onboarding' | 'signin' | null
  accountId?: string
  brandId?: string
  subscriptionStatus?: string
  billingPlan?: string
}

export interface DetailedUserStatus extends UserStatus {
  user: any
  account: any
  brand: any
  profile: any
  auditResults: any[]
}

/**
 * Comprehensive user status checker that determines where to redirect users
 * based on their authentication, account setup, onboarding completion, and subscription status
 * 
 * @param clerkUserId - Optional Clerk user ID. If not provided, attempts to use Supabase auth (deprecated)
 * @deprecated Use checkUserStatusWithClerkId with the clerkUserId from useUser() hook instead
 */
export async function checkUserStatus(clerkUserId?: string): Promise<DetailedUserStatus> {
  // Only run on client side
  if (typeof window === 'undefined') {
    return {
      isAuthenticated: false,
      hasAccount: false,
      hasBrand: false,
      hasCompletedOnboarding: false,
      hasSubscription: false,
      shouldRedirectTo: 'signin',
      user: null,
      account: null,
      brand: null,
      profile: null,
      auditResults: []
    };
  }

  const supabase = getSupabaseClient()
  
  // Initialize default status
  const status: DetailedUserStatus = {
    isAuthenticated: false,
    hasAccount: false,
    hasBrand: false,
    hasCompletedOnboarding: false,
    hasSubscription: false,
    shouldRedirectTo: 'signin',
    user: null,
    account: null,
    brand: null,
    profile: null,
    auditResults: []
  }

  try {
    // Step 1: Check if user is authenticated
    // If clerkUserId is provided, use it directly (Clerk migration path)
    // Otherwise fall back to deprecated Supabase auth
    let userId: string | null = clerkUserId || null;
    
    if (!userId) {
      // Deprecated: Supabase auth fallback
      console.warn('checkUserStatus called without clerkUserId - using deprecated Supabase auth fallback');
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        console.log('🔒 User not authenticated:', authError?.message)
        return status
      }
      userId = user.id;
      status.user = user;
    } else {
      // Clerk auth path - create a minimal user object
      status.user = { id: userId, clerkId: userId };
    }

    status.isAuthenticated = true
    console.log('✅ User authenticated:', userId)

    // Step 2: Check if user has an account (either as owner or member)
    // First check owned accounts
    const { data: ownedAccounts, error: ownedError } = await supabase
      .from('accounts')
      .select(`
        id,
        name,
        account_type,
        billing_plan,
        billing_status,
        subscription_id,
        trial_ends_at
      `)
      .eq('owner_clerk_id', userId)

    // Also check if user is a member of any accounts
    const { data: memberAccounts, error: memberError } = await supabase
      .from('account_users')
      .select(`
        account_id,
        is_active,
        account:accounts(
          id,
          name,
          account_type,
          billing_plan,
          billing_status,
          subscription_id,
          trial_ends_at
        )
      `)
      .eq('clerk_id', userId)
      .eq('is_active', true)

    if (ownedError && memberError) {
      console.error('❌ Error checking accounts:', ownedError || memberError)
      status.shouldRedirectTo = 'onboarding'
      return status
    }

    // Combine owned and member accounts, preferring owned accounts
    let account = null
    if (ownedAccounts && ownedAccounts.length > 0) {
      account = ownedAccounts[0]
    } else if (memberAccounts && memberAccounts.length > 0 && memberAccounts[0].account) {
      // Extract the nested account object from member accounts
      account = memberAccounts[0].account
    }

    if (!account) {
      console.log('❌ No account found for user')
      status.shouldRedirectTo = 'onboarding'
      return status
    }

    status.hasAccount = true
    status.account = account
    status.accountId = account.id
    status.billingPlan = account.billing_plan
    status.subscriptionStatus = account.billing_status
    console.log('✅ Account found:', { 
      id: account.id, 
      name: account.name, 
      billing_plan: account.billing_plan,
      billing_status: account.billing_status,
      accessType: ownedAccounts && ownedAccounts.length > 0 ? 'owner' : 'member'
    })

    // Step 3: Check if user has a brand
    const { data: brands, error: brandError } = await supabase
      .from('brands')
      .select('id, name, account_id')
      .eq('account_id', account.id)
      .limit(1)

    if (brandError) {
      console.error('❌ Error checking brands:', brandError)
      status.shouldRedirectTo = 'onboarding'
      return status
    }

    if (!brands || brands.length === 0) {
      console.log('❌ No brands found for account')
      status.shouldRedirectTo = 'onboarding'
      return status
    }

    status.hasBrand = true
    status.brand = brands[0]
    status.brandId = brands[0].id
    console.log('✅ Brand found:', { id: brands[0].id, name: brands[0].name })

    // Step 4: Check onboarding completion status based on REPORT GENERATION
    // Onboarding is only complete when user has generated their first report
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, clerk_id, email, full_name, onboarding_status, onboarding_completed_at, onboarding_step')
      .eq('clerk_id', userId)

    // Take the first profile if multiple exist
    const profile = profiles && profiles.length > 0 ? profiles[0] : null

    if (profileError) {
      console.error('❌ Error checking profile:', profileError)
      status.hasCompletedOnboarding = false
    } else {
      // Onboarding completion is based on report generation, not just account+brand setup
      const hasCompletedStatus = profile?.onboarding_status === 'completed'
      const hasCompletedTimestamp = profile?.onboarding_completed_at != null
      const isOnboardingCompleted = hasCompletedStatus && hasCompletedTimestamp
      
      status.hasCompletedOnboarding = isOnboardingCompleted
      
      console.log('📋 Onboarding status check:', {
        hasCompletedStatus,
        hasCompletedTimestamp,
        isOnboardingCompleted,
        onboardingStatus: profile?.onboarding_status,
        completedAt: profile?.onboarding_completed_at,
        decision: isOnboardingCompleted ? 'COMPLETED (has report)' : 'INCOMPLETE (needs report)'
      })
    }

    status.profile = profile

    // Step 5: Check for any audit results (indicates they've generated a report)
    const { data: auditResults, error: auditError } = await supabase
      .from('audit_results')
      .select('id, created_at, audit_data')
      .eq('clerk_id', userId)
      .eq('account_id', account.id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (auditError) {
      console.error('❌ Error checking audit results:', auditError)
    } else {
      status.auditResults = auditResults || []
      console.log('📊 Audit results found:', auditResults?.length || 0)
    }

    // Step 6: Determine subscription status
    // A user has a subscription if they have a paid plan and active billing status
    const hasSubscription = (
      account.billing_plan !== 'free' && 
      account.billing_status === 'active'
    ) || (
      account.billing_status === 'trialing' && 
      account.trial_ends_at && 
      new Date(account.trial_ends_at) > new Date()
    )

    status.hasSubscription = hasSubscription
    console.log('💳 Subscription status:', {
      hasSubscription,
      billing_plan: account.billing_plan,
      billing_status: account.billing_status,
      trial_ends_at: account.trial_ends_at
    })

    // Step 7: Determine where to redirect based on status
    if (!status.hasCompletedOnboarding) {
      // User hasn't completed onboarding (no report generated yet)
      if (status.hasAccount && status.hasBrand) {
        // User has account+brand setup but needs to generate report
        if (status.auditResults.length > 0) {
          // User has generated a report but onboarding not marked complete - send to dashboard
          status.shouldRedirectTo = 'dashboard'
          console.log('🔄 Redirect to: dashboard (has setup + reports, will auto-complete onboarding)')
        } else {
          // User has setup but no report - send to onboarding to generate report
          status.shouldRedirectTo = 'onboarding'
          console.log('🔄 Redirect to: onboarding (has setup but needs to generate first report)')
        }
      } else {
        // User missing account or brand setup - send to onboarding
        status.shouldRedirectTo = 'onboarding'
        console.log('🔄 Redirect to: onboarding (missing account or brand setup)')
      }
    } else {
      // User has completed onboarding (report generated)
      // All onboarded users should go to dashboard (including those without subscription)
      status.shouldRedirectTo = 'dashboard'
      console.log('🔄 Redirect to: dashboard (completed onboarding, has reports)')
    }

    return status

  } catch (error) {
    console.error('❌ Unexpected error in checkUserStatus:', error)
    // On any unexpected error, default to onboarding for authenticated users
    if (status.isAuthenticated) {
      status.shouldRedirectTo = 'onboarding'
    }
    return status
  }
}

/**
 * Simplified version that just returns the redirect destination
 */
export async function getRedirectDestination(): Promise<string> {
  const status = await checkUserStatus()
  
  switch (status.shouldRedirectTo) {
    case 'dashboard':
      // Redirect to dashboard home page (not reports)
      if (status.brandId) {
        return `/dashboard?brand=${status.brandId}`
      }
      return '/dashboard'
    case 'report':
      // Redirect to dashboard home page with brand context
      if (status.brandId) {
        return `/dashboard?brand=${status.brandId}`
      }
      return '/dashboard'
    case 'onboarding':
      return status.auditResults.length > 0 ? '/onboarding?has_results=true' : '/onboarding'
    case 'signin':
      return '/signin'
    default:
      return '/onboarding'
  }
}

/**
 * Check if user should see the report page specifically
 */
export async function shouldShowReport(): Promise<boolean> {
  const status = await checkUserStatus()
  return status.shouldRedirectTo === 'report'
}

/**
 * Get user's subscription status for UI display
 */
export async function getSubscriptionStatus(): Promise<{
  hasSubscription: boolean
  planName: string
  status: string
  trialEndsAt?: string
}> {
  // Only run on client side
  if (typeof window === 'undefined') {
    return {
      hasSubscription: false,
      planName: 'free',
      status: 'none',
      trialEndsAt: undefined
    };
  }

  const status = await checkUserStatus()
  
  return {
    hasSubscription: status.hasSubscription,
    planName: status.billingPlan || 'free',
    status: status.subscriptionStatus || 'none',
    trialEndsAt: status.account?.trial_ends_at
  }
}