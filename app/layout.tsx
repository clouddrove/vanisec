import type { Metadata } from 'next'
import './globals.css'
import Footer from '@/components/Footer'
import GoogleAnalytics from '@/components/GoogleAnalytics'

export const metadata: Metadata = {
  title: 'Tessera - Secure Secret Sharing',
  description: 'Share once. Vanish forever. Secure one-time secret sharing with automatic deletion.',
  keywords: 'tessera, secret sharing, secure sharing, encrypted secrets, temporary secrets, clouddrove',
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'Tessera - Secure Secret Sharing',
    description: 'Share secrets securely with one-time view access',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen">
        <GoogleAnalytics />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}

