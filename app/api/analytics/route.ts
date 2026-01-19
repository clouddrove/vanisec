import { NextRequest, NextResponse } from 'next/server'
import { getAnalytics } from '@/lib/analytics'
import { validateDashboardToken, extractToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Validate token
    const token = extractToken(request)
    if (!validateDashboardToken(token)) {
      return NextResponse.json(
        { error: 'Unauthorized. Valid token required.' },
        { status: 401 }
      )
    }
    
    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '7', 10)
    
    // Limit days to reasonable range (1-90)
    const validDays = Math.max(1, Math.min(90, days))
    
    const analytics = await getAnalytics(validDays)
    
    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Failed to get analytics:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve analytics' },
      { status: 500 }
    )
  }
}

