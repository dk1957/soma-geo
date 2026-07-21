/**
 * Centralized admin access control.
 *
 * Single source of truth for:
 *  - Who is an admin (env-configurable allowlist + domain)
 *  - Verifying admin status from getCurrentUser()
 *  - Guard helper for API routes (returns 401/403 NextResponse)
 *  - Audit logging for destructive actions
 */

import { NextResponse } from 'next/server'
import { getCurrentUser, type CurrentUser } from './get-current-user'
import { createServiceClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

// ── Allow-list ──────────────────────────────────────────────────────────
// Prefer env var (comma-separated). Falls back to compile-time list so
// the app works without the env var set during development.
const ENV_ADMIN_EMAILS = process.env.ADMIN_EMAILS
  ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  : null

const DEFAULT_ADMIN_EMAILS = [
  'danny.kofi.armah@gmail.com',
  'dannykofiarmah@gmail.com',
]

function getAdminEmails(): string[] {
  return ENV_ADMIN_EMAILS ?? DEFAULT_ADMIN_EMAILS
}

// ── Domain allow-list ───────────────────────────────────────────────────
const ADMIN_DOMAINS = ['withsoma.ai']

function isAdminDomain(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase()
  return !!domain && ADMIN_DOMAINS.includes(domain)
}

// ── Public helpers ──────────────────────────────────────────────────────

/**
 * Pure check — does this email have admin privileges?
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const lower = email.toLowerCase()
  return getAdminEmails().includes(lower) || isAdminDomain(lower)
}

/**
 * Extract the email from a CurrentUser in a consistent way.
 */
export function getEmailFromUser(user: CurrentUser): string {
  return (user.clerkUser?.email || user.profile?.email || '').toLowerCase()
}

/**
 * Check if a CurrentUser is admin.
 */
export function isAdmin(user: CurrentUser | null): boolean {
  if (!user) return false
  return isAdminEmail(getEmailFromUser(user))
}

// ── API route guard ─────────────────────────────────────────────────────

export interface AdminGuardResult {
  user: CurrentUser
  email: string
}

/**
 * Call at the top of every admin API route handler.
 *
 * Returns `{ user, email }` on success, or a `NextResponse` error that
 * should be returned immediately from the handler.
 *
 * Usage:
 * ```ts
 * const guard = await requireAdmin()
 * if (guard instanceof NextResponse) return guard
 * const { user, email } = guard
 * ```
 */
export async function requireAdmin(): Promise<AdminGuardResult | NextResponse> {
  const user = await getCurrentUser()

  if (!user?.clerkUserId) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 },
    )
  }

  const email = getEmailFromUser(user)

  if (!isAdminEmail(email)) {
    // Log the failed attempt
    console.warn('[Admin Auth] Access denied', {
      clerkId: user.clerkUserId,
      email,
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json(
      { error: 'Forbidden — admin access required' },
      { status: 403 },
    )
  }

  return { user, email }
}

// ── Audit logging ───────────────────────────────────────────────────────

type AdminAction =
  | 'ghost_session_start'
  | 'ghost_session_end'
  | 'account_suspend'
  | 'account_unsuspend'
  | 'account_delete'
  | 'brand_delete'
  | 'brand_toggle_auto_run'
  | 'subscription_update'
  | 'feature_flag_update'
  | 'config_update'
  | 'run_run'
  | 'policy_fix'

interface AuditEntry {
  action: AdminAction
  adminEmail: string
  targetId?: string
  targetType?: string
  metadata?: Record<string, unknown>
}

/**
 * Log an admin action to the `admin_audit_log` table.
 * Non-blocking — failures are logged to console but never throw.
 */
export async function logAdminAction(entry: AuditEntry): Promise<void> {
  try {
    const hdrs = await headers()
    const ip =
      hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      hdrs.get('x-real-ip') ||
      'unknown'
    const userAgent = hdrs.get('user-agent') || 'unknown'

    const supabase = createServiceClient()
    const { error } = await supabase.from('admin_audit_log').insert({
      action: entry.action,
      admin_email: entry.adminEmail,
      target_id: entry.targetId || null,
      target_type: entry.targetType || null,
      metadata: entry.metadata || {},
      ip_address: ip,
      user_agent: userAgent,
    })

    if (error) {
      // Table might not exist yet — log but don't crash
      console.error('[Admin Audit] Failed to log action:', error.message, entry)
    }
  } catch (err) {
    console.error('[Admin Audit] Unexpected error:', err)
  }
}
