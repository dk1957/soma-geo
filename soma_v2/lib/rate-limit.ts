/**
 * Rate Limiting Utility
 * In-memory sliding window rate limiter for API routes.
 * Supports per-user, per-IP, and per-resource limiting.
 */

import { NextResponse } from 'next/server'

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory store (works per-process; for multi-instance use Redis)
const store = new Map<string, RateLimitEntry>()

// Cleanup interval (every 60 seconds)
let cleanupInterval: ReturnType<typeof setInterval> | null = null

function ensureCleanup() {
  if (cleanupInterval) return
  cleanupInterval = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store) {
      if (entry.resetAt <= now) store.delete(key)
    }
  }, 60_000)
  // Don't block process exit
  if (typeof cleanupInterval === 'object' && 'unref' in cleanupInterval) {
    cleanupInterval.unref()
  }
}

export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  maxRequests: number
  /** Window size in seconds */
  windowSeconds: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  limit: number
  resetAt: number // Unix timestamp ms
  retryAfter?: number // seconds until reset
}

/**
 * Check and consume a rate limit token
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  ensureCleanup()
  
  const now = Date.now()
  const entry = store.get(key)
  
  if (!entry || entry.resetAt <= now) {
    // New window
    store.set(key, { count: 1, resetAt: now + config.windowSeconds * 1000 })
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      limit: config.maxRequests,
      resetAt: now + config.windowSeconds * 1000,
    }
  }
  
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      limit: config.maxRequests,
      resetAt: entry.resetAt,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    }
  }
  
  entry.count++
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    limit: config.maxRequests,
    resetAt: entry.resetAt,
  }
}

/**
 * Add rate limit headers to a response
 */
export function addRateLimitHeaders(
  headers: Headers, 
  result: RateLimitResult
): void {
  headers.set('X-RateLimit-Limit', String(result.limit))
  headers.set('X-RateLimit-Remaining', String(result.remaining))
  headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)))
  if (result.retryAfter) {
    headers.set('Retry-After', String(result.retryAfter))
  }
}

// ============================================================================
// PRESET CONFIGURATIONS
// ============================================================================

/** Standard API rate limits */
export const RATE_LIMITS = {
  /** General API: 60 requests per minute */
  api: { maxRequests: 60, windowSeconds: 60 } as RateLimitConfig,
  
  /** Auth endpoints: 10 per minute (brute force protection) */
  auth: { maxRequests: 10, windowSeconds: 60 } as RateLimitConfig,
  
  /** Write operations: 30 per minute */
  write: { maxRequests: 30, windowSeconds: 60 } as RateLimitConfig,
  
  /** Heavy operations (reports, exports): 10 per minute */
  heavy: { maxRequests: 10, windowSeconds: 60 } as RateLimitConfig,
  
  /** AI/LLM operations: 5 per minute */
  ai: { maxRequests: 5, windowSeconds: 60 } as RateLimitConfig,

  /** Admin operations: 30 per minute */
  admin: { maxRequests: 30, windowSeconds: 60 } as RateLimitConfig,
  
  /** Run trigger: 3 per hour */
  run: { maxRequests: 3, windowSeconds: 3600 } as RateLimitConfig,
} as const

/**
 * Build a rate limit key from components
 */
export function rateLimitKey(
  ...parts: (string | undefined | null)[]
): string {
  return parts.filter(Boolean).join(':')
}

/**
 * Create a rate-limited NextResponse if the limit is exceeded.
 * Returns null if the request is allowed, or a 429 response if rate limited.
 * 
 * Usage:
 *   const limited = applyRateLimit(request, 'brands:create', RATE_LIMITS.write)
 *   if (limited) return limited
 */
export function applyRateLimit(
  request: { headers: { get(name: string): string | null }; url: string },
  resource: string,
  config: RateLimitConfig,
  userId?: string | null,
): NextResponse | null {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
    || request.headers.get('x-real-ip') 
    || 'unknown'
  const key = rateLimitKey('rl', resource, userId || ip)
  const result = checkRateLimit(key, config)

  if (!result.allowed) {
    const headers = new Headers()
    addRateLimitHeaders(headers, result)
    return new NextResponse(
      JSON.stringify({
        error: 'Too many requests',
        message: `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`,
        retryAfter: result.retryAfter,
      }),
      { status: 429, headers: { ...Object.fromEntries(headers), 'Content-Type': 'application/json' } }
    )
  }

  return null
}
