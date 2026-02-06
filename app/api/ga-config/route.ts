import { NextResponse } from 'next/server'

export async function GET() {
  // This reads from runtime environment variables (server-side)
  // Check both GA_ID and NEXT_PUBLIC_GA_ID (in case it's set at runtime)
  // Set GA_ID or NEXT_PUBLIC_GA_ID in your Helm/Kubernetes deployment
  const gaId = process.env.GA_ID || process.env.NEXT_PUBLIC_GA_ID

  return NextResponse.json({ gaId: gaId || null })
}
