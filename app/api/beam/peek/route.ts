import { NextRequest, NextResponse } from 'next/server'
import { beamPublicKey } from '@/lib/beam'
import { rateLimit, clientIp } from '@/lib/rateLimit'

// POST /api/beam/peek returns the public key waiting under a code.
//
// Non-destructive, and safe to hand out: a public key is only useful for
// sealing something to the device that made it. This is also what /c calls
// first to work out which kind of code it was given.
const PEEK_LIMIT_PER_IP = 30
const PEEK_WINDOW_SECONDS = 900

const MAX_CODE_CHARS = 32

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request.headers) ?? 'unknown'
    const rl = await rateLimit(`beam-peek:${ip}`, PEEK_LIMIT_PER_IP, PEEK_WINDOW_SECONDS)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rl.resetSeconds) } }
      )
    }

    const { code } = await request.json()
    if (typeof code !== 'string' || code.length === 0 || code.length > MAX_CODE_CHARS) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
    }

    const publicKey = await beamPublicKey(code)
    if (!publicKey) {
      return NextResponse.json(
        { error: 'That code has expired or has already been used' },
        { status: 404 }
      )
    }

    return NextResponse.json({ publicKey })
  } catch {
    return NextResponse.json({ error: 'Could not look up that code' }, { status: 500 })
  }
}
