import { NextRequest, NextResponse } from 'next/server'
import { createSecret } from '@/lib/secrets'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { secret, password, expiresIn = 24 } = body

    if (!secret || typeof secret !== 'string') {
      return NextResponse.json(
        { error: 'Secret is required' },
        { status: 400 }
      )
    }

    if (!password || typeof password !== 'string' || !password.trim()) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      )
    }

    const id = await createSecret(secret, password, expiresIn)

    return NextResponse.json({ id })
  } catch {
    return NextResponse.json(
      { error: 'Failed to create secret' },
      { status: 500 }
    )
  }
}
