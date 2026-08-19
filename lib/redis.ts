import Redis, { RedisOptions } from 'ioredis'

let redis: Redis | null = null

export function getRedisClient(): Redis {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379/3'
    const redisPassword = process.env.REDIS_PASSWORD
    
    const config: RedisOptions = {
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000)
        return delay
      },
      maxRetriesPerRequest: 3,
    }

    // Only pin a database when REDIS_URL does not already select one, so a URL
    // like redis://host/0 is honoured instead of being silently overridden.
    let urlSelectsDb = false
    try {
      urlSelectsDb = /^\/\d+$/.test(new URL(redisUrl).pathname)
    } catch {
      // Not a parseable URL; fall through to the configured default.
    }
    if (!urlSelectsDb) {
      config.db = Number(process.env.REDIS_DB ?? 3)
    }

    // Add password if provided (either from REDIS_PASSWORD env var or from URL)
    if (redisPassword) {
      config.password = redisPassword
    }

    redis = new Redis(redisUrl, config)

    redis.on('error', (err) => {
      console.error('Redis Client Error:', err)
    })

    redis.on('connect', () => {
      console.log('Connected to Redis')
    })
  }

  return redis
}

export async function closeRedisConnection(): Promise<void> {
  if (redis) {
    await redis.quit()
    redis = null
  }
}

