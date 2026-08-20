import type { Metadata } from 'next'
import RedeemForm from './RedeemForm'

// The path is /c rather than something descriptive because it gets typed by
// hand, on a phone, next to the domain.
//
// Header and Footer come from app/layout.tsx, which also supplies the <main>
// wrapper. Rendering them here too would duplicate the nav.

export const metadata: Metadata = {
  title: 'Enter a pairing code | Vanisec',
  description: 'Open a one-time Vanisec secret by entering the short code shown on your other device.',
  // A pairing code is a live capability for the five minutes it exists. Nothing
  // under this path should be indexed or followed.
  robots: { index: false, follow: false },
}

export default function PairingPage() {
  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-clouddrove-dark mb-4">Enter your code</h1>
          <p className="text-lg text-clouddrove-light">
            Type the code shown on your other device. You will still need the password.
          </p>
        </div>
        <RedeemForm />
      </div>
    </div>
  )
}
