import { NextRequest, NextResponse } from 'next/server'
import { takeClip } from '@/lib/clip'
import { normalizeClipCode } from '@/lib/clipCode'
import { rateLimit, clientIp } from '@/lib/rateLimit'

// POST /api/clip/open exchanges a four digit code for the clip, exactly once.
//
// POST rather than GET so a live code never reaches an access log or a Referer
// header.
//
// This limit does real work. Ten thousand codes is a space somebody can walk
// through, so the budget is set well below what an enumeration needs while
// staying far above what a person typing one code could ever hit. It is not a
// complete answer: enough addresses defeat any per-address limit. The five
// minute life and the single use are what actually bound the exposure.
const OPEN_LIMIT = 15
const OPEN_WINDOW_SECONDS = 900

const MAX_CODE_CHARS = 32

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

    const body = await request.json()
    if (typeof body?.code !== 'string' || body.code.length > MAX_CODE_CHARS) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
    }

    const code = normalizeClipCode(body.code)
    if (!code) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
    }

    const clip = await takeClip(code)
    if (!clip) {
      // Unknown, expired and already-opened answer identically. A wrong guess
      // must not reveal which of those it was.
      return NextResponse.json(
        { error: 'That code has expired or has already been used' },
        { status: 404 }
      )
    }

    return NextResponse.json(clip)
  } catch {
    return NextResponse.json({ error: 'Failed to open' }, { status: 500 })
  }
}
