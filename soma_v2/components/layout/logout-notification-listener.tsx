"use client"

import { useEffect } from "react"
import { useToast } from "@/components/layout/notification-toast"

/**
 * Component that listens for logout events and provides user feedback
 * about the cache clearing process to prevent cross-user data leakage
 */
export function LogoutNotificationListener() {
  const { addToast } = useToast()

  useEffect(() => {
    const handleLogoutStart = () => {
      addToast({
        type: "info",
        title: "Signing Out",
        message: "Clearing your data to protect your privacy...",
        duration: 3000
      })
    }

    const handleLogoutSuccess = () => {
      addToast({
        type: "success",
        title: "Signed Out Successfully",
        message: "All your data has been cleared from this browser.",
        duration: 4000
      })
    }

    const handleLogoutError = (event: CustomEvent) => {
      const error = event.detail?.error || "Unknown error occurred"
      addToast({
        type: "warning",
        title: "Sign Out Completed",
        message: `Signed out but some cleanup may be incomplete: ${error}`,
        duration: 6000
      })
    }

    const handleCacheCleared = (event: CustomEvent) => {
      const result = event.detail
      if (result?.success) {
        console.log("Cache cleanup completed:", result.clearedItems)
        addToast({
          type: "success",
          title: "Privacy Protected",
          message: `Cleared ${result.clearedItems.length} cache types to prevent data leakage.`,
          duration: 5000
        })
      } else {
        console.warn("Cache cleanup had issues:", result?.errors)
        addToast({
          type: "warning",
          title: "Cache Cleanup Issues",
          message: "Some browser data may not have been cleared completely.",
          duration: 6000
        })
      }
    }

    // Add event listeners
    window.addEventListener('logoutStart', handleLogoutStart)
    window.addEventListener('logoutSuccess', handleLogoutSuccess)
    window.addEventListener('logoutError', handleLogoutError as EventListener)
    window.addEventListener('cacheCleared', handleCacheCleared as EventListener)

    // Cleanup listeners
    return () => {
      window.removeEventListener('logoutStart', handleLogoutStart)
      window.removeEventListener('logoutSuccess', handleLogoutSuccess)
      window.removeEventListener('logoutError', handleLogoutError as EventListener)
      window.removeEventListener('cacheCleared', handleCacheCleared as EventListener)
    }
  }, [addToast])

  // This component doesn't render anything - it just listens for events
  return null
}

/**
 * Hook for manually triggering cache cleanup (for testing or other use cases)
 */
export function useCacheCleanup() {
  const clearCache = async () => {
    try {
      const { clearAllBrowserData } = await import('@/lib/utils/cache-cleanup')
      const result = await clearAllBrowserData()
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('cacheCleared', { 
          detail: result 
        }))
      }
      
      return result
    } catch (error) {
      console.error('Manual cache cleanup failed:', error)
      throw error
    }
  }

  const clearAuthCache = async () => {
    try {
      const { clearAuthData } = await import('@/lib/utils/cache-cleanup')
      const result = clearAuthData()
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('authCacheCleared', { 
          detail: result 
        }))
      }
      
      return result
    } catch (error) {
      console.error('Auth cache cleanup failed:', error)
      throw error
    }
  }

  return { clearCache, clearAuthCache }
}