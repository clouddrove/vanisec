import { NextRequest, NextResponse } from 'next/server'
import { claim, cancelBeam } from '@/lib/beam'
import { rateLimit, clientIp } from '@/lib/rateLimit'

// POST /api/beam/poll is the receiver asking whether anything has arrived.
//
// The budget is sized for polling rather than for guessing: a receiver waiting
// the full five minutes at two second intervals makes about 150 calls, so this
// has to be roomy. It is not the security boundary. A wrong token answers
// not-found, and a payload is sealed to the receiver's key regardless, so
// nothing here leaks to someone working through codes.
const POLL_LIMIT_PER_IP = 400
const POLL_WINDOW_SECONDS = 900

const MAX_CODE_CHARS = 32
const MAX_TOKEN_CHARS = 128

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request.headers) ?? 'unknown'
    const rl = await rateLimit(`beam-poll:${ip}`, POLL_LIMIT_PER_IP, POLL_WINDOW_SECONDS)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rl.resetSeconds) } }
      )
    }

    const { code, token, cancel } = await request.json()
    if (
      typeof code !== 'string' || code.length === 0 || code.length > MAX_CODE_CHARS ||
      typeof token !== 'string' || token.length === 0 || token.length > MAX_TOKEN_CHARS
    ) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    // The receiver navigating away drops its beam rather than leaving an
    // address live for the rest of its five minutes.
    if (cancel === true) {
      await cancelBeam(code, token)
      return NextResponse.json({ cancelled: true })
    }

    const result = await claim(code, token)
    if (result.status === 'not-found') {
      return NextResponse.json(
        { error: 'That code has expired or has already been used' },
        { status: 404 }
      )
    }
    if (result.status === 'waiting') {
      return NextResponse.json({ waiting: true })
    }

    return NextResponse.json(result.payload)
  } catch {
    return NextResponse.json({ error: 'Could not check that code' }, { status: 500 })
  }
}
