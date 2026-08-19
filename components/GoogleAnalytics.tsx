'use client'

import { useEffect, useState } from 'react'

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

// Loads gtag.js programmatically rather than through an inline <Script> block.
// An inline bootstrap would need script-src 'unsafe-inline', which the
// nonce-based CSP on /secret deliberately does not grant.
export default function GoogleAnalytics() {
  const buildTimeId = process.env.NEXT_PUBLIC_GA_ID || null
  const [gaId, setGaId] = useState<string | null>(buildTimeId)

  useEffect(() => {
    // A build-time id is already in the initial state, so there is nothing to fetch.
    if (buildTimeId) return

    fetch('/api/ga-config')
      .then((res) => res.json())
      .then((data: { gaId?: string }) => {
        if (data?.gaId) setGaId(data.gaId)
      })
      .catch(() => {})
  }, [buildTimeId])

  useEffect(() => {
    if (!gaId) return
    if (document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${gaId}"]`)) return

    window.dataLayer = window.dataLayer || []
    const gtag = (...args: unknown[]) => window.dataLayer.push(args)
    window.gtag = gtag

    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`
    script.onload = () => {
      gtag('js', new Date())
      gtag('config', gaId)
    }
    document.head.appendChild(script)
  }, [gaId])

  return null
}
