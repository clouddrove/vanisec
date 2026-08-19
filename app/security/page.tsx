import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Security & Compliance',
  description: 'How Vanisec protects your data — encryption, one-time access, automatic deletion, and support for SOC 2, GDPR, CCPA, and HIPAA compliance requirements.',
  alternates: { canonical: '/security' },
}

export default function SecurityPage() {
  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-clouddrove-dark mb-4">Security & Compliance</h1>
          <p className="text-lg md:text-xl text-clouddrove-light max-w-2xl mx-auto">
            Your secrets are encrypted, never logged, and permanently deleted after use
          </p>
        </div>

        <div className="space-y-12">
          <section className="bg-white rounded-2xl p-8 border-2 border-clouddrove-light/30">
            <h2 className="text-2xl md:text-3xl font-bold text-clouddrove-dark mb-6">Security Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-semibold text-clouddrove-dark mb-3">Encryption at Rest & in Transit</h3>
                <p className="text-clouddrove-light">
                  All secrets are encrypted before being stored using industry-standard cryptography. Your data is protected both at rest in Redis and in transit over HTTPS.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-clouddrove-dark mb-3">One-Time Access</h3>
                <p className="text-clouddrove-light">
                  Each secret can only be viewed once. The moment it&apos;s opened, it&apos;s permanently and irreversibly deleted from our servers — the link immediately becomes dead.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-clouddrove-dark mb-3">Optional Passphrase</h3>
                <p className="text-clouddrove-light">
                  Add a passphrase to your secret for a second layer of protection. Even if someone intercepts the link, they can&apos;t open the secret without the passphrase.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-clouddrove-dark mb-3">Automatic Expiration</h3>
                <p className="text-clouddrove-light">
                  Secrets automatically expire between 1 hour and 7 days, regardless of whether they were ever viewed. Expired secrets are permanently purged.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-gradient-to-br from-clouddrove-light/10 to-clouddrove-dark/10 rounded-2xl p-8 border-2 border-clouddrove-light/30">
            <h2 className="text-2xl md:text-3xl font-bold text-clouddrove-dark mb-6">Compliance</h2>
            <p className="text-clouddrove-light mb-6">
              Vanisec is designed to help organizations meet data security and privacy compliance requirements:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 border border-clouddrove-light/30">
                <h3 className="text-lg font-semibold text-clouddrove-dark mb-2">SOC 2</h3>
                <p className="text-clouddrove-light text-sm">
                  Supports SOC 2 security requirements around access control and data protection through ephemeral, encrypted storage.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-clouddrove-light/30">
                <h3 className="text-lg font-semibold text-clouddrove-dark mb-2">ISO 27001</h3>
                <p className="text-clouddrove-light text-sm">
                  Aligned with ISO 27001 information security standards for managing sensitive data and controlling access.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-clouddrove-light/30">
                <h3 className="text-lg font-semibold text-clouddrove-dark mb-2">GDPR</h3>
                <p className="text-clouddrove-light text-sm">
                  Meets GDPR principles of data minimization and the right to erasure — secrets are deleted automatically and cannot be recovered.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-clouddrove-light/30">
                <h3 className="text-lg font-semibold text-clouddrove-dark mb-2">CCPA & HIPAA</h3>
                <p className="text-clouddrove-light text-sm">
                  Designed to support CCPA and HIPAA compliance for handling sensitive personal and health-related information.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl p-8 border-2 border-clouddrove-light/30">
            <h2 className="text-2xl md:text-3xl font-bold text-clouddrove-dark mb-6">Privacy & Data Handling</h2>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-clouddrove-dark mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-lg font-semibold text-clouddrove-dark mb-1">No Logging</h3>
                  <p className="text-clouddrove-light">We never write your secrets to application logs, analytics systems, or any persistent storage beyond the ephemeral Redis cache used to serve them.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-clouddrove-dark mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-lg font-semibold text-clouddrove-dark mb-1">No Tracking</h3>
                  <p className="text-clouddrove-light">We don&apos;t track your behavior, collect personal data, or use tracking cookies. Vanisec is designed to know as little about you as possible.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-clouddrove-dark mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-lg font-semibold text-clouddrove-dark mb-1">Permanent Deletion</h3>
                  <p className="text-clouddrove-light">Once a secret is opened or expires, it is permanently and irrecoverably deleted. There are no backups, no snapshots, no way to retrieve it.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-clouddrove-dark mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-lg font-semibold text-clouddrove-dark mb-1">Open Source & Auditable</h3>
                  <p className="text-clouddrove-light">Vanisec is fully open source. You don&apos;t have to take our word for it — read the code, audit our implementation, or run your own instance.</p>
                </div>
              </li>
            </ul>
          </section>

          <section className="bg-white rounded-2xl p-8 border-2 border-clouddrove-light/30">
            <h2 className="text-2xl md:text-3xl font-bold text-clouddrove-dark mb-4">Learn More</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/faq" className="block p-4 rounded-xl border border-clouddrove-light/30 hover:border-clouddrove-dark/50 transition-colors">
                <h3 className="font-semibold text-clouddrove-dark mb-1">FAQ</h3>
                <p className="text-sm text-clouddrove-light">Common questions about how Vanisec works</p>
              </Link>
              <Link href="/docs" className="block p-4 rounded-xl border border-clouddrove-light/30 hover:border-clouddrove-dark/50 transition-colors">
                <h3 className="font-semibold text-clouddrove-dark mb-1">Documentation</h3>
                <p className="text-sm text-clouddrove-light">Guides on creating and sharing secrets</p>
              </Link>
              <Link href="/privacy" className="block p-4 rounded-xl border border-clouddrove-light/30 hover:border-clouddrove-dark/50 transition-colors">
                <h3 className="font-semibold text-clouddrove-dark mb-1">Privacy Policy</h3>
                <p className="text-sm text-clouddrove-light">How we handle your data</p>
              </Link>
            </div>
          </section>

          <section className="text-center">
            <Link
              href="/"
              className="inline-block bg-gradient-to-r from-clouddrove-dark to-clouddrove-light text-white py-4 px-8 rounded-xl font-semibold hover:from-clouddrove-light hover:to-clouddrove-dark transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Share a Secret Securely
            </Link>
          </section>
        </div>
      </div>
    </div>
  )
}
