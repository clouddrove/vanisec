// Pairing code format: the short, hand-typeable alternative to carrying a
// secret's UUID in a URL.
//
// Deliberately free of imports. lib/pairing.ts pulls in ioredis and so can only
// ever run inside the Next app, but the mcp/ package is published standalone
// and installs none of the app's dependencies. Keeping format handling in a
// file with no imports is what lets `@lib/pairingCode` cross that boundary, the
// same property that makes lib/clientCrypto.ts importable there today.

// Crockford base32. I, L, O and U are absent: the first three are ambiguous
// when a code is read off one screen and typed into another, and dropping U
// means a random code cannot spell an unfortunate word.
export const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

export const CODE_LENGTH = 8
const GROUP_SIZE = 4

// 32 divides 256, so taking a byte modulo the alphabet length is unbiased.
// Anything that changes ALPHABET's length must revisit this.
function pick(byte: number): string {
  return ALPHABET[byte % ALPHABET.length]
}

// 8 characters over a 32-symbol alphabet: 2^40 codes.
//
// That is far short of the 122 bits in a secret's UUID, which is the whole
// point (a UUID cannot be typed). The gap is covered elsewhere: codes live for
// minutes, resolve exactly once, and redemption is rate limited. See
// lib/pairing.ts.
export function generateCode(): string {
  const bytes = new Uint8Array(CODE_LENGTH)
  globalThis.crypto.getRandomValues(bytes)
  // Indexed rather than for-of: iterating a Uint8Array directly needs
  // downlevelIteration under the app's compiler target.
  let code = ''
  for (let i = 0; i < bytes.length; i += 1) code += pick(bytes[i])
  return code
}

// Folds what a person plausibly types back onto the canonical code.
//
// Someone reading 4F2K-9QX1 off a phone may lowercase it, drop the dash, or
// space it out; and because the alphabet omits I, L and O, any of those
// characters can only be a misread digit. Folding them is strictly safe here
// and means a user who typed exactly what they saw is never punished for it.
//
// Returns null when the result is not a well-formed code, so callers never
// reach Redis with junk.
export function normalizeCode(input: string): string | null {
  if (typeof input !== 'string') return null

  const folded = input
    .toUpperCase()
    .replace(/[\s-]/g, '')
    .replace(/[IL]/g, '1')
    .replace(/O/g, '0')

  if (folded.length !== CODE_LENGTH) return null
  for (const char of folded) {
    if (!ALPHABET.includes(char)) return null
  }
  return folded
}

// Display form, grouped for legibility: 4F2K-9QX1.
export function formatCode(code: string): string {
  const groups: string[] = []
  for (let i = 0; i < code.length; i += GROUP_SIZE) {
    groups.push(code.slice(i, i + GROUP_SIZE))
  }
  return groups.join('-')
}
