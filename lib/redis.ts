import Redis from 'ioredis'

let redis: Redis | null = null

export function getRedisClient(): Redis {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379/3'
    const redisPassword = process.env.REDIS_PASSWORD
    
    // Parse Redis URL to extract connection details
    const config: any = {
      db: 3, // Use Redis database 3
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000)
        return delay
      },
      maxRetriesPerRequest: 3,
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

