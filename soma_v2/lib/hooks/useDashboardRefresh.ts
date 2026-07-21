'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useSWRConfig } from 'swr'
import { getSupabaseClient } from '@/lib/supabase/client'

const POLL_INTERVAL_MS = 90_000 // 90 seconds fallback poll

/**
 * Hook that listens for pipeline completion events (extraction + aggregation)
 * via Supabase Realtime and automatically revalidates SWR caches so the
 * dashboard refreshes in the background without manual user action.
 *
 * Uses a three-layer refresh strategy:
 *  1. Supabase Realtime broadcast (instant when it works)
 *  2. Polling the `runs` table for status changes (reliable DB-based detection)
 *  3. SWR periodic revalidation every 90 s (guaranteed fallback)
 */
export function useDashboardRefresh(brandId: string | undefined) {
  const { mutate } = useSWRConfig()
  const channelRef = useRef<ReturnType<ReturnType<typeof getSupabaseClient>['channel']> | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastRunTsRef = useRef<string | null>(null)

  const revalidateDashboard = useCallback(() => {
    if (!brandId) return

    console.log('📡 Revalidating dashboard SWR caches for brand', brandId)

    // Revalidate all SWR keys that contain this brand's data
    mutate(
      (key: string) =>
        typeof key === 'string' &&
        (key.includes(`/api/reports/${brandId}`) ||
         key.includes(`brandId=${brandId}`) ||
         key.includes(`brand_id=${brandId}`)),
      undefined,
      { revalidate: true }
    )
  }, [brandId, mutate])

  // ─── Layer 1: Supabase Realtime broadcast ────────────────────
  useEffect(() => {
    if (!brandId) return

    const supabase = getSupabaseClient()
    const channelName = `brand:${brandId}`

    const channel = supabase
      .channel(channelName)
      .on('broadcast', { event: 'pipeline_complete' }, (payload) => {
        console.log('📡 Pipeline complete event received — refreshing dashboard data', payload)
        revalidateDashboard()
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`📡 Listening for data refresh on channel ${channelName}`)
        }
      })

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [brandId, revalidateDashboard])

  // ─── Layer 2 + 3: Poll `runs` table + periodic SWR revalidation ───
  useEffect(() => {
    if (!brandId) return

    const checkForNewRuns = async () => {
      try {
        const supabase = getSupabaseClient()
        const { data } = await supabase
          .from('runs')
          .select('completed_at')
          .eq('brand_id', brandId)
          .eq('status', 'completed')
          .order('completed_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        const latestTs = data?.completed_at ?? null

        if (latestTs && latestTs !== lastRunTsRef.current) {
          if (lastRunTsRef.current !== null) {
            // A new run completed since last check — revalidate
            console.log('📡 New completed run detected via poll — refreshing dashboard')
            revalidateDashboard()
          }
          lastRunTsRef.current = latestTs
        } else {
          // No new run — still do a background SWR revalidation (layer 3 fallback)
          revalidateDashboard()
        }
      } catch {
        // DB check failed — still revalidate as fallback
        revalidateDashboard()
      }
    }

    // Seed the latest timestamp on mount (no revalidation on first check)
    checkForNewRuns()

    pollRef.current = setInterval(checkForNewRuns, POLL_INTERVAL_MS)

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [brandId, revalidateDashboard])

  // Also expose manual trigger for other use cases
  return { revalidateDashboard }
}
