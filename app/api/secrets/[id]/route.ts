import { NextRequest, NextResponse } from 'next/server'
import { getSecret, deleteSecret } from '@/lib/secrets'
import { trackSecretViewed } from '@/lib/analytics'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const secret = await getSecret(id)

    if (!secret) {
      return NextResponse.json(
        { error: 'Secret not found or expired' },
        { status: 404 }
      )
    }

    const now = Date.now()
    if (secret.expiresAt < now) {
      await deleteSecret(id)
      return NextResponse.json(
        { error: 'Secret has expired' },
        { status: 410 }
      )
    }

    if (secret.viewed) {
      return NextResponse.json(
        { error: 'Secret has already been viewed' },
        { status: 410 }
      )
    }

    if (secret.password) {
      return NextResponse.json(
        { requiresPassword: true },
        { status: 401 }
      )
    }

    // Mark as viewed and delete
    await deleteSecret(id)
    
    // Track analytics (non-blocking)
    trackSecretViewed().catch((err) => {
      console.error('Failed to track secret view:', err)
    })

    return NextResponse.json({ secret: secret.secret })
  } catch {
    return NextResponse.json(
      { error: 'Failed to retrieve secret' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { password } = body

    const secret = await getSecret(id)

    if (!secret) {
      return NextResponse.json(
        { error: 'Secret not found or expired' },
        { status: 404 }
      )
    }

    const now = Date.now()
    if (secret.expiresAt < now) {
      await deleteSecret(id)
      return NextResponse.json(
        { error: 'Secret has expired' },
        { status: 410 }
      )
    }

    if (secret.viewed) {
      return NextResponse.json(
        { error: 'Secret has already been viewed' },
        { status: 410 }
      )
    }

    if (!secret.password) {
      // No password required, return secret
      await deleteSecret(id)
      
      // Track analytics (non-blocking)
      trackSecretViewed().catch((err) => {
        console.error('Failed to track secret view:', err)
      })
      
      return NextResponse.json({ secret: secret.secret })
    }

    if (secret.password !== password) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      )
    }

    // Password correct, mark as viewed and delete
    await deleteSecret(id)
    
    // Track analytics (non-blocking)
    trackSecretViewed().catch((err) => {
      console.error('Failed to track secret view:', err)
    })

    return NextResponse.json({ secret: secret.secret })
  } catch {
    return NextResponse.json(
      { error: 'Failed to retrieve secret' },
      { status: 500 }
    )
  }
}

