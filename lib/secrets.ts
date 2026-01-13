import { v4 as uuidv4 } from 'uuid'
import { getRedisClient } from './redis'

export interface Secret {
  id: string
  secret: string
  password?: string
  createdAt: number
  expiresAt: number
  viewed: boolean
}

const SECRET_PREFIX = 'secret:'
const TTL_BUFFER = 60 // Add 60 seconds buffer to TTL

export async function createSecret(
  secret: string,
  password?: string,
  expiresIn: number = 24
): Promise<string> {
  const id = uuidv4()
  const now = Date.now()
  const expiresAt = now + expiresIn * 60 * 60 * 1000 // Convert hours to milliseconds
  const ttl = Math.floor((expiresAt - now) / 1000) + TTL_BUFFER // Convert to seconds

  const secretData: Secret = {
    id,
    secret,
    password: password || undefined,
    createdAt: now,
    expiresAt,
    viewed: false,
  }

  const redis = getRedisClient()
  await redis.setex(
    `${SECRET_PREFIX}${id}`,
    ttl,
    JSON.stringify(secretData)
  )

  return id
}

export async function getSecret(id: string): Promise<Secret | null> {
  const redis = getRedisClient()
  const data = await redis.get(`${SECRET_PREFIX}${id}`)

  if (!data) {
    return null
  }

  try {
    return JSON.parse(data) as Secret
  } catch (error) {
    console.error('Error parsing secret data:', error)
    return null
  }
}

export async function deleteSecret(id: string): Promise<void> {
  const redis = getRedisClient()
  await redis.del(`${SECRET_PREFIX}${id}`)
}
