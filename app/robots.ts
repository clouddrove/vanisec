import { MetadataRoute } from 'next'

// Helper function to ensure URL has protocol
function ensureProtocol(url: string): string {
  if (!url) return 'https://vanisec.clouddrove.com'
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  return `https://${url}`
}

export default function robots(): MetadataRoute.Robots {
  const baseUrl = ensureProtocol(process.env.NEXT_PUBLIC_BASE_URL || 'https://vanisec.clouddrove.com')

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/secret/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
