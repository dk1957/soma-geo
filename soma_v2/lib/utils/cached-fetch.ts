// Simple cached fetch helper with in-memory and sessionStorage fallback
// Prevents duplicate GET calls within a short TTL window (default 60s)

type CacheEntry = { ts: number; data: any }
const memCache = new Map<string, CacheEntry>()

function makeKey(url: string, options?: RequestInit) {
  // Only vary by method, headers and body for safety
  const method = (options?.method || 'GET').toUpperCase()
  const headers = options?.headers ? JSON.stringify(options.headers) : ''
  const body = options?.body ? String(options.body) : ''
  return `${method}::${url}::${headers}::${body}`
}

export async function cachedFetchJson(url: string, options?: RequestInit, ttlMs = 60_000, forceReload = false) {
  const key = makeKey(url, options)
  const now = Date.now()

  if (!forceReload) {
    const mem = memCache.get(key)
    if (mem && now - mem.ts < ttlMs) {
      return mem.data
    }
    try {
      const serialized = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(`cachedFetch:${key}`) : null
      if (serialized) {
        const parsed = JSON.parse(serialized) as CacheEntry
        if (now - parsed.ts < ttlMs) {
          memCache.set(key, parsed)
          return parsed.data
        } else {
          try { sessionStorage.removeItem(`cachedFetch:${key}`) } catch {}
        }
      }
    } catch (e) {
      // ignore sessionStorage errors
    }
  }

  const res = await fetch(url, options)
  if (!res.ok) {
    // Try to return stale cache if available
    const stale = memCache.get(key)
    if (stale) return stale.data
    // For unauthorized or forbidden responses (public shared reports may hit protected APIs),
    // return null instead of throwing so callers can handle gracefully without noisy stack traces.
    if (res.status === 401 || res.status === 403) {
      try { console.debug(`cachedFetchJson: non-ok status ${res.status} for ${url}`) } catch (e) {}
      return null
    }

    throw new Error(`Request failed: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()
  const entry = { ts: now, data }
  memCache.set(key, entry)
  try { if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(`cachedFetch:${key}`, JSON.stringify(entry)) } catch (e) {}
  return data
}

export function invalidateCachedFetch(urlOrPrefix?: string) {
  if (!urlOrPrefix) {
    memCache.clear()
    try { if (typeof sessionStorage !== 'undefined') {
      Object.keys(sessionStorage).forEach(k => { if (k.startsWith('cachedFetch:')) sessionStorage.removeItem(k) })
    }} catch (e) {}
    return
  }

  // Remove matching memory keys and sessionStorage entries
  for (const k of Array.from(memCache.keys())) {
    if (k.includes(urlOrPrefix)) memCache.delete(k)
  }
  try {
    if (typeof sessionStorage !== 'undefined') {
      Object.keys(sessionStorage).forEach(k => { if (k.startsWith('cachedFetch:') && k.includes(urlOrPrefix)) sessionStorage.removeItem(k) })
    }
  } catch (e) {}
}
