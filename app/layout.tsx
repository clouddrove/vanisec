import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import GoogleAnalytics from '@/components/GoogleAnalytics'
import StructuredData from '@/components/StructuredData'

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tessera.clouddrove.com'

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Tessera - Free Secure One-Time Secret Sharing | Share Once, Vanish Forever',
    template: '%s | Tessera - Secure Secret Sharing',
  },
  description: 'Share sensitive information securely with Tessera. Free, encrypted, one-time secret sharing that automatically deletes after viewing. Perfect for passwords, API keys, credentials, and confidential data. No sign-up required.',
  keywords: [
    // Brand and product names
    'tessera',
    'OTS',
    'one time secret',
    'one-time secret',
    'onetimesecret',
    'one time secret sharing',
    
    // Core functionality
    'secret sharing',
    'secure secret sharing',
    'encrypted secret sharing',
    'temporary secret sharing',
    'one-time secret sharing',
    'secure sharing',
    'private sharing',
    'confidential sharing',
    
    // Security features
    'encrypted secrets',
    'secure secrets',
    'temporary secrets',
    'self-destructing secrets',
    'burn after reading',
    'ephemeral secrets',
    'disposable secrets',
    
    // Use cases
    'password sharing',
    'secure password sharing',
    'API key sharing',
    'credential sharing',
    'secure credential sharing',
    'token sharing',
    'access key sharing',
    'database password sharing',
    'confidential data sharing',
    
    // Communication
    'secure link',
    'secure URL',
    'private link',
    'temporary link',
    'one-time link',
    'self-destructing link',
    'self-destructing message',
    'secure message',
    'private message',
    'encrypted message',
    'secure communication',
    'private communication',
    
    // Privacy and security
    'privacy tool',
    'security tool',
    'encryption tool',
    'data privacy',
    'information security',
    'secure data transfer',
    'private data sharing',
    
    // Service characteristics
    'free secret sharing',
    'free secure sharing',
    'no signup secret sharing',
    'anonymous secret sharing',
    'encrypted messaging',
    'secure messaging',
    'private messaging',
    
    // Technical terms
    'end-to-end encryption',
    'zero-knowledge',
    'client-side encryption',
    'secure storage',
    'temporary storage',
    'auto-delete',
    'automatic deletion',
    'TTL secrets',
    
    // Alternatives and related
    'secure paste',
    'private paste',
    'encrypted paste',
    'secure note sharing',
    'private note sharing',
    'secure text sharing',
    'private text sharing',
    
    // Company
    'clouddrove',
    'clouddrove tessera',
  ],
  authors: [{ name: 'CloudDrove' }],
  creator: 'CloudDrove',
  publisher: 'CloudDrove',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: baseUrl,
    siteName: 'Tessera',
    title: 'Tessera - Free Secure One-Time Secret Sharing',
    description: 'Share sensitive information securely. Encrypted, one-time secret sharing that automatically deletes after viewing. Free and no sign-up required.',
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Tessera - Secure Secret Sharing',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tessera - Free Secure One-Time Secret Sharing',
    description: 'Share sensitive information securely. Encrypted, one-time secret sharing that automatically deletes after viewing.',
    images: [`${baseUrl}/og-image.png`],
    creator: '@clouddrove',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: baseUrl,
  },
  category: 'Security',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen">
        <StructuredData />
        <GoogleAnalytics />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}

