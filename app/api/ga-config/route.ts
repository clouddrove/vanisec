import { NextResponse } from 'next/server'

export async function GET() {
  // Server reads runtime env: set GA_ID or NEXT_PUBLIC_GA_ID in Helm/Kubernetes
  const gaId = process.env.GA_ID || process.env.NEXT_PUBLIC_GA_ID
  return NextResponse.json({ gaId: gaId || null })
}
