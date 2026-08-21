import type { Metadata } from 'next'
import Clipboard from '@/components/Clipboard'

export const metadata: Metadata = {
  title: 'Online Clipboard | Vanisec',
  description:
    'Paste text or drop a file, get a short code, and open it on any other device. Encrypted in your browser, opens once, no login.',
  alternates: { canonical: 'https://vanisec.clouddrove.com/clipboard' },
}

export default function ClipboardPage() {
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-clouddrove-dark mb-3">Clipboard</h1>
          <p className="text-lg text-clouddrove-light">
            Paste something, get a four digit code, open it on any other device. Five minutes, one use, no login.
          </p>
        </div>
        <Clipboard />
      </div>
    </div>
  )
}
