import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Security & Compliance',
  description: 'Understand Vanisec protection mechanisms, data encryption, and regulatory alignment with SOC2, GDPR, CCPA, and HIPAA standards.',
}

export default function SecurityPage() {
  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-clouddrove-dark mb-4">Security & Compliance</h1>
          <p className="text-xl text-clouddrove-light max-w-2xl mx-auto">
            Your confidential data gets encrypted, excluded from activity logs, and removed automatically after access
          </p>
        </div>

        <div className="space-y-12">
          <section className="bg-white rounded-2xl p-8 border-2 border-clouddrove-light/30">
            <h2 className="text-3xl font-bold text-clouddrove-dark mb-6">Security Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-semibold text-clouddrove-dark mb-3">Encryption</h3>
                <p className="text-clouddrove-light">
                  All confidential entries undergo encryption prior to storage utilizing enterprise-grade cryptographic methods. Your sensitive content remains protected both at rest and during transmission.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-clouddrove-dark mb-3">One-Time Access</h3>
                <p className="text-clouddrove-light">
                  Every confidential entry permits only a single viewing session. Following access, it gets instantly and irreversibly eliminated from our infrastructure.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-clouddrove-dark mb-3">Password Protection</h3>
                <p className="text-clouddrove-light">
                  Include an optional passphrase for supplementary protection. Access remains restricted to those who possess the correct passphrase.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-clouddrove-dark mb-3">Automatic Expiration</h3>
                <p className="text-clouddrove-light">
                  Confidential entries automatically become invalid according to your selected duration (60 minutes through 7 days). Expired entries get permanently removed.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-gradient-to-br from-clouddrove-light/10 to-clouddrove-dark/10 rounded-2xl p-8 border-2 border-clouddrove-light/30">
            <h2 className="text-3xl font-bold text-clouddrove-dark mb-6">Compliance Information</h2>
            <p className="text-clouddrove-light mb-6">
              Vanisec is architected to facilitate meeting protection and regulatory standards for secure data management:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 border border-clouddrove-light/30">
                <h3 className="text-lg font-semibold text-clouddrove-dark mb-2">SOC 2</h3>
                <p className="text-clouddrove-light text-sm">
                  Facilitates meeting SOC 2 protection requirements for access management and data safeguarding.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-clouddrove-light/30">
                <h3 className="text-lg font-semibold text-clouddrove-dark mb-2">ISO 27001</h3>
                <p className="text-clouddrove-light text-sm">
                  Compatible with ISO 27001 protection standards for information security governance.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-clouddrove-light/30">
                <h3 className="text-lg font-semibold text-clouddrove-dark mb-2">GDPR</h3>
                <p className="text-clouddrove-light text-sm">
                  Aligns with GDPR mandates for data privacy and deletion rights.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-clouddrove-light/30">
                <h3 className="text-lg font-semibold text-clouddrove-dark mb-2">CCPA & HIPAA</h3>
                <p className="text-clouddrove-light text-sm">
                  Structured to support CCPA and HIPAA compliance for secure data management.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl p-8 border-2 border-clouddrove-light/30">
            <h2 className="text-3xl font-bold text-clouddrove-dark mb-6">Privacy & Data Handling</h2>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-clouddrove-dark mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-lg font-semibold text-clouddrove-dark mb-1">No Logging</h3>
                  <p className="text-clouddrove-light">We never retain your confidential entries in activity logs, analytical systems, or persistent storage beyond the ephemeral Redis cache.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-clouddrove-dark mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-lg font-semibold text-clouddrove-dark mb-1">No Tracking</h3>
                  <p className="text-clouddrove-light">We don't monitor your usage patterns, gather personal details, or employ tracking cookies.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-clouddrove-dark mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-lg font-semibold text-clouddrove-dark mb-1">Permanent Deletion</h3>
                  <p className="text-clouddrove-light">Once a confidential entry gets accessed or expires, it becomes permanently removed and unrecoverable.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-clouddrove-dark mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-lg font-semibold text-clouddrove-dark mb-1">Open Source</h3>
                  <p className="text-clouddrove-light">Vanisec operates as open-source software, allowing you to inspect the codebase and validate our protection methodologies.</p>
                </div>
              </li>
            </ul>
          </section>

          <section className="text-center">
            <Link
              href="/"
              className="inline-block bg-gradient-to-r from-clouddrove-dark to-clouddrove-light text-white py-4 px-8 rounded-xl font-semibold hover:from-clouddrove-light hover:to-clouddrove-dark transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Secure Your Credentials
            </Link>
          </section>
        </div>
      </div>
    </div>
  )
}
