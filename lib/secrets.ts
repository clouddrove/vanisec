import { v4 as uuidv4 } from 'uuid'
import { getRedisClient } from './redis'

// Zero-knowledge storage model: the server only ever holds ciphertext and the
// non-secret crypto parameters the browser needs to decrypt. It never sees the
// plaintext (text or file), the filename/type, the password, or the encryption
// key — text and file are bundled into a single JSON envelope that is encrypted
// in the browser before upload.
//
// One-time semantics are enforced by an atomic GETDEL at retrieval (not by a
// "viewed" flag) so two concurrent reads cannot both succeed.

export interface StoredSecret {
  id: string
  ciphertext: string // base64url, AES-GCM over the {text, file} envelope
  iv: string // base64url
  passwordProtected: boolean
  // Present only when passwordProtected:
  encSalt?: string // base64url — client derives the AES key from password + this
  authSalt?: string // base64url — client derives the retrieval verifier
  verifierHash?: string // sha256 hex of the client verifier (server-side gate)
  createdAt: number
  expiresAt: number
}

export interface CreateSecretInput {
  ciphertext: string
  iv: string
  passwordProtected: boolean
  encSalt?: string
  authSalt?: string
  verifierHash?: string
  expiresIn: number // hours
}

const SECRET_PREFIX = 'secret:'
const TTL_BUFFER = 60 // seconds

export async function createSecret(input: CreateSecretInput): Promise<string> {
  const id = uuidv4()
  const now = Date.now()
  const expiresAt = now + input.expiresIn * 60 * 60 * 1000
  const ttl = Math.floor((expiresAt - now) / 1000) + TTL_BUFFER

  const data: StoredSecret = {
    id,
    ciphertext: input.ciphertext,
    iv: input.iv,
    passwordProtected: input.passwordProtected,
    encSalt: input.encSalt,
    authSalt: input.authSalt,
    verifierHash: input.verifierHash,
    createdAt: now,
    expiresAt,
  }

  const redis = getRedisClient()
  await redis.setex(`${SECRET_PREFIX}${id}`, ttl, JSON.stringify(data))
  return id
}

// Non-destructive read — used to inspect metadata (e.g. whether a password is
// required) before the authoritative GETDEL.
export async function peekSecret(id: string): Promise<StoredSecret | null> {
  const redis = getRedisClient()
  const data = await redis.get(`${SECRET_PREFIX}${id}`)
  if (!data) return null
  try {
    return JSON.parse(data) as StoredSecret
  } catch (error) {
    console.error('Error parsing secret data:', error)
    return null
  }
}

// Atomic fetch-and-delete. Returns the secret exactly once; a racing caller
// gets null. This is the one-time guarantee.
export async function takeSecret(id: string): Promise<StoredSecret | null> {
  const redis = getRedisClient()
  const data = (await redis.call('GETDEL', `${SECRET_PREFIX}${id}`)) as string | null
  if (!data) return null
  try {
    return JSON.parse(data) as StoredSecret
  } catch (error) {
    console.error('Error parsing secret data:', error)
    return null
  }
}

export async function deleteSecret(id: string): Promise<void> {
  const redis = getRedisClient()
  await redis.del(`${SECRET_PREFIX}${id}`)
}
