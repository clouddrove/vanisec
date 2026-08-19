/** @type {import('next').NextConfig} */

// Google Analytics is loaded only when a GA id is configured. Its origins are
// always allowed so the CSP does not have to change at runtime.
const scriptSrc = ["'self'", "'unsafe-inline'", 'https://www.googletagmanager.com']
const connectSrc = ["'self'", 'https://www.google-analytics.com']

const csp = [
  "default-src 'self'",
  `script-src ${scriptSrc.join(' ')}`,
  // Tailwind injects styles inline.
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://www.google-analytics.com",
  "font-src 'self' data:",
  `connect-src ${connectSrc.join(' ')}`,
  // Decrypted secrets are rendered in-page; disallow embedding and plugins.
  "object-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  'upgrade-insecure-requests',
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'no-referrer' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
]

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        // Secret URLs must never be cached by a proxy or the browser.
        source: '/api/secrets/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store, max-age=0' }],
      },
    ]
  },
  // Enable file watching in Docker (for development)
  ...(process.env.NODE_ENV === 'development' && {
    webpack: (config, { isServer }) => {
      if (!isServer) {
        config.watchOptions = {
          poll: 1000,
          aggregateTimeout: 300,
        }
      }
      return config
    },
  }),
}

module.exports = nextConfig
