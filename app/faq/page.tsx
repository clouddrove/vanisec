import type { Metadata } from 'next'
import Link from 'next/link'
import { FAQS } from '@/lib/faqs'

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
  description: 'Common questions about Vanisec — how one-time secret sharing works, security details, expiration options, and more.',
  alternates: { canonical: '/faq' },
}

export default function FAQPage() {
  const faqs = FAQS

  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-clouddrove-dark mb-4">Frequently Asked Questions</h1>
          <p className="text-lg md:text-xl text-clouddrove-light max-w-2xl mx-auto">
            Everything you need to know about Vanisec
          </p>
        </div>

        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-2xl p-8 border-2 border-clouddrove-light/30">
              <h2 className="text-xl font-bold text-clouddrove-dark mb-3">{faq.question}</h2>
              <p className="text-clouddrove-light leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-white rounded-2xl p-8 border-2 border-clouddrove-light/30">
          <h2 className="text-2xl font-bold text-clouddrove-dark mb-4">Explore More</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/docs" className="block p-4 rounded-xl border border-clouddrove-light/30 hover:border-clouddrove-dark/50 transition-colors">
              <h3 className="font-semibold text-clouddrove-dark mb-1">Documentation</h3>
              <p className="text-sm text-clouddrove-light">Step-by-step guides and best practices</p>
            </Link>
            <Link href="/security" className="block p-4 rounded-xl border border-clouddrove-light/30 hover:border-clouddrove-dark/50 transition-colors">
              <h3 className="font-semibold text-clouddrove-dark mb-1">Security</h3>
              <p className="text-sm text-clouddrove-light">Encryption and compliance details</p>
            </Link>
            <Link href="/api" className="block p-4 rounded-xl border border-clouddrove-light/30 hover:border-clouddrove-dark/50 transition-colors">
              <h3 className="font-semibold text-clouddrove-dark mb-1">API Reference</h3>
              <p className="text-sm text-clouddrove-light">Integrate Vanisec into your apps</p>
            </Link>
          </div>
        </div>

        <div className="mt-8 text-center bg-gradient-to-br from-clouddrove-light/10 to-clouddrove-dark/10 rounded-2xl p-8 border-2 border-clouddrove-light/30">
          <h2 className="text-2xl font-bold text-clouddrove-dark mb-4">Still have questions?</h2>
          <p className="text-clouddrove-light mb-6">
            Can&apos;t find what you&apos;re looking for? Open an issue on GitHub or reach out.
          </p>
          <Link
            href="/contact"
            className="inline-block bg-gradient-to-r from-clouddrove-dark to-clouddrove-light text-white py-4 px-8 rounded-xl font-semibold hover:from-clouddrove-light hover:to-clouddrove-dark transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  )
}
