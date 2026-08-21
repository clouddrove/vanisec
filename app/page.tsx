import type { Metadata } from 'next'
import Link from 'next/link'
import SecretForm from '@/components/SecretForm'
import Features from '@/components/Features'
import HowItWorks from '@/components/HowItWorks'
import UseCases from '@/components/UseCases'

export const metadata: Metadata = {
  title: 'Vanisec — Free One-Time Secret Sharing | Share Once, Vanish Forever',
  description: 'Share sensitive information securely with Vanisec. Free, encrypted, one-time secret sharing that automatically deletes after viewing. Perfect for passwords, API keys, credentials, and confidential data. No sign-up required.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Vanisec - Free One-Time Secret Sharing',
    description: 'Share sensitive information securely. Encrypted, one-time secret sharing that automatically deletes after viewing. Free and no sign-up required.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vanisec - Free One-Time Secret Sharing',
    description: 'Share sensitive information securely. Encrypted, one-time secret sharing that automatically deletes after viewing.',
  },
}

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center px-4 py-10 md:py-16 relative overflow-hidden bg-white">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-clouddrove-light opacity-5 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-clouddrove-dark opacity-5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="w-full max-w-2xl relative z-10">
          {/* Logo and Branding */}
          <div className="text-center mb-12">
            <div className="inline-block mb-6 animate-float">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-clouddrove-light via-clouddrove-dark to-clouddrove-light flex items-center justify-center shadow-glow transform rotate-3 hover:rotate-0 transition-transform duration-300">
                  <span className="text-white text-5xl font-bold">V</span>
                </div>
                <div className="absolute -inset-1 bg-gradient-to-br from-clouddrove-light to-clouddrove-dark rounded-2xl blur opacity-30 animate-pulse-slow"></div>
              </div>
            </div>
            <p className="text-clouddrove-light text-2xl font-light tracking-wide mb-2">Vanisec</p>
            <h1 className="text-clouddrove-dark text-sm md:text-base font-medium tracking-wide">
              Free One-Time Secret Sharing — Share Once, Vanish Forever
            </h1>
            <div className="mt-4 flex items-center justify-center gap-2">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-clouddrove-light"></div>
              <div className="w-2 h-2 rounded-full bg-clouddrove-dark"></div>
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-clouddrove-light"></div>
            </div>
          </div>

          {/* Main Card */}
          <SecretForm />

          {/* The other door. Someone who wants to move text between their own
              devices does not need a password or a one-time link, and would
              otherwise have to find the clipboard in the nav. */}
          <p className="text-center text-sm text-clouddrove-light mt-6">
            Just moving text between your own devices?{' '}
            <Link
              href="/clipboard"
              className="font-semibold text-clouddrove-dark underline underline-offset-4 hover:text-clouddrove-light"
            >
              Use the clipboard
            </Link>{' '}
            instead. No password, just a short code.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <Features />

      {/* How It Works Section */}
      <HowItWorks />

      {/* Use Cases Section */}
      <UseCases />
    </>
  )
}
