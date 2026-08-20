import type { Metadata } from 'next'
import ReceiveView from './ReceiveView'

// /r is short because it gets typed by hand next to the domain, same reasoning
// as /c. Header and Footer come from app/layout.tsx.

export const metadata: Metadata = {
  title: 'Receive on this device | Vanisec',
  description: 'Get a short code, then send text to this device from another one without a password.',
  // A live code is a capability for the five minutes it exists.
  robots: { index: false, follow: false },
}

export default function ReceivePage() {
  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-clouddrove-dark mb-4">
            Receive on this device
          </h1>
          <p className="text-lg text-clouddrove-light">
            Show this code on your other device to send text here. No password.
          </p>
        </div>
        <ReceiveView />
      </div>
    </div>
  )
}
