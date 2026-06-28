import { createHash, timingSafeEqual } from 'crypto'

// The client sends a PBKDF2-stretched "verifier" to gate retrieval of a
// password-protected secret. We never store the live verifier — only its
// SHA-256 hash — so a Redis leak cannot be replayed directly against the API.
// (Offline password brute-force resistance comes from the client-side PBKDF2
// work factor, identical to a no-gate design.)

export function hashVerifier(verifierBase64Url: string): string {
  return createHash('sha256').update(verifierBase64Url).digest('hex')
}

export function verifierMatches(verifierBase64Url: string, storedHash: string): boolean {
  const candidate = Buffer.from(hashVerifier(verifierBase64Url), 'hex')
  const stored = Buffer.from(storedHash, 'hex')
  if (candidate.length !== stored.length) return false
  return timingSafeEqual(candidate, stored)
}
