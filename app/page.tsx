import type { Metadata } from 'next'
import SecretForm from '@/components/SecretForm'
import Features from '@/components/Features'
import HowItWorks from '@/components/HowItWorks'
import UseCases from '@/components/UseCases'

export const metadata: Metadata = {
  title: 'Vanisec - Designed to vanish | Share Once, Vanish Forever',
  description: 'Share sensitive information securely with Vanisec. Free, encrypted, one-time secret sharing that automatically deletes after viewing. Perfect for passwords, API keys, credentials, and confidential data. No sign-up required.',
  keywords: [
    // Primary keywords
    'one time secret',
    'one-time secret',
    'OTS',
    'secret sharing',
    'secure secret sharing',
    'one time secret sharing',
    'onetimesecret',
    
    // Security and encryption
    'encrypted secrets',
    'secure secrets',
    'temporary secrets',
    'self-destructing secrets',
    'burn after reading',
    'ephemeral secrets',
    
    // Use cases
    'password sharing',
    'secure password sharing',
    'API key sharing',
    'credential sharing',
    'token sharing',
    'access key sharing',
    'database password sharing',
    
    // Features
    'secure link',
    'one-time link',
    'self-destructing link',
    'self-destructing message',
    'secure message',
    'private message',
    'encrypted message',
    
    // Service type
    'free secret sharing',
    'no signup secret sharing',
    'anonymous secret sharing',
    'temporary secrets',
    'privacy tool',
    'security tool',
    'secure communication',
    
    // Technical
    'auto-delete',
    'automatic deletion',
    'secure paste',
    'private paste',
    'encrypted paste',
  ],
  openGraph: {
    title: 'Vanisec - Designed to vanish',
    description: 'Share sensitive information securely. Encrypted, one-time secret sharing that automatically deletes after viewing. Free and no sign-up required.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vanisec - Designed to vanish',
    description: 'Share sensitive information securely. Encrypted, one-time secret sharing that automatically deletes after viewing.',
  },
}

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden bg-white">
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
            <h1 className="text-clouddrove-light text-2xl font-light tracking-wide mb-2">Vanisec</h1>
            <p className="text-clouddrove-dark text-base font-medium italic tracking-wide">
              Share once. Vanish forever.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-clouddrove-light"></div>
              <div className="w-2 h-2 rounded-full bg-clouddrove-dark"></div>
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-clouddrove-light"></div>
            </div>
          </div>

          {/* Main Card */}
          <SecretForm />
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
