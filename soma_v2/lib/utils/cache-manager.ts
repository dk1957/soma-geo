/**
 * Utility functions for clearing all user data and caches on logout
 */

import { OnboardingStateCache, StorageCache } from '@/lib/utils/storage-cache'
import { promptCache } from '@/lib/cache'

export class CacheManager {
  /**
   * Clear all client-side caches and storage
   */
  static clearAllClientData(): void {
    if (typeof window === 'undefined') {
      return // Only run in browser
    }

    try {
      // Clear onboarding cache
      OnboardingStateCache.clearState()
      
      // Clear prompt cache
      promptCache.clear()
      
      // Clear localStorage
      localStorage.clear()
      
      // Clear sessionStorage
      sessionStorage.clear()
      
      // Clear any browser cache if possible
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            caches.delete(name).catch(err => {
              console.warn('Failed to delete cache:', name, err)
            })
          })
        }).catch(err => {
          console.warn('Failed to clear browser caches:', err)
        })
      }

      console.log('✅ All client-side data cleared')
    } catch (error) {
      console.error('❌ Error clearing client data:', error)
    }
  }

  /**
   * Clear user-specific data only (keeps app-level caches)
   */
  static clearUserData(): void {
    if (typeof window === 'undefined') {
      return
    }

    try {
      // Clear onboarding cache
      OnboardingStateCache.clearState()
      
      // Clear prompt cache
      promptCache.clear()
      
      // Clear specific localStorage keys related to user data
      const userDataKeys = [
        'soma_onboarding_cache',
        'soma_user_preferences', 
        'soma_brand_data',
        'soma_audit_results',
        'soma_run_results'
      ]

      userDataKeys.forEach(key => {
        localStorage.removeItem(key)
      })

      console.log('✅ User-specific data cleared')
    } catch (error) {
      console.error('❌ Error clearing user data:', error)
    }
  }

  /**
   * Check if there's any cached user data that should be cleared
   */
  static hasUserData(): boolean {
    if (typeof window === 'undefined') {
      return false
    }

    try {
      // Check for onboarding cache
      if (OnboardingStateCache.hasCachedState()) {
        return true
      }

      // Check for prompt cache
      if (promptCache.stats().size > 0) {
        return true
      }

      // Check for user-specific localStorage keys
      const userDataKeys = [
        'soma_onboarding_cache',
        'soma_user_preferences', 
        'soma_brand_data',
        'soma_audit_results'
      ]

      return userDataKeys.some(key => localStorage.getItem(key) !== null)
    } catch (error) {
      console.error('Error checking for user data:', error)
      return false
    }
  }

  /**
   * Initialize clean state for new user
   */
  static initializeCleanState(): void {
    if (typeof window === 'undefined') {
      return
    }

    // Clear any existing data first
    this.clearUserData()
    
    // Set clean state markers
    sessionStorage.setItem('soma_clean_session', 'true')
    
    console.log('✅ Clean state initialized')
  }
}