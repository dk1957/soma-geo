// Simple in-memory cache for AI responses
interface CacheEntry {
  data: any
  timestamp: number
  expiry: number
}

class Cache {
  private cache: Map<string, CacheEntry> = new Map()
  private defaultTTL: number = 5 * 60 * 1000 // 5 minutes

  // Generate cache key from parameters
  private generateKey(params: Record<string, any>): string {
    return JSON.stringify(params, Object.keys(params).sort())
  }

  // Set cache entry
  set(key: string | Record<string, any>, data: any, ttl?: number): void {
    const cacheKey = typeof key === 'string' ? key : this.generateKey(key)
    const expiry = ttl || this.defaultTTL
    const timestamp = Date.now()
    
    this.cache.set(cacheKey, {
      data,
      timestamp,
      expiry: timestamp + expiry
    })
  }

  // Get cache entry
  get(key: string | Record<string, any>): any | null {
    const cacheKey = typeof key === 'string' ? key : this.generateKey(key)
    const entry = this.cache.get(cacheKey)
    
    if (!entry) {
      return null
    }
    
    // Check if expired
    if (Date.now() > entry.expiry) {
      this.cache.delete(cacheKey)
      return null
    }
    
    return entry.data
  }

  // Check if key exists and is not expired
  has(key: string | Record<string, any>): boolean {
    return this.get(key) !== null
  }

  // Clear expired entries
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key)
      }
    }
  }

  // Clear all cache
  clear(): void {
    this.cache.clear()
  }

  // Get cache stats
  stats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}

// Create global cache instance
const promptCache = new Cache()

// Cleanup expired entries every minute
if (typeof window !== 'undefined') {
  setInterval(() => {
    promptCache.cleanup()
  }, 60 * 1000)
}

export { promptCache }
export type { CacheEntry }