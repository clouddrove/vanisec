import { NextRequest, NextResponse } from 'next/server'
import { createSecret } from '@/lib/secrets'
import { hashVerifier } from '@/lib/serverCrypto'
import { rateLimit, clientIp } from '@/lib/rateLimit'
import { PBKDF2_ITERATIONS } from '@/lib/kdfParams'

// Ciphertext is base64url of the encrypted {text, file} envelope. A 5MB file
// becomes ~6.7MB base64 inside the envelope, then ~8.9MB of ciphertext, so the
// cap is set with headroom. This blunts Redis memory-fill abuse.
const MAX_CIPHERTEXT_CHARS = 12_000_000
const MAX_FIELD_CHARS = 1_000 // iv / salts / verifier are small fixed-size blobs
const ALLOWED_EXPIRY_HOURS = [1, 6, 24, 72, 168]

// Per-IP creation budget.
const CREATE_LIMIT = 30
const CREATE_WINDOW_SECONDS = 600

// Reject oversized bodies from the Content-Length header before request.json()
// pulls the whole payload into memory. MAX_CIPHERTEXT_CHARS still bounds the
// decoded field; this bounds the transfer.
const MAX_BODY_BYTES = 16_000_000

function isShortString(v: unknown, max: number): v is string {
  return typeof v === 'string' && v.length > 0 && v.length <= max
}

export async function POST(request: NextRequest) {
  try {
    const declaredLength = Number(request.headers.get('content-length') || 0)
    if (declaredLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
    }

    // An unresolvable client IP shares one bucket rather than bypassing the
    // limit outright.
    const ip = clientIp(request.headers) ?? 'unknown'
    const rl = await rateLimit(`create:${ip}`, CREATE_LIMIT, CREATE_WINDOW_SECONDS)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many secrets created. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rl.resetSeconds) } }
      )
    }

    const body = await request.json()
    const { ciphertext, iv, passwordProtected, encSalt, authSalt, verifier, expiresIn, iterations } =
      body

    if (!isShortString(ciphertext, MAX_CIPHERTEXT_CHARS)) {
      return NextResponse.json(
        { error: 'Invalid or oversized payload' },
        { status: 400 }
      )
    }
    if (!isShortString(iv, MAX_FIELD_CHARS)) {
      return NextResponse.json({ error: 'Invalid iv' }, { status: 400 })
    }
    // Reject a work factor below the current floor so a tampered client cannot
    // downgrade the KDF cost for a secret it creates.
    if (!Number.isInteger(iterations) || iterations < PBKDF2_ITERATIONS) {
      return NextResponse.json({ error: 'Invalid key derivation parameters' }, { status: 400 })
    }
    if (!ALLOWED_EXPIRY_HOURS.includes(expiresIn)) {
      return NextResponse.json(
        { error: 'Invalid expiration time' },
        { status: 400 }
      )
    }

    // The current product requires a password on every secret. We still model
    // passwordProtected explicitly so an optional-password mode can be added
    // without touching storage.
    const isProtected = passwordProtected === true
    if (!isProtected) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      )
    }

    if (
      !isShortString(encSalt, MAX_FIELD_CHARS) ||
      !isShortString(authSalt, MAX_FIELD_CHARS) ||
      !isShortString(verifier, MAX_FIELD_CHARS)
    ) {
      return NextResponse.json(
        { error: 'Missing password protection parameters' },
        { status: 400 }
      )
    }

    const id = await createSecret({
      ciphertext,
      iv,
      passwordProtected: true,
      encSalt,
      authSalt,
      verifierHash: hashVerifier(verifier),
      iterations,
      expiresIn,
    })

    return NextResponse.json({ id })
  } catch {
    return NextResponse.json(
      { error: 'Failed to create secret' },
      { status: 500 }
    )
  }
}
