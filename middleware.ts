import { NextRequest, NextResponse } from 'next/server'

// Nonce-based CSP for the one route that renders decrypted secrets.
//
// The rest of the site is statically prerendered and keeps the header-based
// policy in next.config.js, which still allows inline scripts because Next's
// own RSC bootstrap is inline and a static response cannot carry a per-request
// nonce. /secret/[id] is already dynamically rendered, so scoping the strict
// policy here costs no static generation.
//
// Next reads the nonce from the Content-Security-Policy request header and
// applies it to the scripts it emits, so its inline bootstrap keeps working
// without 'unsafe-inline'.

function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    // strict-dynamic lets the nonced bootstrap load Next's chunks; browsers that
    // honour it ignore the host allowlist, older ones fall back to 'self'.
    `script-src 'nonce-${nonce}' 'strict-dynamic' 'self' https:`,
    // Tailwind and Next both inject styles inline; no nonce is threaded through
    // styled output, so this stays. Style injection is not script execution.
    // globals.css @imports Poppins from Google Fonts.
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    'upgrade-insecure-requests',
  ].join('; ')
}

export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const csp = buildCsp(nonce)

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  // Next parses this to nonce its own inline scripts.
  requestHeaders.set('Content-Security-Policy', csp)

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set('Content-Security-Policy', csp)
  return response
}

export const config = {
  // Only the secret-viewing route. Analytics is loaded programmatically, so no
  // inline script needs a nonce here.
  matcher: ['/secret/:path*'],
}
