import { getRedisClient } from './redis'
import { generateClipCode, CLIP_TTL_SECONDS } from './clipCode'

// Storage for clipboard entries, keyed by a four digit code.
//
// The key is stored here beside the ciphertext, which means this server can
// read a clip while it exists. That is a deliberate consequence of a four digit
// code and is explained in full in ./clipCode.ts. Do not describe the clipboard
// as zero-knowledge anywhere.
//
// Two things bound the damage. A clip lives five minutes, and it opens exactly
// once. The second matters as much as the first: a code that has been used is
// dead, so an enumerating attacker races the real recipient rather than
// harvesting at leisure, and a recipient who finds their code already spent
// learns something went wrong.
//
// Must not be imported from mcp/. It reaches ioredis.

const CLIP_PREFIX = 'clip:'

// Ciphertext of the {text, file} envelope, base64url. Same headroom as
// /api/secrets so a 5MB file survives the encoding.
export const MAX_CIPHERTEXT_CHARS = 12_000_000

// A 256 bit key and a 96 bit iv, base64url.
export const MAX_FIELD_CHARS = 1_000

// 10,000 codes is a small space, so a busy moment can genuinely collide. Try a
// few before giving up rather than overwriting somebody else's clip.
const MAX_MINT_ATTEMPTS = 8

export interface StoredClip {
  ciphertext: string
  iv: string
  key: string
}

export interface CreatedClip {
  code: string
  expiresIn: number
}

// The server picks the code rather than the client, so collision handling lives
// in one place and a client cannot claim a code it prefers.
export async function createClip(clip: StoredClip): Promise<CreatedClip | null> {
  const redis = getRedisClient()
  const payload = JSON.stringify(clip)

  for (let attempt = 0; attempt < MAX_MINT_ATTEMPTS; attempt += 1) {
    const code = generateClipCode()
    // NX so a collision cannot replace a live clip, which would silently lose
    // whatever the first person saved.
    const written = await redis.set(
      `${CLIP_PREFIX}${code}`,
      payload,
      'EX',
      CLIP_TTL_SECONDS,
      'NX'
    )
    if (written === 'OK') return { code, expiresIn: CLIP_TTL_SECONDS }
  }
  return null
}

// Atomic fetch-and-delete, matching how secrets are read. A clip opens once, so
// a code left on a screen does not keep working.
export async function takeClip(code: string): Promise<StoredClip | null> {
  const redis = getRedisClient()
  const data = (await redis.call('GETDEL', `${CLIP_PREFIX}${code}`)) as string | null
  if (!data) return null
  try {
    return JSON.parse(data) as StoredClip
  } catch {
    return null
  }
}
