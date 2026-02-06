'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

export default function GoogleAnalytics() {
  const buildTimeId = process.env.NEXT_PUBLIC_GA_ID || null
  const [gaId, setGaId] = useState<string | null>(buildTimeId)
  const [source, setSource] = useState<'build' | 'runtime' | null>(buildTimeId ? 'build' : null)

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_GA_ID) {
      setGaId(process.env.NEXT_PUBLIC_GA_ID)
      setSource('build')
      return
    }
    fetch('/api/ga-config')
      .then((res) => res.json())
      .then((data: { gaId?: string }) => {
        if (data?.gaId) {
          setGaId(data.gaId)
          setSource('runtime')
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!gaId || source !== 'runtime') return
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
  }, [gaId, source])

  if (!gaId) return null

  if (source === 'build') {
    return (
      <>
        <Script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
          strategy="afterInteractive"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}');
            `,
          }}
        />
      </>
    )
  }

  return null
}
