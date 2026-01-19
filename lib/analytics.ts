import { getRedisClient } from './redis'

const STATS_PREFIX = 'stats:'
const HOURLY_PREFIX = 'hourly:'
const DAILY_PREFIX = 'daily:'

// Track secret creation
export async function trackSecretCreated(): Promise<void> {
  const redis = getRedisClient()
  const now = new Date()
  const hourKey = `${HOURLY_PREFIX}created:${now.toISOString().slice(0, 13)}` // YYYY-MM-DDTHH
  const dayKey = `${DAILY_PREFIX}created:${now.toISOString().slice(0, 10)}` // YYYY-MM-DD

  // Increment counters
  await Promise.all([
    redis.incr(`${STATS_PREFIX}total_created`),
    redis.incr(hourKey),
    redis.incr(dayKey),
  ])

  // Set expiration for hourly keys (keep for 7 days)
  await redis.expire(hourKey, 7 * 24 * 60 * 60)
  // Set expiration for daily keys (keep for 90 days)
  await redis.expire(dayKey, 90 * 24 * 60 * 60)
}

// Track secret viewed
export async function trackSecretViewed(): Promise<void> {
  const redis = getRedisClient()
  const now = new Date()
  const hourKey = `${HOURLY_PREFIX}viewed:${now.toISOString().slice(0, 13)}` // YYYY-MM-DDTHH
  const dayKey = `${DAILY_PREFIX}viewed:${now.toISOString().slice(0, 10)}` // YYYY-MM-DD

  // Increment counters
  await Promise.all([
    redis.incr(`${STATS_PREFIX}total_viewed`),
    redis.incr(hourKey),
    redis.incr(dayKey),
  ])

  // Set expiration for hourly keys (keep for 7 days)
  await redis.expire(hourKey, 7 * 24 * 60 * 60)
  // Set expiration for daily keys (keep for 90 days)
  await redis.expire(dayKey, 90 * 24 * 60 * 60)
}

// Get analytics data
export interface AnalyticsData {
  totalCreated: number
  totalViewed: number
  hourlyCreated: Array<{ hour: string; count: number }>
  hourlyViewed: Array<{ hour: string; count: number }>
  dailyCreated: Array<{ date: string; count: number }>
  dailyViewed: Array<{ date: string; count: number }>
  activeSecrets: number
}

export async function getAnalytics(days: number = 7): Promise<AnalyticsData> {
  const redis = getRedisClient()
  const now = new Date()
  
  // Get total counts
  const totalCreated = parseInt((await redis.get(`${STATS_PREFIX}total_created`)) || '0', 10)
  const totalViewed = parseInt((await redis.get(`${STATS_PREFIX}total_viewed`)) || '0', 10)

  // Get active secrets count (secrets that haven't been viewed yet)
  const keys = await redis.keys('secret:*')
  const activeSecrets = keys.length

  // Get hourly data for last 24 hours
  const hourlyCreated: Array<{ hour: string; count: number }> = []
  const hourlyViewed: Array<{ hour: string; count: number }> = []
  
  for (let i = 23; i >= 0; i--) {
    const hour = new Date(now.getTime() - i * 60 * 60 * 1000)
    const hourKey = hour.toISOString().slice(0, 13)
    
    const createdCount = parseInt(
      (await redis.get(`${HOURLY_PREFIX}created:${hourKey}`)) || '0',
      10
    )
    const viewedCount = parseInt(
      (await redis.get(`${HOURLY_PREFIX}viewed:${hourKey}`)) || '0',
      10
    )
    
    hourlyCreated.push({
      hour: hour.toISOString().slice(11, 16), // HH:MM format
      count: createdCount,
    })
    hourlyViewed.push({
      hour: hour.toISOString().slice(11, 16),
      count: viewedCount,
    })
  }

  // Get daily data for specified days
  const dailyCreated: Array<{ date: string; count: number }> = []
  const dailyViewed: Array<{ date: string; count: number }> = []
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const dateKey = date.toISOString().slice(0, 10)
    
    const createdCount = parseInt(
      (await redis.get(`${DAILY_PREFIX}created:${dateKey}`)) || '0',
      10
    )
    const viewedCount = parseInt(
      (await redis.get(`${DAILY_PREFIX}viewed:${dateKey}`)) || '0',
      10
    )
    
    dailyCreated.push({
      date: dateKey,
      count: createdCount,
    })
    dailyViewed.push({
      date: dateKey,
      count: viewedCount,
    })
  }

  return {
    totalCreated,
    totalViewed,
    hourlyCreated,
    hourlyViewed,
    dailyCreated,
    dailyViewed,
    activeSecrets,
  }
}

