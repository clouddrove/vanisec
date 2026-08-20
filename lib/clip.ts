import { getRedisClient } from './redis'

// Storage for clipboard entries. See lib/clipCode.ts for the part that matters:
// the id below is derived from a code the server never receives, so what is
// stored here cannot be opened by whoever stores it.
//
// Thinner than lib/secrets.ts on purpose. There is no password, so there are no
// salts, no verifier and no separate metadata read. The id is the only gate,
// and holding it already means holding the code.
//
// Must not be imported from mcp/. It reaches ioredis.

const CLIP_PREFIX = 'clip:'
const TTL_BUFFER = 60

// The id is base64url over 32 bytes.
export const MAX_ID_CHARS = 64

// Ciphertext of the {text, file} envelope, base64url. Same headroom as
// /api/secrets so a 5MB file survives the encoding.
export const MAX_CIPHERTEXT_CHARS = 12_000_000

export const ALLOWED_EXPIRY_HOURS = [1, 6, 24, 72, 168]
export const DEFAULT_EXPIRY_HOURS = 24

export interface StoredClip {
  ciphertext: string
  iv: string
  createdAt: number
  expiresAt: number
}

export interface CreateClipInput {
  id: string
  ciphertext: string
  iv: string
  expiresIn: number
}

// Refuses to overwrite. Two clips can only collide if two browsers generated
// the same 2^50 code, and silently replacing the first would lose someone's
// text rather than tell them.
export async function createClip(input: CreateClipInput): Promise<boolean> {
  const now = Date.now()
  const expiresAt = now + input.expiresIn * 60 * 60 * 1000
  const ttl = Math.floor((expiresAt - now) / 1000) + TTL_BUFFER

  const clip: StoredClip = {
    ciphertext: input.ciphertext,
    iv: input.iv,
    createdAt: now,
    expiresAt,
  }

  const redis = getRedisClient()
  const written = await redis.set(
    `${CLIP_PREFIX}${input.id}`,
    JSON.stringify(clip),
    'EX',
    ttl,
    'NX'
  )
  return written === 'OK'
}

// Atomic fetch-and-delete, matching how secrets are read. A clip opens once,
// so a code left in a chat log does not keep working.
export async function takeClip(id: string): Promise<StoredClip | null> {
  const redis = getRedisClient()
  const data = (await redis.call('GETDEL', `${CLIP_PREFIX}${id}`)) as string | null
  if (!data) return null
  try {
    return JSON.parse(data) as StoredClip
  } catch {
    return null
  }
}
