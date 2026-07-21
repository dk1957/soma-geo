'use client'

import { useEffect, useState, useCallback, useRef } from 'react'

const POLL_INTERVAL_MS = 5_000 // 5 seconds while run is active

/**
 * Hook that detects whether the brand has an active (running/pending) LLM run.
 * Polls a lightweight API endpoint and returns `true` while a run is in progress.
 * Automatically stops polling once the run completes.
 */
export function useActiveRun(brandId: string | undefined) {
  const [isRunning, setIsRunning] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const checkRunStatus = useCallback(async () => {
    if (!brandId) {
      setIsRunning(false)
      return
    }

    try {
      const res = await fetch(`/api/dashboard/run-status?brand_id=${encodeURIComponent(brandId)}`)
      if (!res.ok) {
        setIsRunning(false)
        return
      }
      const json = await res.json()
      setIsRunning(!!json.running)
    } catch {
      // Silently continue — next poll will retry
    }
  }, [brandId])

  useEffect(() => {
    if (!brandId) {
      setIsRunning(false)
      return
    }

    // Initial check
    checkRunStatus()

    // Poll
    pollRef.current = setInterval(checkRunStatus, POLL_INTERVAL_MS)

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [brandId, checkRunStatus])

  return isRunning
}
