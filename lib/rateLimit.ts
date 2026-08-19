import { getRedisClient } from './redis'

// Lightweight fixed-window rate limiter backed by Redis INCR + EXPIRE.
// Used to cap secret creation and password-guessing attempts.

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetSeconds: number
}

export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const redis = getRedisClient()
  const redisKey = `rl:${key}`

  const count = await redis.incr(redisKey)
  if (count === 1) {
    await redis.expire(redisKey, windowSeconds)
  }

  let ttl = await redis.ttl(redisKey)
  // -1 (no expiry, shouldn't happen) / -2 (key gone): re-arm to be safe.
  if (ttl < 0) {
    await redis.expire(redisKey, windowSeconds)
    ttl = windowSeconds
  }

  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    resetSeconds: ttl,
  }
}

// Number of reverse proxies in front of the app. X-Forwarded-For is appended to
// by each hop, so only the last TRUSTED_PROXY_HOPS entries are trustworthy —
// anything further left was supplied by the client and can be forged.
//
// Set TRUSTED_PROXY_HOPS to match the deployment (e.g. 1 behind a single
// ingress, 2 behind CDN + ingress). Default 1.
const TRUSTED_PROXY_HOPS = Math.max(1, parseInt(process.env.TRUSTED_PROXY_HOPS || '1', 10) || 1)

// Resolves the client IP from proxy headers, taking the Nth entry from the
// RIGHT of X-Forwarded-For so a client-supplied prefix cannot spoof it.
//
// Returns null when no trustworthy IP is available, so callers can decide
// whether to fall back to a coarser bucket rather than silently sharing one.
export function clientIp(headers: Headers): string | null {
  const xff = headers.get('x-forwarded-for')
  if (xff) {
    const hops = xff
      .split(',')
      .map((h) => h.trim())
      .filter(Boolean)
    if (hops.length > 0) {
      // The rightmost entry is written by our own proxy; walk left one entry
      // per additional trusted hop, clamped to what is actually present.
      const idx = Math.max(0, hops.length - TRUSTED_PROXY_HOPS)
      return hops[idx]
    }
  }

  const real = headers.get('x-real-ip')?.trim()
  return real || null
}
