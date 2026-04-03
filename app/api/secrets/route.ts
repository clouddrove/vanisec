import { NextRequest, NextResponse } from 'next/server'
import { createSecret } from '@/lib/secrets'
import type { SecretFile } from '@/lib/secrets'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''

    let secret: string
    let password: string | undefined
    let expiresIn: number = 24
    let file: SecretFile | undefined

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      secret = formData.get('secret') as string || ''
      password = formData.get('password') as string || undefined
      expiresIn = parseInt(formData.get('expiresIn') as string) || 24

      const uploadedFile = formData.get('file') as File | null
      if (uploadedFile && uploadedFile.size > 0) {
        if (uploadedFile.size > MAX_FILE_SIZE) {
          return NextResponse.json(
            { error: 'File size exceeds 5MB limit' },
            { status: 400 }
          )
        }
        const buffer = await uploadedFile.arrayBuffer()
        file = {
          name: uploadedFile.name,
          type: uploadedFile.type,
          size: uploadedFile.size,
          data: Buffer.from(buffer).toString('base64'),
        }
      }
    } else {
      const body = await request.json()
      secret = body.secret
      password = body.password
      expiresIn = body.expiresIn || 24
    }

    if ((!secret || typeof secret !== 'string' || !secret.trim()) && !file) {
      return NextResponse.json(
        { error: 'Secret text or file is required' },
        { status: 400 }
      )
    }

    if (!password || typeof password !== 'string' || !password.trim()) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      )
    }

    const id = await createSecret(secret || '', password, expiresIn, file)

    return NextResponse.json({ id })
  } catch {
    return NextResponse.json(
      { error: 'Failed to create secret' },
      { status: 500 }
    )
  }
}
