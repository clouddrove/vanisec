'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'

export default function GoogleAnalyticsRuntime() {
  const [gaId, setGaId] = useState<string | null>(null)

  useEffect(() => {
    // Try build-time env var first
    const buildTimeId = process.env.NEXT_PUBLIC_GA_ID
    
    if (buildTimeId) {
      setGaId(buildTimeId)
      return
    }

    // If not available at build time, fetch from server API
    fetch('/api/ga-config')
      .then(res => res.json())
      .then(data => {
        if (data.gaId) {
          setGaId(data.gaId)
          
          // Dynamically inject Google Analytics
          const script1 = document.createElement('script')
          script1.async = true
          script1.src = `https://www.googletagmanager.com/gtag/js?id=${data.gaId}`
          document.head.appendChild(script1)

          const script2 = document.createElement('script')
          script2.innerHTML = `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${data.gaId}');
          `
          document.head.appendChild(script2)
        }
      })
      .catch(err => console.error('Failed to load GA config:', err))
  }, [])

  // If we have build-time ID, use Next.js Script component (better)
  if (gaId && process.env.NEXT_PUBLIC_GA_ID) {
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

  // Runtime injection handled in useEffect above
  return null
}
