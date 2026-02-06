'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'

export default function GoogleAnalyticsRuntime() {
  const [gaId, setGaId] = useState<string | null>(null)
  const [isRuntime, setIsRuntime] = useState(false)

  useEffect(() => {
    // Try build-time env var first
    const buildTimeId = process.env.NEXT_PUBLIC_GA_ID
    
    if (buildTimeId) {
      setGaId(buildTimeId)
      return
    }

    // If not available at build time, fetch from server API
    fetch('/api/ga-config')
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }
        return res.json()
      })
      .then(data => {
        if (data?.gaId) {
          const id = data.gaId
          setGaId(id)
          setIsRuntime(true)
          
          // Dynamically inject Google Analytics for runtime
          // Check if scripts already exist to avoid duplicates
          const existingScript = document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${id}"]`)
          if (existingScript) {
            return // Already loaded
          }

          // Initialize dataLayer first
          window.dataLayer = window.dataLayer || []
          function gtag(...args: any[]) {
            window.dataLayer.push(args)
          }
          window.gtag = gtag

          // Load the gtag.js script
          const script1 = document.createElement('script')
          script1.async = true
          script1.src = `https://www.googletagmanager.com/gtag/js?id=${id}`
          script1.onload = () => {
            // Configure GA after script loads
            gtag('js', new Date())
            gtag('config', id)
          }
          document.head.appendChild(script1)
        }
      })
      .catch(err => {
        console.error('Failed to load GA config:', err)
      })
  }, [])

  // If we have build-time ID, use Next.js Script component (better)
  if (gaId && !isRuntime) {
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

  // Runtime injection - return a placeholder div so React knows component mounted
  // Scripts are injected in useEffect above
  return <div style={{ display: 'none' }} data-ga-loaded={gaId ? 'true' : 'false'} />
}
