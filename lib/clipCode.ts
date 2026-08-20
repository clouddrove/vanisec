// The clipboard code: one string that is both where a clip lives and the key
// that opens it.
//
// The other flows split those apart. A secret link carries a locator and asks
// for a password; a pairing code carries a locator and still asks for the
// password. That split exists so two people who share nothing can exchange a
// secret. It is the wrong shape for "put this on my phone in ten seconds",
// where the password is the entire friction.
//
// So there is no password here. A single high-entropy code is generated for
// you, and one PBKDF2 pass over it produces 512 bits: the first half is the id
// the server stores under, the second half is the AES key. **The code itself
// never leaves the browser.** The server sees an id and ciphertext and cannot
// walk back from one to the other.
//
// That is what keeps this zero-knowledge without a password. It also means the
// code is the whole secret: anyone who sees it in transit can read the clip,
// exactly once. Same bargain as any link-based tool, and the reason clips
// expire quickly.

import { ALPHABET } from './pairingCode'

// Ten characters over a 32-symbol alphabet: 2^50.
//
// Longer than a pairing code (2^40) on purpose. A pairing code only locates a
// secret that a password still guards, so its entropy is not the last line of
// defence. This one is: the whole key derives from it. Reversing an id to its
// code means 2^50 PBKDF2 passes at the iteration count below, which is not a
// computation anyone is doing.
export const CLIP_CODE_LENGTH = 10
const GROUP_SIZE = 5

// A fixed salt, deliberately. Per-clip salts exist to stop one precomputation
// covering many secrets, which matters when the input is a human-chosen
// password drawn from a small space. Here every code is 50 random bits, so
// there is no small space to precompute and a stored salt would only be one
// more round trip before the browser can derive anything.
const ID_SALT = 'vanisec-clip-v1'

// Matches the floor used everywhere else in the app.
const CLIP_ITERATIONS = 600_000

const DERIVED_BITS = 512

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

export function generateClipCode(): string {
  const bytes = new Uint8Array(CLIP_CODE_LENGTH)
  globalThis.crypto.getRandomValues(bytes)
  let code = ''
  // 32 divides 256, so a byte modulo the alphabet length is unbiased.
  for (let i = 0; i < bytes.length; i += 1) code += ALPHABET[bytes[i] % ALPHABET.length]
  return code
}

// Same folding as pairing codes: the alphabet omits I, L, O and U, so any of
// those can only be a misread digit.
export function normalizeClipCode(input: string): string | null {
  if (typeof input !== 'string') return null
  const folded = input
    .toUpperCase()
    .replace(/[\s-]/g, '')
    .replace(/[IL]/g, '1')
    .replace(/O/g, '0')

  if (folded.length !== CLIP_CODE_LENGTH) return null
  for (const char of folded) {
    if (!ALPHABET.includes(char)) return null
  }
  return folded
}

export function formatClipCode(code: string): string {
  const groups: string[] = []
  for (let i = 0; i < code.length; i += GROUP_SIZE) {
    groups.push(code.slice(i, i + GROUP_SIZE))
  }
  return groups.join('-')
}

export interface ClipMaterial {
  // Safe to send. Derived through PBKDF2, so it does not lead back to the code.
  id: string
  // Never leaves the browser.
  key: CryptoKey
}

// One PBKDF2 pass, split in half. Doing it twice would double the wait on a
// phone for no gain: both halves come from the same code either way.
export async function deriveClipMaterial(code: string): Promise<ClipMaterial> {
  const subtle = getSubtle()
  const base = await subtle.importKey(
    'raw',
    bs(new TextEncoder().encode(code)),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const derived = new Uint8Array(
    await subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: bs(new TextEncoder().encode(ID_SALT)),
        iterations: CLIP_ITERATIONS,
        hash: 'SHA-256',
      },
      base,
      DERIVED_BITS
    )
  )

  const idBytes = derived.slice(0, 32)
  const keyBytes = derived.slice(32, 64)
  const key = await subtle.importKey('raw', bs(keyBytes), { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ])

  return { id: toBase64Url(idBytes), key }
}
