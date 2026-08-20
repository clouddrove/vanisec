import { NextRequest, NextResponse } from 'next/server'
import { takeClip, MAX_ID_CHARS } from '@/lib/clip'
import { rateLimit, clientIp } from '@/lib/rateLimit'

// POST /api/clip/open exchanges an id for the ciphertext, exactly once.
//
// POST rather than GET so an id never reaches an access log or a Referer
// header. There is no password step: whoever derived this id holds the code,
// and the code is what decrypts. The server hands over a blob either way.
const OPEN_LIMIT = 60
const OPEN_WINDOW_SECONDS = 900

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request.headers) ?? 'unknown'
    const rl = await rateLimit(`clip-open:${ip}`, OPEN_LIMIT, OPEN_WINDOW_SECONDS)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rl.resetSeconds) } }
      )
    }

    const { id } = await request.json()
    if (typeof id !== 'string' || id.length === 0 || id.length > MAX_ID_CHARS) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
    }

    const clip = await takeClip(id)
    if (!clip) {
      // Unknown, expired and already-opened answer identically. A wrong code
      // must not reveal which of those it was.
      return NextResponse.json(
        { error: 'That code has expired or has already been used' },
        { status: 404 }
      )
    }

    return NextResponse.json({ ciphertext: clip.ciphertext, iv: clip.iv })
  } catch {
    return NextResponse.json({ error: 'Failed to open' }, { status: 500 })
  }
}
