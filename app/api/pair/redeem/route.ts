import { NextRequest, NextResponse } from 'next/server'
import { redeemCode } from '@/lib/pairing'
import { rateLimit, clientIp } from '@/lib/rateLimit'

// POST /api/pair/redeem exchanges a pairing code for the secret id.
//
// POST rather than GET so a code never reaches an access log, a Referer header
// or browser history.
//
// This limit is the brute-force wall. A code is 2^40, so even unlimited
// guessing would not be quick, but the budget keeps it far out of reach and
// costs a legitimate user nothing: they type one code, once.
const REDEEM_LIMIT_PER_IP = 10
const REDEEM_WINDOW_SECONDS = 900

// Comfortably over an 8 character code plus separators and stray whitespace.
const MAX_CODE_CHARS = 32

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request.headers) ?? 'unknown'
    const rl = await rateLimit(`pair-redeem:${ip}`, REDEEM_LIMIT_PER_IP, REDEEM_WINDOW_SECONDS)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rl.resetSeconds) } }
      )
    }

    const body = await request.json()
    const { code } = body

    if (typeof code !== 'string' || code.length === 0 || code.length > MAX_CODE_CHARS) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
    }

    const id = await redeemCode(code)
    if (!id) {
      // Malformed, unknown, expired and already-redeemed all answer the same
      // way. A wrong guess must not reveal which of those it was.
      return NextResponse.json(
        { error: 'That code has expired or has already been used' },
        { status: 404 }
      )
    }

    return NextResponse.json({ id })
  } catch {
    return NextResponse.json({ error: 'Failed to redeem code' }, { status: 500 })
  }
}
