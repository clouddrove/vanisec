import { NextRequest, NextResponse } from 'next/server'
import {
  createClip,
  ALLOWED_EXPIRY_HOURS,
  MAX_CIPHERTEXT_CHARS,
  MAX_ID_CHARS,
} from '@/lib/clip'
import { rateLimit, clientIp } from '@/lib/rateLimit'

// POST /api/clip stores one clipboard entry.
//
// The id arrives from the browser rather than being minted here, because it is
// derived from a code this server is never given. That is the whole design: see
// lib/clipCode.ts. Accepting a client-chosen id is safe because the id is not a
// capability anyone can usefully forge, and a collision is refused rather than
// overwritten.
const CREATE_LIMIT = 30
const CREATE_WINDOW_SECONDS = 600

const MAX_BODY_BYTES = 16_000_000
const MAX_FIELD_CHARS = 1_000

function isShortString(v: unknown, max: number): v is string {
  return typeof v === 'string' && v.length > 0 && v.length <= max
}

export async function POST(request: NextRequest) {
  try {
    const declaredLength = Number(request.headers.get('content-length') || 0)
    if (declaredLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
    }

    const ip = clientIp(request.headers) ?? 'unknown'
    const rl = await rateLimit(`clip-create:${ip}`, CREATE_LIMIT, CREATE_WINDOW_SECONDS)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many clips created. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rl.resetSeconds) } }
      )
    }

    const { id, ciphertext, iv, expiresIn } = await request.json()

    if (!isShortString(id, MAX_ID_CHARS)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }
    if (!isShortString(ciphertext, MAX_CIPHERTEXT_CHARS) || !isShortString(iv, MAX_FIELD_CHARS)) {
      return NextResponse.json({ error: 'Invalid or oversized payload' }, { status: 400 })
    }
    if (!ALLOWED_EXPIRY_HOURS.includes(expiresIn)) {
      return NextResponse.json({ error: 'Invalid expiration time' }, { status: 400 })
    }

    const written = await createClip({ id, ciphertext, iv, expiresIn })
    if (!written) {
      // Only reachable if two browsers drew the same code out of 2^50.
      return NextResponse.json(
        { error: 'That code is already in use. Please try again.' },
        { status: 409 }
      )
    }

    return NextResponse.json({ stored: true })
  } catch {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
