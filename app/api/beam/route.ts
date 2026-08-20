import { NextRequest, NextResponse } from 'next/server'
import { createBeam } from '@/lib/beam'
import { formatCode } from '@/lib/pairingCode'
import { rateLimit, clientIp } from '@/lib/rateLimit'

// POST /api/beam registers a waiting receiver and returns its code.
//
// The body is a P-256 public key. The server never sees the private half, so a
// beam is not a secret: it is an address that one payload can be sealed to.
const CREATE_LIMIT_PER_IP = 20
const CREATE_WINDOW_SECONDS = 600

// An uncompressed P-256 point is 65 bytes, about 87 base64url characters.
const MAX_KEY_CHARS = 200

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request.headers) ?? 'unknown'
    const rl = await rateLimit(`beam-create:${ip}`, CREATE_LIMIT_PER_IP, CREATE_WINDOW_SECONDS)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many codes requested. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rl.resetSeconds) } }
      )
    }

    const { publicKey } = await request.json()
    if (typeof publicKey !== 'string' || publicKey.length === 0 || publicKey.length > MAX_KEY_CHARS) {
      return NextResponse.json({ error: 'Invalid public key' }, { status: 400 })
    }

    const beam = await createBeam(publicKey)
    if (!beam) {
      return NextResponse.json({ error: 'Could not create a code' }, { status: 503 })
    }

    return NextResponse.json({
      code: formatCode(beam.code),
      token: beam.token,
      expiresIn: beam.expiresIn,
    })
  } catch {
    return NextResponse.json({ error: 'Could not create a code' }, { status: 500 })
  }
}
