/**
 * Analytics Auth Helper
 * =====================
 * Standardised auth + brand access check for all analytics API routes.
 * Uses the canonical pattern: getCurrentUser() + account_users table.
 */

import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import type { AnalyticsContext } from '@/lib/types/analytics'

type AuthSuccess = {
  success: true
  context: AnalyticsContext
  supabase: ReturnType<typeof createServiceClient>
}

type AuthFailure = {
  success: false
  error: string
  status: number
}

type AuthResult = AuthSuccess | AuthFailure

/**
 * Authenticate the current user and verify they have access to the requested brand.
 * Returns the resolved context (accountId, brandId, brandName) or an error.
 */
export async function resolveAnalyticsContext(brandId: string | null): Promise<AuthResult> {
  if (!brandId) {
    return { success: false, error: 'brand_id is required', status: 400 }
  }

  const user = await getCurrentUser()
  if (!user?.clerkUserId) {
    return { success: false, error: 'Unauthorized', status: 401 }
  }

  const supabase = createServiceClient()

  // Get the brand and its account
  const { data: brand, error: brandError } = await supabase
    .from('brands')
    .select('id, account_id, name')
    .eq('id', brandId)
    .single()

  if (brandError || !brand) {
    return { success: false, error: 'Brand not found', status: 404 }
  }

  // Verify user has access to the brand's account
  const { data: access, error: accessError } = await supabase
    .from('account_users')
    .select('id')
    .eq('account_id', brand.account_id)
    .eq('clerk_id', user.clerkUserId)
    .eq('is_active', true)
    .single()

  if (accessError || !access) {
    return { success: false, error: 'Access denied', status: 403 }
  }

  return {
    success: true,
    context: {
      clerkUserId: user.clerkUserId,
      accountId: brand.account_id,
      brandId: brand.id,
      brandName: brand.name,
    },
    supabase,
  }
}
