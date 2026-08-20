import { getRedisClient } from './redis'
import { generateCode, normalizeCode } from './pairingCode'

// Server side of passwordless handoff. See lib/ecdh.ts for why this shape.
//
// A beam is a waiting receiver: a public key parked under a short code, with a
// slot for one payload. The server never holds a private key, so everything
// here is public keys and ciphertext.
//
// Deliberately different from lib/pairing.ts, which points a code at an
// existing secret and leans on the password for everything. Here there is no
// password, and the protection is that only the browser that created the beam
// holds the private half.
//
// Must not be imported from mcp/. It reaches ioredis, which that package does
// not install.

const BEAM_PREFIX = 'beam:'

export const BEAM_TTL_SECONDS = 300

const MAX_MINT_ATTEMPTS = 5

// Text only for now, so this is generous. Bounds Redis memory per beam.
export const MAX_PAYLOAD_CHARS = 1_000_000

interface BeamRecord {
  publicKey: string
  // The claim token, held only by the receiving browser. Not a confidentiality
  // control: a payload is sealed to the receiver's key, so an interloper who
  // guesses the code cannot read it either way. This stops them *consuming* it
  // and leaving the real receiver waiting forever.
  token: string
  payload: {
    ciphertext: string
    iv: string
    senderPublicKey: string
  } | null
}

export interface CreatedBeam {
  code: string
  token: string
  expiresIn: number
}

function randomToken(): string {
  const bytes = new Uint8Array(32)
  globalThis.crypto.getRandomValues(bytes)
  let hex = ''
  for (let i = 0; i < bytes.length; i += 1) hex += bytes[i].toString(16).padStart(2, '0')
  return hex
}

export async function createBeam(publicKey: string): Promise<CreatedBeam | null> {
  const redis = getRedisClient()
  const token = randomToken()

  for (let attempt = 0; attempt < MAX_MINT_ATTEMPTS; attempt += 1) {
    const code = generateCode()
    const record: BeamRecord = { publicKey, token, payload: null }
    // NX so a collision cannot repoint a live code at a different public key,
    // which would silently redirect someone's secret to another device.
    const written = await redis.set(
      `${BEAM_PREFIX}${code}`,
      JSON.stringify(record),
      'EX',
      BEAM_TTL_SECONDS,
      'NX'
    )
    if (written === 'OK') return { code, token, expiresIn: BEAM_TTL_SECONDS }
  }
  return null
}

async function read(code: string): Promise<BeamRecord | null> {
  const redis = getRedisClient()
  const raw = await redis.get(`${BEAM_PREFIX}${code}`)
  if (!raw) return null
  try {
    return JSON.parse(raw) as BeamRecord
  } catch {
    return null
  }
}

// Non-destructive. Hands the sender the key to seal against, and nothing else:
// the token and any delivered payload stay behind.
export async function beamPublicKey(input: string): Promise<string | null> {
  const code = normalizeCode(input)
  if (!code) return null
  const record = await read(code)
  return record?.publicKey ?? null
}

export type DeliverResult = 'delivered' | 'not-found' | 'occupied'

// One payload per beam. A second send is refused rather than overwriting, so a
// racing or malicious sender cannot replace what the receiver is about to read.
export async function deliver(
  input: string,
  payload: NonNullable<BeamRecord['payload']>
): Promise<DeliverResult> {
  const code = normalizeCode(input)
  if (!code) return 'not-found'

  const redis = getRedisClient()
  const key = `${BEAM_PREFIX}${code}`
  const record = await read(code)
  if (!record) return 'not-found'
  if (record.payload) return 'occupied'

  // Preserve whatever life the beam had left rather than restarting its clock.
  const ttl = await redis.ttl(key)
  if (ttl <= 0) return 'not-found'

  record.payload = payload
  await redis.setex(key, ttl, JSON.stringify(record))
  return 'delivered'
}

export type ClaimResult =
  | { status: 'waiting' }
  | { status: 'not-found' }
  | { status: 'ready'; payload: NonNullable<BeamRecord['payload']> }

// Polled by the receiver. Deletes the beam on a successful read, so a payload
// is delivered exactly once and the code dies with it.
export async function claim(input: string, token: string): Promise<ClaimResult> {
  const code = normalizeCode(input)
  if (!code) return { status: 'not-found' }

  const record = await read(code)
  if (!record) return { status: 'not-found' }
  // A wrong token is answered as not-found, so polling cannot be used to learn
  // that a code is live.
  if (typeof token !== 'string' || token !== record.token) return { status: 'not-found' }
  if (!record.payload) return { status: 'waiting' }

  await getRedisClient().del(`${BEAM_PREFIX}${code}`)
  return { status: 'ready', payload: record.payload }
}

export async function cancelBeam(input: string, token: string): Promise<void> {
  const code = normalizeCode(input)
  if (!code) return
  const record = await read(code)
  if (record && record.token === token) {
    await getRedisClient().del(`${BEAM_PREFIX}${code}`)
  }
}
