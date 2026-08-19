import { NextRequest, NextResponse } from 'next/server'
import { peekSecret, takeSecret } from '@/lib/secrets'
import { verifierMatches } from '@/lib/serverCrypto'
import { rateLimit, clientIp } from '@/lib/rateLimit'
import { LEGACY_PBKDF2_ITERATIONS } from '@/lib/kdfParams'

// Password-guessing budget. The verifier gate deliberately does not burn the
// secret on a wrong guess, so without a limit it is an unlimited online oracle.
// Attempts are capped per secret (the thing being attacked) and per IP (to stop
// one client working through many secrets at once).
const ATTEMPT_LIMIT_PER_SECRET = 10
const ATTEMPT_WINDOW_SECONDS = 900
const ATTEMPT_LIMIT_PER_IP = 60
const ATTEMPT_IP_WINDOW_SECONDS = 900

// Metadata reads are cheap but still enumerable; keep them bounded per IP.
const PEEK_LIMIT_PER_IP = 120
const PEEK_WINDOW_SECONDS = 900

function expired(expiresAt: number): boolean {
  return expiresAt < Date.now()
}

function tooMany(resetSeconds: number, message: string) {
  return NextResponse.json(
    { error: message },
    { status: 429, headers: { 'Retry-After': String(resetSeconds) } }
  )
}

// GET: returns only metadata. Every secret is password-protected, so this hands
// back the salts the browser needs to derive the retrieval verifier (authSalt)
// and, on success, the decryption key (encSalt). It never consumes the secret.
// (A non-password path is kept for a future optional-password mode.)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const ip = clientIp(request.headers) ?? 'unknown'
    const rl = await rateLimit(`peek:${ip}`, PEEK_LIMIT_PER_IP, PEEK_WINDOW_SECONDS)
    if (!rl.allowed) {
      return tooMany(rl.resetSeconds, 'Too many requests. Please try again later.')
    }

    const meta = await peekSecret(id)

    if (!meta) {
      return NextResponse.json(
        { error: 'Secret not found or already viewed' },
        { status: 404 }
      )
    }
    if (expired(meta.expiresAt)) {
      await takeSecret(id)
      return NextResponse.json({ error: 'Secret has expired' }, { status: 410 })
    }

    if (meta.passwordProtected) {
      // Only authSalt is needed to compute the verifier. encSalt is withheld
      // until the verifier check passes, so an unauthenticated caller gets
      // nothing usable for key derivation.
      return NextResponse.json(
        {
          requiresPassword: true,
          authSalt: meta.authSalt,
          iterations: meta.iterations ?? LEGACY_PBKDF2_ITERATIONS,
        },
        { status: 401 }
      )
    }

    const secret = await takeSecret(id)
    if (!secret) {
      return NextResponse.json(
        { error: 'Secret not found or already viewed' },
        { status: 404 }
      )
    }
    return NextResponse.json({ ciphertext: secret.ciphertext, iv: secret.iv })
  } catch {
    return NextResponse.json(
      { error: 'Failed to retrieve secret' },
      { status: 500 }
    )
  }
}

// POST: password-protected retrieval. The client sends a PBKDF2 verifier; on a
// match we atomically take the secret. A wrong verifier returns 401 WITHOUT
// deleting, so guesses do not burn the secret. Decryption happens in the
// browser using encSalt — the server never sees the password or the key.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { verifier } = body

    // Bound guessing before doing any work against the stored secret.
    const ip = clientIp(request.headers) ?? 'unknown'
    const ipRl = await rateLimit(
      `attempt-ip:${ip}`,
      ATTEMPT_LIMIT_PER_IP,
      ATTEMPT_IP_WINDOW_SECONDS
    )
    if (!ipRl.allowed) {
      return tooMany(ipRl.resetSeconds, 'Too many attempts. Please try again later.')
    }

    const meta = await peekSecret(id)
    if (!meta) {
      return NextResponse.json(
        { error: 'Secret not found or already viewed' },
        { status: 404 }
      )
    }
    if (expired(meta.expiresAt)) {
      await takeSecret(id)
      return NextResponse.json({ error: 'Secret has expired' }, { status: 410 })
    }

    if (!meta.passwordProtected || !meta.verifierHash) {
      const secret = await takeSecret(id)
      if (!secret) {
        return NextResponse.json(
          { error: 'Secret not found or already viewed' },
          { status: 404 }
        )
      }
      return NextResponse.json({ ciphertext: secret.ciphertext, iv: secret.iv })
    }

    const attemptRl = await rateLimit(
      `attempt:${id}`,
      ATTEMPT_LIMIT_PER_SECRET,
      ATTEMPT_WINDOW_SECONDS
    )
    if (!attemptRl.allowed) {
      return tooMany(
        attemptRl.resetSeconds,
        'Too many incorrect password attempts for this secret.'
      )
    }

    if (typeof verifier !== 'string' || !verifierMatches(verifier, meta.verifierHash)) {
      return NextResponse.json(
        { error: 'Invalid password', attemptsRemaining: attemptRl.remaining },
        { status: 401 }
      )
    }

    // Verifier valid — atomic take wins the race exactly once.
    const secret = await takeSecret(id)
    if (!secret) {
      return NextResponse.json(
        { error: 'Secret has already been viewed' },
        { status: 410 }
      )
    }

    return NextResponse.json({
      ciphertext: secret.ciphertext,
      iv: secret.iv,
      encSalt: secret.encSalt,
      iterations: secret.iterations ?? LEGACY_PBKDF2_ITERATIONS,
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to retrieve secret' },
      { status: 500 }
    )
  }
}
