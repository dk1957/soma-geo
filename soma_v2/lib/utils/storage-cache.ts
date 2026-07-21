/**
 * Generic localStorage cache utility for persistent data storage
 * Replaces specialized cache implementations with a general-purpose solution
 */

interface StorageCacheEntry<T = any> {
  data: T
  timestamp: number
  expiry?: number
}

export class StorageCache {
  private static readonly PREFIX = 'soma_cache_'
  
  /**
   * Save data to localStorage with optional expiry
   */
  static set<T>(key: string, data: T, ttlMs?: number): boolean {
    if (typeof window === 'undefined') return false
    
    try {
      const entry: StorageCacheEntry<T> = {
        data,
        timestamp: Date.now(),
        expiry: ttlMs ? Date.now() + ttlMs : undefined
      }
      
      localStorage.setItem(this.PREFIX + key, JSON.stringify(entry))
      return true
    } catch (error) {
      console.warn('Failed to save to localStorage:', error)
      return false
    }
  }
  
  /**
   * Get data from localStorage, checking expiry
   */
  static get<T>(key: string): T | null {
    if (typeof window === 'undefined') return null
    
    try {
      const stored = localStorage.getItem(this.PREFIX + key)
      if (!stored) return null
      
      const entry: StorageCacheEntry<T> = JSON.parse(stored)
      
      // Check if expired
      if (entry.expiry && Date.now() > entry.expiry) {
        this.remove(key)
        return null
      }
      
      return entry.data
    } catch (error) {
      console.warn('Failed to read from localStorage:', error)
      return null
    }
  }
  
  /**
   * Check if key exists and is not expired
   */
  static has(key: string): boolean {
    return this.get(key) !== null
  }
  
  /**
   * Remove specific key
   */
  static remove(key: string): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.removeItem(this.PREFIX + key)
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error)
    }
  }
  
  /**
   * Clear all cache entries (keeps other localStorage data)
   */
  static clear(): void {
    if (typeof window === 'undefined') return
    
    try {
      const keysToRemove: string[] = []
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(this.PREFIX)) {
          keysToRemove.push(key)
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key))
    } catch (error) {
      console.warn('Failed to clear cache from localStorage:', error)
    }
  }
  
  /**
   * Get all cache keys
   */
  static keys(): string[] {
    if (typeof window === 'undefined') return []
    
    try {
      const cacheKeys: string[] = []
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(this.PREFIX)) {
          cacheKeys.push(key.replace(this.PREFIX, ''))
        }
      }
      
      return cacheKeys
    } catch (error) {
      console.warn('Failed to get cache keys:', error)
      return []
    }
  }
  
  /**
   * Get cache statistics
   */
  static stats(): { count: number; keys: string[]; totalSize: number } {
    const keys = this.keys()
    let totalSize = 0
    
    keys.forEach(key => {
      try {
        const stored = localStorage.getItem(this.PREFIX + key)
        if (stored) {
          totalSize += stored.length
        }
      } catch (error) {
        // Ignore errors for stats
      }
    })
    
    return {
      count: keys.length,
      keys,
      totalSize
    }
  }
}

/**
 * Specialized onboarding state cache using general storage utility
 */
export class OnboardingStateCache {
  private static readonly ONBOARDING_KEY = 'onboarding_state'
  
  static saveState(
    step: string,
    userType: string | null,
    formData: any,
    aiGeneratedPrompts: any[] = [],
    promptRunResult: any = null,
    customPrompt: string = "",
    auditResults: any = null,
    runId?: string,
    runProgress?: any
  ): boolean {
    const state = {
      step,
      userType,
      formData,
      aiGeneratedPrompts,
      promptRunResult,
      customPrompt,
      auditResults,
      runId,
      runProgress,
      savedAt: new Date().toISOString()
    }
    
    // Cache for 24 hours
    return StorageCache.set(this.ONBOARDING_KEY, state, 24 * 60 * 60 * 1000)
  }
  
  static loadState(): any {
    return StorageCache.get(this.ONBOARDING_KEY)
  }
  
  static clearState(): void {
    StorageCache.remove(this.ONBOARDING_KEY)
  }
  
  static hasCachedState(): boolean {
    return StorageCache.has(this.ONBOARDING_KEY)
  }
}