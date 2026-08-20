import { getRedisClient } from './redis'
import { peekSecret } from './secrets'
import { generateCode, normalizeCode } from './pairingCode'

// Pairing codes: a short code that resolves to an existing secret id, so a
// secret can be moved between two devices someone is holding without mailing
// themselves a URL.
//
// A code carries the id and nothing else. The password still gates the
// verifier check in /api/secrets/[id] and still derives the AES key in the
// browser, so redeeming a code grants exactly what possessing the link already
// grants, and no more.
//
// The code is 2^40 where the id is 2^122, so three things stand in for the
// missing entropy:
//   - a five minute life (the dominant control: codes are for a handoff
//     happening now, not for a recipient who reads their messages later),
//   - single use, enforced by the same atomic GETDEL that reads secrets,
//   - a tight redeem rate limit in the route.
//
// Must not be imported from mcp/. It reaches ioredis, which that package does
// not install. Format handling lives in ./pairingCode for exactly that reason.

const PAIR_PREFIX = 'pair:'

export const CODE_TTL_SECONDS = 300

// A collision means a live code already holds the slot. At 2^40 with a five
// minute window this should never fire; the retries are here so that if it
// somehow does, minting fails loudly rather than stealing another code's slot.
const MAX_MINT_ATTEMPTS = 5

export interface MintedCode {
  code: string
  expiresIn: number // seconds
}

// Returns null when the secret is gone or already expired, so a code is never
// issued for something that cannot be redeemed.
export async function mintCode(id: string): Promise<MintedCode | null> {
  const secret = await peekSecret(id)
  if (!secret) return null

  // A code must never outlive the secret it points at. Matters for a secret
  // created with a one hour expiry and paired 59 minutes later: without the
  // clamp the code would survive the secret and redeem into a dead id.
  const secretTtl = Math.floor((secret.expiresAt - Date.now()) / 1000)
  if (secretTtl <= 0) return null
  const ttl = Math.min(CODE_TTL_SECONDS, secretTtl)

  const redis = getRedisClient()
  for (let attempt = 0; attempt < MAX_MINT_ATTEMPTS; attempt += 1) {
    const code = generateCode()
    // NX so a collision cannot overwrite a live code and silently repoint it.
    const written = await redis.set(`${PAIR_PREFIX}${code}`, id, 'EX', ttl, 'NX')
    if (written === 'OK') return { code, expiresIn: ttl }
  }
  return null
}

// Atomic fetch-and-delete: a code redeems exactly once and a racing caller gets
// null. Mirrors takeSecret, and means a stolen code fails visibly for the
// person it was stolen from rather than working twice unnoticed.
export async function redeemCode(input: string): Promise<string | null> {
  const code = normalizeCode(input)
  if (!code) return null

  const redis = getRedisClient()
  const id = (await redis.call('GETDEL', `${PAIR_PREFIX}${code}`)) as string | null
  return id ?? null
}
