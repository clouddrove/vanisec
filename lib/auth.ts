/**
 * Validates dashboard access token
 */
export function validateDashboardToken(token: string | null): boolean {
  const expectedToken = process.env.DASHBOARD_TOKEN
  
  if (!expectedToken) {
    // If no token is configured, allow access (for development)
    // In production, this should always be set
    return true
  }
  
  if (!token) {
    return false
  }
  
  return token === expectedToken
}

/**
 * Extracts token from request headers or query params
 */
export function extractToken(request: Request): string | null {
  // Check Authorization header first
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  
  // Check query parameter
  const url = new URL(request.url)
  const tokenParam = url.searchParams.get('token')
  if (tokenParam) {
    return tokenParam
  }
  
  return null
}

