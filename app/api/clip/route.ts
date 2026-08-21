import { NextRequest, NextResponse } from 'next/server'
import { createClip, MAX_CIPHERTEXT_CHARS, MAX_FIELD_CHARS } from '@/lib/clip'
import { rateLimit, clientIp } from '@/lib/rateLimit'

// POST /api/clip stores one clipboard entry and returns its four digit code.
//
// The server mints the code, so a client cannot pick one, and cannot probe for
// which codes are free by trying to claim them.
const CREATE_LIMIT = 30
const CREATE_WINDOW_SECONDS = 600

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

    const ip = clientIp(request.headers) ?? 'unknown'
    const rl = await rateLimit(`clip-create:${ip}`, CREATE_LIMIT, CREATE_WINDOW_SECONDS)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many clips created. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rl.resetSeconds) } }
      )
    }

    const { ciphertext, iv, key } = await request.json()

    if (!isShortString(ciphertext, MAX_CIPHERTEXT_CHARS)) {
      return NextResponse.json({ error: 'Invalid or oversized payload' }, { status: 400 })
    }
    if (!isShortString(iv, MAX_FIELD_CHARS) || !isShortString(key, MAX_FIELD_CHARS)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const created = await createClip({ ciphertext, iv, key })
    if (!created) {
      // Every code tried was taken. With 10,000 codes and a five minute life
      // this needs a lot of traffic, and asking the caller to retry is better
      // than evicting somebody else's clip.
      return NextResponse.json(
        { error: 'Too many clips in flight. Please try again in a moment.' },
        { status: 503 }
      )
    }

    return NextResponse.json(created)
  } catch {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
