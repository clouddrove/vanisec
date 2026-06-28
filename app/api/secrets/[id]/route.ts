import { NextRequest, NextResponse } from 'next/server'
import { peekSecret, takeSecret } from '@/lib/secrets'
import { verifierMatches } from '@/lib/serverCrypto'

function expired(expiresAt: number): boolean {
  return expiresAt < Date.now()
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
      return NextResponse.json(
        { requiresPassword: true, encSalt: meta.encSalt, authSalt: meta.authSalt },
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

    if (typeof verifier !== 'string' || !verifierMatches(verifier, meta.verifierHash)) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
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
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to retrieve secret' },
      { status: 500 }
    )
  }
}
