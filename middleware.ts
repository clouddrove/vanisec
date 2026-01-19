import { NextRequest, NextResponse } from 'next/server'

/**
 * Checks if an IP address is a private/internal network address
 */
function isPrivateIP(ip: string): boolean {
  // Remove IPv6 prefix if present
  const cleanIP = ip.replace(/^::ffff:/, '')
  
  // IPv4 private ranges
  const privateRanges = [
    /^127\./,                    // 127.0.0.0/8 - Loopback
    /^10\./,                     // 10.0.0.0/8 - Private
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12 - Private
    /^192\.168\./,               // 192.168.0.0/16 - Private
    /^169\.254\./,               // 169.254.0.0/16 - Link-local
    /^::1$/,                     // IPv6 loopback
    /^fc00:/,                    // IPv6 private
    /^fe80:/,                    // IPv6 link-local
  ]
  
  return privateRanges.some(range => range.test(cleanIP))
}

/**
 * Gets the real client IP from request headers
 */
function getClientIP(request: NextRequest): string {
  // Check common proxy headers (in order of preference)
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim()
  }
  
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP.trim()
  }
  
  // Fallback to direct connection IP (may not work behind proxies)
  return request.ip || 'unknown'
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Only protect bob routes
  if (pathname.startsWith('/bob') || pathname.startsWith('/api/analytics')) {
    const clientIP = getClientIP(request)
    
    // If IP is unknown, allow (might be behind proxy without proper headers)
    // You can change this to be more strict if needed
    if (clientIP === 'unknown') {
      console.warn('Bob access: Could not determine client IP')
      // Option 1: Allow (less secure, but works behind proxies)
      // Option 2: Block (more secure, but might block legitimate users behind proxies)
      // For now, we'll allow but log a warning
    } else if (!isPrivateIP(clientIP)) {
      // Block public IPs
      console.warn(`Bob access blocked: Public IP ${clientIP}`)
      return NextResponse.json(
        { error: 'Bob access is restricted to private networks only' },
        { status: 403 }
      )
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/bob/:path*',
    '/api/analytics/:path*',
  ],
}

