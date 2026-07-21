import { getSupabaseClient } from '@/lib/supabase/client';

// Helper function to get safe Supabase client
function getSafeSupabaseClient() {
  try {
    return getSupabaseClient();
  } catch (error) {
    console.warn('Failed to get Supabase client:', error);
    return null;
  }
}

export type OnboardingStatus = 'never_started' | 'in_progress' | 'completed' | 'abandoned';

export interface OnboardingState {
  user_id: string;
  onboarding_status: OnboardingStatus;
  onboarding_step: number;
  onboarding_started_at?: string;
  onboarding_completed_at?: string;
  onboarding_metadata: Record<string, any>;
}

export interface OnboardingUpdateParams {
  status: OnboardingStatus;
  step?: number;
  metadata?: Record<string, any>;
}

/**
 * Get the current onboarding status for a user
 * Uses API route to bypass RLS (Clerk auth, not Supabase auth)
 */
export async function getUserOnboardingStatus(clerkUserId: string): Promise<OnboardingStatus> {
    try {
        const response = await fetch('/api/onboarding/status')
        if (!response.ok) return 'never_started'
        const { data } = await response.json()
        return (data?.onboarding_status as OnboardingStatus) || 'never_started'
    } catch (error) {
        console.error('Error fetching onboarding status:', error);
        return 'never_started';
    }
}

/**
 * Get the full onboarding state for a user
 * Uses API route to bypass RLS (Clerk auth, not Supabase auth)
 */
export async function getUserOnboardingState(clerkUserId: string): Promise<OnboardingState | null> {
    try {
        const response = await fetch('/api/onboarding/status')
        if (!response.ok) return null
        const { data } = await response.json()
        return data as OnboardingState || null
    } catch (error) {
        console.error('Error fetching onboarding state:', error);
        return null;
    }
}

/**
 * Update the onboarding status for a user
 * Routes through API to use service role (bypasses RLS)
 */
export async function updateOnboardingStatus(
  clerkUserId: string, 
  params: OnboardingUpdateParams
): Promise<OnboardingState | null> {
  console.log('🔄 updateOnboardingStatus called:', { clerkUserId, params })
  
  try {
    const response = await fetch('/api/onboarding/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: params.status,
        step: params.step,
        metadata: params.metadata
      })
    })

    if (!response.ok) {
      console.error('❌ API update failed:', response.status, response.statusText)
      return null
    }

    const { data } = await response.json()
    console.log('✅ Onboarding status updated via API:', data)
    return data as OnboardingState
  } catch (error) {
    console.error('❌ Unexpected error updating onboarding status:', error);
    return null;
  }
}

/**
 * Start onboarding for a user (transition from never_started to in_progress)
 * @param clerkUserId - The Clerk user ID (not the Supabase user ID)
 */
export async function startOnboarding(clerkUserId: string, metadata?: Record<string, any>): Promise<OnboardingState | null> {
  // Check if user has already completed onboarding (especially with report generation)
  const currentState = await getUserOnboardingState(clerkUserId);
  if (currentState?.onboarding_status === 'completed' && 
      currentState?.onboarding_metadata?.completed_via === 'report_generation') {
    console.log(`User ${clerkUserId} has already completed onboarding with report - not restarting`);
    return currentState;
  }

  return updateOnboardingStatus(clerkUserId, {
    status: 'in_progress',
    step: 1,
    metadata: {
      started_at: new Date().toISOString(),
      ...metadata
    }
  });
}

/**
 * Complete onboarding for a user using the API route
 * @param clerkUserId - The Clerk user ID (not the Supabase user ID)
 */
export async function completeOnboarding(clerkUserId: string, metadata?: Record<string, any>): Promise<OnboardingState | null> {
  console.log('🔄 completeOnboarding called for user:', clerkUserId, 'with metadata:', metadata)
  
  // Check if user is already completed with report generation - if so, don't change anything
  const currentState = await getUserOnboardingState(clerkUserId);
  console.log('📋 Current onboarding state:', currentState)
  
  if (currentState?.onboarding_status === 'completed' && 
      currentState?.onboarding_metadata?.completed_via === 'report_generation') {
    console.log(`✅ User ${clerkUserId} already completed onboarding with report - preserving existing completion`);
    return currentState;
  }

  try {
    const response = await fetch('/api/onboarding/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'complete',
        metadata: {
          completed_via: metadata?.completed_via || 'application_flow',
          ...metadata
        }
      })
    })

    if (!response.ok) {
      console.error('❌ API completion failed:', response.status)
      // Fallback to regular update
      return updateOnboardingStatus(clerkUserId, {
        status: 'completed',
        step: 100,
        metadata: {
          completed_at: new Date().toISOString(),
          completed_via: 'fallback_method',
          ...metadata
        }
      });
    }

    const { data } = await response.json()
    console.log('✅ Onboarding completion successful via API:', data)
    return data as OnboardingState
  } catch (error) {
    console.error('❌ Error in completeOnboarding:', error);
    return updateOnboardingStatus(clerkUserId, {
      status: 'completed',
      step: 100,
      metadata: {
        completed_at: new Date().toISOString(),
        completed_via: 'error_fallback',
        ...metadata
      }
    });
  }
}

/**
 * Update onboarding step progress
 * @param clerkUserId - The Clerk user ID (not the Supabase user ID)
 */
export async function updateOnboardingStep(
  clerkUserId: string, 
  step: number, 
  metadata?: Record<string, any>
): Promise<OnboardingState | null> {
  // Check if we should preserve completed status
  if (metadata?.preserve_completed_status) {
    // Get current status first
    const currentState = await getUserOnboardingState(clerkUserId);
    if (currentState?.onboarding_status === 'completed') {
      console.log('🔒 Preserving completed onboarding status for user:', clerkUserId);
      
      // DON'T update the database - just return current state to preserve completion
      // Return current state with updated step for local tracking
      return {
        ...currentState,
        onboarding_step: step,
        onboarding_metadata: {
          ...currentState.onboarding_metadata,
          ...metadata,
          step_updated_at: new Date().toISOString()
        }
      };
    }
  }
  
  // Default behavior - set to in_progress
  return updateOnboardingStatus(clerkUserId, {
    status: 'in_progress',
    step,
    metadata
  });
}

/**
 * Mark onboarding as abandoned
 * @param clerkUserId - The Clerk user ID (not the Supabase user ID)
 */
export async function abandonOnboarding(clerkUserId: string, reason?: string): Promise<OnboardingState | null> {
  // Check if user has already completed onboarding (especially with report generation)
  const currentState = await getUserOnboardingState(clerkUserId);
  if (currentState?.onboarding_status === 'completed' && 
      currentState?.onboarding_metadata?.completed_via === 'report_generation') {
    console.log(`User ${clerkUserId} has already completed onboarding with report - cannot abandon`);
    return currentState;
  }

  return updateOnboardingStatus(clerkUserId, {
    status: 'abandoned',
    metadata: {
      abandoned_at: new Date().toISOString(),
      abandon_reason: reason || 'User abandoned process'
    }
  });
}

/**
 * Check if user needs to go through onboarding
 */
export function shouldStartOnboarding(onboardingState: OnboardingState | null): boolean {
  if (!onboardingState) return true;
  return onboardingState.onboarding_status === 'never_started';
}

/**
 * Check if user is currently in onboarding process
 */
export function isOnboardingInProgress(onboardingState: OnboardingState | null): boolean {
  if (!onboardingState) return false;
  return onboardingState.onboarding_status === 'in_progress';
}

/**
 * Check if user has completed onboarding with UNIFIED logic
 * This ensures consistency across all parts of the application
 */
export function hasCompletedOnboarding(onboardingState: OnboardingState | null): boolean {
  if (!onboardingState) return false;
  
  // UNIFIED COMPLETION LOGIC: Must have BOTH status = 'completed' AND completed_at timestamp
  const hasCompletedStatus = onboardingState.onboarding_status === 'completed';
  const hasCompletedTimestamp = onboardingState.onboarding_completed_at != null;
  
  return hasCompletedStatus && hasCompletedTimestamp;
}

/**
 * Get the appropriate redirect path based on onboarding status
 */
export function getOnboardingRedirectPath(onboardingState: OnboardingState | null): string {
  if (!onboardingState || shouldStartOnboarding(onboardingState)) {
    return '/onboarding';
  }
  
  if (isOnboardingInProgress(onboardingState)) {
    return '/onboarding';
  }
  
  if (hasCompletedOnboarding(onboardingState)) {
    return '/dashboard';
  }
  
  // Default fallback
  return '/onboarding';
}

/**
 * Determine user journey state for UI decisions
 */
export interface UserJourneyState {
  needsOnboarding: boolean;
  isInOnboarding: boolean;
  hasCompleted: boolean;
  currentStep: number;
  redirectPath: string;
  canAccessDashboard: boolean;
}

export function getUserJourneyState(onboardingState: OnboardingState | null): UserJourneyState {
  const needsOnboarding = shouldStartOnboarding(onboardingState);
  const isInOnboarding = isOnboardingInProgress(onboardingState);
  const hasCompleted = hasCompletedOnboarding(onboardingState);
  const currentStep = onboardingState?.onboarding_step || 0;
  const redirectPath = getOnboardingRedirectPath(onboardingState);
  const canAccessDashboard = hasCompleted;

  return {
    needsOnboarding,
    isInOnboarding,
    hasCompleted,
    currentStep,
    redirectPath,
    canAccessDashboard
  };
}

/**
 * Helper to get user ID from Clerk auth
 * @deprecated Use Clerk's useUser() hook in components instead and pass the user.id directly
 * This function is kept for backwards compatibility but returns null since we migrated to Clerk
 * Components should use: const { user } = useUser(); then pass user.id to utility functions
 */
export async function getCurrentUserId(): Promise<string | null> {
  // DEPRECATED: This function previously used Supabase auth
  // Since migrating to Clerk, components should use useUser() hook directly
  // and pass the clerkUserId to utility functions
  console.warn('getCurrentUserId is deprecated. Use Clerk useUser() hook instead.');
  return null;
}

/**
 * Get current user's onboarding journey state
 * @deprecated Use getUserJourneyState() with clerkUserId from useUser() hook instead.
 * This function relies on the deprecated getCurrentUserId() and will always return null.
 */
export async function getCurrentUserJourneyState(): Promise<UserJourneyState | null> {
  console.warn('getCurrentUserJourneyState is deprecated. Use getUserJourneyState() with clerkUserId from useUser() hook instead.');
  try {
    const clerkUserId = await getCurrentUserId();
    if (!clerkUserId) return null;

    const onboardingState = await getUserOnboardingState(clerkUserId);
    return getUserJourneyState(onboardingState);
  } catch (error) {
    console.error('Error getting current user journey state:', error);
    return null;
  }
}

/**
 * Synchronize onboarding completion status - simplified for profiles table only
 * This ensures completion status is consistent in the profiles table
 * @param clerkUserId - The Clerk user ID (not the Supabase user ID)
 */
export async function syncOnboardingCompletionStatus(clerkUserId: string, supabaseClient?: any): Promise<boolean> {
  try {
    const supabase = supabaseClient || getSafeSupabaseClient();
    if (!supabase) {
      console.warn('No Supabase client available for sync');
      return false;
    }

    // Get current state from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('onboarding_status, onboarding_completed_at')
      .eq('clerk_id', clerkUserId)
      .single();

    if (profileError) {
      console.error('Error fetching profile for sync:', profileError);
      return false;
    }

    // Check if completion status is inconsistent and fix it
    const hasCompletedAt = profile?.onboarding_completed_at !== null;
    const statusIsCompleted = profile?.onboarding_status === 'completed';

    // If user has completion timestamp but status is not completed, fix it
    if (hasCompletedAt && !statusIsCompleted) {
      const { error: updateError } = await supabase.rpc('update_onboarding_status', {
        p_clerk_id: clerkUserId,
        p_status: 'completed',
        p_step: 5, // Final step
        p_metadata: { synced_at: new Date().toISOString() }
      });

      if (updateError) {
        console.error('Error syncing onboarding status:', updateError);
        return false;
      }

      console.log('✅ Synced onboarding status to completed for user:', clerkUserId);
      return true;
    }

    return false; // No sync needed
  } catch (error) {
    console.error('Error syncing onboarding completion status:', error);
    return false;
  }
}