/**
 * Redis-backed Rate Limiting via Upstash
 * 
 * Replaces in-memory rate limiting for serverless environments.
 * State is shared across all instances and survives redeploys.
 * Falls back to in-memory if Redis is not configured.
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextResponse } from 'next/server'
import { checkRateLimit, addRateLimitHeaders } from './rate-limit'
import type { RateLimitConfig, RateLimitResult } from './rate-limit'

// ─── Redis Client (singleton) ───────────────────────────────────────
// Use square-vulture (KV_URL_ prefixed) first — hip-robin instance is dead
const redisUrl = process.env.KV_URL_KV_REST_API_URL || process.env.KV_REST_API_URL
const redisToken = process.env.KV_URL_KV_REST_API_TOKEN || process.env.KV_REST_API_TOKEN

const redis = redisUrl && redisToken
  ? new Redis({
      url: redisUrl,
      token: redisToken,
    })
  : null

// ─── Ratelimit Instances (cached per config key) ────────────────────
const limiters = new Map<string, Ratelimit>()

function getOrCreateLimiter(prefix: string, maxRequests: number, windowSeconds: number): Ratelimit | null {
  if (!redis) return null

  const key = `${prefix}:${maxRequests}:${windowSeconds}`
  let limiter = limiters.get(key)
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      prefix: `rl:${prefix}`,
      limiter: Ratelimit.slidingWindow(maxRequests, `${windowSeconds} s`),
      analytics: false,
    })
    limiters.set(key, limiter)
  }
  return limiter
}

// ─── Public API ─────────────────────────────────────────────────────

export async function checkRedisRateLimit(
  key: string,
  config: RateLimitConfig,
  prefix = 'api'
): Promise<RateLimitResult> {
  const limiter = getOrCreateLimiter(prefix, config.maxRequests, config.windowSeconds)

  if (!limiter) {
    // Fallback to in-memory if Redis not configured
    return checkRateLimit(key, config)
  }

  try {
    const result = await limiter.limit(key)
    return {
      allowed: result.success,
      remaining: result.remaining,
      limit: result.limit,
      resetAt: result.reset,
      retryAfter: result.success ? undefined : Math.ceil((result.reset - Date.now()) / 1000),
    }
  } catch (error) {
    console.warn('Redis rate limit error, falling back to in-memory:', error)
    return checkRateLimit(key, config)
  }
}

/**
 * Apply Redis rate limiting. Returns a 429 NextResponse if limited, null if allowed.
 */
export async function applyRedisRateLimit(
  request: { headers: { get(name: string): string | null } },
  resource: string,
  config: RateLimitConfig,
): Promise<{ response: NextResponse | null; headers: Headers; ip: string }> {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || '127.0.0.1'

  const result = await checkRedisRateLimit(`${resource}:${ip}`, config, resource)
  const headers = new Headers()
  addRateLimitHeaders(headers, result)

  if (!result.allowed) {
    return {
      response: NextResponse.json(
        { error: 'Too many requests. Please try again later.', retryAfter: result.retryAfter },
        { status: 429, headers }
      ),
      headers,
      ip,
    }
  }

  return { response: null, headers, ip }
}
