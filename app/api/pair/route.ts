import { NextRequest, NextResponse } from 'next/server'
import { mintCode } from '@/lib/pairing'
import { formatCode } from '@/lib/pairingCode'
import { rateLimit, clientIp } from '@/lib/rateLimit'

// POST /api/pair issues a short pairing code for an existing secret.
//
// Minting takes no proof of ownership because there is nothing to prove: the
// caller had to supply the id, which means they already hold the link, and a
// code grants strictly less than the link does. The budget below exists to cap
// how many live codes one client can park in Redis, not to authenticate anyone.
const MINT_LIMIT_PER_IP = 20
const MINT_WINDOW_SECONDS = 600

// The id is a UUID; anything longer is not worth a Redis round trip.
const MAX_ID_CHARS = 100

export async function POST(request: NextRequest) {
  try {
    // An unresolvable client IP shares one bucket rather than bypassing the
    // limit outright, matching /api/secrets.
    const ip = clientIp(request.headers) ?? 'unknown'
    const rl = await rateLimit(`pair-mint:${ip}`, MINT_LIMIT_PER_IP, MINT_WINDOW_SECONDS)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many pairing codes requested. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rl.resetSeconds) } }
      )
    }

    const body = await request.json()
    const { id } = body

    if (typeof id !== 'string' || id.length === 0 || id.length > MAX_ID_CHARS) {
      return NextResponse.json({ error: 'Invalid secret id' }, { status: 400 })
    }

    const minted = await mintCode(id)
    if (!minted) {
      // Covers both a missing secret and one that has expired. They are the
      // same answer to the caller, and distinguishing them would turn this into
      // an existence oracle for ids.
      return NextResponse.json(
        { error: 'Secret not found or already viewed' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      code: formatCode(minted.code),
      expiresIn: minted.expiresIn,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to create pairing code' }, { status: 500 })
  }
}
