import { getRedisClient } from './redis'

// Lightweight fixed-window rate limiter backed by Redis INCR + EXPIRE.
// Used to cap secret creation per client IP and blunt memory-fill abuse.

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

// Best-effort client IP from common proxy headers (Next.js standalone behind
// an ingress/load balancer). Falls back to a constant bucket if unknown.
export function clientIp(headers: Headers): string {
  const xff = headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return headers.get('x-real-ip')?.trim() || 'unknown'
}
