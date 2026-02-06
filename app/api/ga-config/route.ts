import { NextResponse } from 'next/server'

export async function GET() {
  // This reads from runtime environment variables (server-side)
  // Use GA_ID (without NEXT_PUBLIC_) for runtime configuration
  // Set GA_ID in your Helm/Kubernetes deployment
  const gaId = process.env.GA_ID

  return NextResponse.json({ gaId: gaId || null })
}
