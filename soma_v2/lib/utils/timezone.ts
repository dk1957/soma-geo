/**
 * Timezone Utilities
 * ==================
 *
 * Centralised helpers so that every date calculation in the platform uses
 * the account-owner's configured timezone (falling back to UTC).
 *
 * Key consumers:
 *  - LLM Run Orchestrator (determines `today` for a pipeline run)
 *  - AEO Aggregator      (filters created_at by timezone-adjusted day bounds)
 *  - Reports data route   (computes date ranges for metric queries)
 *  - Dashboard / chart    (derives "today" for filter defaults)
 */

import type { SupabaseClient } from '@supabase/supabase-js'

// ─── Constants ──────────────────────────────────────────────

export const DEFAULT_TIMEZONE = 'UTC'

// ─── Date Helpers ───────────────────────────────────────────

/**
 * Return today's date string (YYYY-MM-DD) in the given IANA timezone.
 *
 * Uses `Intl.DateTimeFormat` with the `en-CA` locale which natively
 * formats as YYYY-MM-DD, avoiding manual zero-padding.
 */
export function getDateInTimezone(tz: string = DEFAULT_TIMEZONE): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date())
  } catch {
    // Invalid timezone string – fall back to UTC
    return new Date().toISOString().split('T')[0]
  }
}

/**
 * Return the UTC ISO-8601 boundaries for a calendar date in a timezone.
 *
 * Example – `getUTCBoundsForDate('2026-04-13', 'Africa/Nairobi')`:
 *   → { start: '2026-04-12T21:00:00.000Z', end: '2026-04-13T21:00:00.000Z' }
 *
 * `start` is inclusive, `end` is exclusive (i.e. start-of-next-day).
 */
export function getUTCBoundsForDate(
  dateStr: string,
  tz: string = DEFAULT_TIMEZONE,
): { start: string; end: string } {
  try {
    // Use midday as the reference point to dodge DST-transition edge cases.
    const ref = new Date(`${dateStr}T12:00:00Z`)
    const offsetMs = getOffsetMinutes(tz, ref) * 60_000

    // Midnight in the target timezone expressed as UTC
    const midnightUtc = new Date(`${dateStr}T00:00:00Z`)
    const startUtc = new Date(midnightUtc.getTime() - offsetMs)
    const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60 * 1000)

    return { start: startUtc.toISOString(), end: endUtc.toISOString() }
  } catch {
    // Fallback: plain UTC bounds
    return {
      start: `${dateStr}T00:00:00.000Z`,
      end: new Date(new Date(`${dateStr}T00:00:00Z`).getTime() + 86_400_000).toISOString(),
    }
  }
}

/**
 * Convert an arbitrary Date to a YYYY-MM-DD string in the given timezone.
 */
export function formatDateInTimezone(date: Date, tz: string = DEFAULT_TIMEZONE): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date)
  } catch {
    return date.toISOString().split('T')[0]
  }
}

// ─── Account Timezone Lookup ────────────────────────────────

/**
 * Resolve the timezone for an account by reading the account-owner's
 * profile.  Returns `'UTC'` when no owner or no timezone is configured.
 *
 * This intentionally queries the *owner* profile – the "business day"
 * boundary should be consistent for all users within the same account.
 */
export async function getAccountTimezone(
  supabase: SupabaseClient,
  accountId: string,
): Promise<string> {
  try {
    // Find the owner of this account
    const { data: ownerRow } = await supabase
      .from('account_users')
      .select('clerk_id')
      .eq('account_id', accountId)
      .eq('role', 'owner')
      .eq('is_active', true)
      .limit(1)
      .single()

    if (!ownerRow?.clerk_id) return DEFAULT_TIMEZONE

    const { data: profile } = await supabase
      .from('profiles')
      .select('timezone')
      .eq('clerk_id', ownerRow.clerk_id)
      .single()

    return profile?.timezone || DEFAULT_TIMEZONE
  } catch {
    return DEFAULT_TIMEZONE
  }
}

// ─── Internal ───────────────────────────────────────────────

/**
 * Compute the UTC offset (in minutes) for a timezone at a specific instant.
 * Positive values = east of UTC  (e.g. +180 for Africa/Nairobi, UTC+3).
 */
function getOffsetMinutes(tz: string, at: Date = new Date()): number {
  const utcStr = at.toLocaleString('en-US', { timeZone: 'UTC' })
  const tzStr = at.toLocaleString('en-US', { timeZone: tz })
  return (new Date(tzStr).getTime() - new Date(utcStr).getTime()) / 60_000
}
