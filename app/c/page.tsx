import type { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import RedeemForm from './RedeemForm'

// The path is /c rather than something descriptive because it gets typed by
// hand, on a phone, next to the domain.

export const metadata: Metadata = {
  title: 'Enter a pairing code | Vanisec',
  description: 'Open a one-time Vanisec secret by entering the short code shown on your other device.',
  // A pairing code is a live capability for the five minutes it exists. Nothing
  // under this path should be indexed or followed.
  robots: { index: false, follow: false },
}

export default function PairingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-clouddrove-dark mb-3">Enter your code</h1>
            <p className="text-clouddrove-light">
              Type the code shown on your other device. You will still need the password.
            </p>
          </div>
          <RedeemForm />
        </div>
      </main>
      <Footer />
    </div>
  )
}
