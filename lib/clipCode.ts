// Clipboard codes: four digits, alive for five minutes, used once.
//
// READ THIS BEFORE CHANGING ANYTHING HERE.
//
// An earlier version made the code itself the encryption key, which kept the
// clipboard zero-knowledge with no password. That only worked because the code
// was long: ten characters over a 32 symbol alphabet is 2^50, and deriving a
// key from every possible code is not a computation anyone performs.
//
// Four digits is 10,000 codes. Deriving the key for all of them takes under an
// hour on one core, so a code that short cannot be a key: the first person to
// build that table could read every clip ever written. The key therefore lives
// on the server, and the consequences are:
//
//   1. Vanisec can decrypt a clip while it exists. The clipboard is NOT
//      zero-knowledge. One-time links and pairing codes are unaffected, because
//      their passwords never leave the browser.
//   2. Ten thousand codes are enumerable. Somebody polling the whole space can
//      harvest clips they were never given.
//
// What holds the risk down is time. A clip lives five minutes and opens once,
// so the window for finding any particular one is small and closes for good the
// moment it is read. That is why the lifetime is fixed here rather than offered
// as a choice: it is a security parameter, not a preference.
//
// The product surfaces say this plainly. If the code is ever lengthened again,
// the zero-knowledge design is in git history and worth restoring.

export const CLIP_CODE_LENGTH = 4

// Fixed. See above: this is what bounds the exposure of a guessable code.
export const CLIP_TTL_SECONDS = 300

// Uniform over 0000-9999. Math.random would make one code predictable from
// another, which matters more here than usual because the space is small.
export function generateClipCode(): string {
  const bytes = new Uint32Array(1)
  let value: number
  // Rejection sampling: 2^32 is not a multiple of 10,000, so an unfiltered
  // remainder would favour the lowest 967 codes.
  const limit = Math.floor(0x100000000 / 10000) * 10000
  do {
    globalThis.crypto.getRandomValues(bytes)
    value = bytes[0]
  } while (value >= limit)
  return String(value % 10000).padStart(CLIP_CODE_LENGTH, '0')
}

// Accepts what a person types: spaces, dashes and anything else non-numeric are
// dropped, so "12 34" and "1234" are the same code. Returns null when the
// result is not four digits, so callers never reach storage with junk.
export function normalizeClipCode(input: string): string | null {
  if (typeof input !== 'string') return null
  const digits = input.replace(/\D/g, '')
  return digits.length === CLIP_CODE_LENGTH ? digits : null
}

// Four digits read fine ungrouped.
export function formatClipCode(code: string): string {
  return code
}

const IV_BYTES = 12
const KEY_BITS = 256

function getSubtle(): SubtleCrypto {
  const c = globalThis.crypto
  if (!c?.subtle) {
    throw new Error('Web Crypto API unavailable (requires a secure context / HTTPS)')
  }
  return c.subtle
}

function bs(u: Uint8Array): BufferSource {
  return u as unknown as BufferSource
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i += 1) bin += String.fromCharCode(bytes[i])
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(s: string): Uint8Array {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'))
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i)
  return out
}

export interface SealedClip {
  ciphertext: string
  iv: string
  // Travels to the server and is stored beside the ciphertext. That is the
  // honest shape of the tradeoff above. Encrypting in the browser still keeps
  // plaintext out of request bodies and out of anything that logs them, but it
  // does not keep the clip from the server.
  key: string
}

export async function sealClip(plaintext: string): Promise<SealedClip> {
  const subtle = getSubtle()
  const key = await subtle.generateKey({ name: 'AES-GCM', length: KEY_BITS }, true, [
    'encrypt',
    'decrypt',
  ])
  const iv = new Uint8Array(IV_BYTES)
  globalThis.crypto.getRandomValues(iv)

  const ciphertext = new Uint8Array(
    await subtle.encrypt(
      { name: 'AES-GCM', iv: bs(iv) },
      key,
      bs(new TextEncoder().encode(plaintext))
    )
  )
  const raw = new Uint8Array(await subtle.exportKey('raw', key))

  return {
    ciphertext: toBase64Url(ciphertext),
    iv: toBase64Url(iv),
    key: toBase64Url(raw),
  }
}

export async function openClip(payload: SealedClip): Promise<string> {
  const subtle = getSubtle()
  const key = await subtle.importKey(
    'raw',
    bs(fromBase64Url(payload.key)),
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  )
  const plain = await subtle.decrypt(
    { name: 'AES-GCM', iv: bs(fromBase64Url(payload.iv)) },
    key,
    bs(fromBase64Url(payload.ciphertext))
  )
  return new TextDecoder().decode(plain)
}
