import { NextRequest, NextResponse } from 'next/server'
import { deliver, MAX_PAYLOAD_CHARS } from '@/lib/beam'
import { rateLimit, clientIp } from '@/lib/rateLimit'

// POST /api/beam/send delivers one sealed payload to a waiting receiver.
//
// Everything here is already encrypted to the receiver's public key, so the
// server is storing a blob it cannot read, exactly as with a normal secret.
const SEND_LIMIT_PER_IP = 30
const SEND_WINDOW_SECONDS = 900

const MAX_CODE_CHARS = 32
const MAX_FIELD_CHARS = 1_000

function isShortString(v: unknown, max: number): v is string {
  return typeof v === 'string' && v.length > 0 && v.length <= max
}

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request.headers) ?? 'unknown'
    const rl = await rateLimit(`beam-send:${ip}`, SEND_LIMIT_PER_IP, SEND_WINDOW_SECONDS)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many sends. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rl.resetSeconds) } }
      )
    }

    const { code, ciphertext, iv, senderPublicKey } = await request.json()

    if (!isShortString(code, MAX_CODE_CHARS)) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
    }
    if (
      !isShortString(ciphertext, MAX_PAYLOAD_CHARS) ||
      !isShortString(iv, MAX_FIELD_CHARS) ||
      !isShortString(senderPublicKey, MAX_FIELD_CHARS)
    ) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const result = await deliver(code, { ciphertext, iv, senderPublicKey })
    if (result === 'not-found') {
      return NextResponse.json(
        { error: 'That code has expired or has already been used' },
        { status: 404 }
      )
    }
    if (result === 'occupied') {
      // Refused rather than overwritten, so a second sender cannot replace what
      // the receiver is about to read.
      return NextResponse.json(
        { error: 'Something has already been sent to that code' },
        { status: 409 }
      )
    }

    return NextResponse.json({ delivered: true })
  } catch {
    return NextResponse.json({ error: 'Could not send to that code' }, { status: 500 })
  }
}
