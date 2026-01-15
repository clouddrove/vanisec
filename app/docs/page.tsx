import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Documentation',
  description: 'Comprehensive guides for Vanisec - understand how to utilize the protected single-use confidential sharing platform.',
}

export default function DocsPage() {
  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-clouddrove-dark mb-4">Documentation</h1>
          <p className="text-xl text-clouddrove-light max-w-2xl mx-auto">
            Master Vanisec to exchange confidential data safely
          </p>
        </div>

        <div className="space-y-12">
          <section>
            <h2 className="text-3xl font-bold text-clouddrove-dark mb-4">Getting Started</h2>
            <div className="bg-white rounded-2xl p-8 border-2 border-clouddrove-light/30">
              <h3 className="text-xl font-semibold text-clouddrove-dark mb-3">How to Create a Secret</h3>
              <ol className="list-decimal list-inside space-y-3 text-clouddrove-light">
                <li>Type your sensitive content into the input field</li>
                <li>Optionally include a passphrase for additional protection</li>
                <li>Select a time-to-live period (60 minutes through 7 days)</li>
                <li>Click the "Create Secret Link" button</li>
                <li>Distribute the resulting URL to your intended recipient</li>
              </ol>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-clouddrove-dark mb-4">Features</h2>
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 border-2 border-clouddrove-light/30">
                <h3 className="text-xl font-semibold text-clouddrove-dark mb-2">Password Protection</h3>
                <p className="text-clouddrove-light">
                  Include an optional passphrase during creation. Recipients must provide this passphrase to access the confidential content, adding supplementary protection.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 border-2 border-clouddrove-light/30">
                <h3 className="text-xl font-semibold text-clouddrove-dark mb-2">Expiration Times</h3>
                <p className="text-clouddrove-light">
                  Select from 60 minutes, 6 hours, 24 hours, 72 hours, or 7 days. Confidential entries get automatically removed upon expiration, regardless of access status.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 border-2 border-clouddrove-light/30">
                <h3 className="text-xl font-semibold text-clouddrove-dark mb-2">One-Time View</h3>
                <p className="text-clouddrove-light">
                  Every confidential entry allows only a single access session. After viewing, it becomes permanently removed and inaccessible, even using the original URL.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-clouddrove-dark mb-4">Best Practices</h2>
            <div className="bg-gradient-to-br from-clouddrove-light/10 to-clouddrove-dark/10 rounded-2xl p-8 border-2 border-clouddrove-light/30">
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-clouddrove-dark mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-clouddrove-light">Apply passphrase protection for extremely sensitive data</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-clouddrove-dark mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-clouddrove-light">Distribute URLs through protected channels (encrypted messaging services, secure email platforms)</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-clouddrove-dark mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-clouddrove-light">Configure suitable expiration periods based on data sensitivity levels</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-clouddrove-dark mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-clouddrove-light">Always transmit the passphrase and URL through separate communication channels</p>
                  </div>
                </li>
              </ul>
            </div>
          </section>

          <section className="text-center">
            <Link
              href="/api"
              className="inline-block bg-gradient-to-r from-clouddrove-dark to-clouddrove-light text-white py-4 px-8 rounded-xl font-semibold hover:from-clouddrove-light hover:to-clouddrove-dark transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              View API Documentation
            </Link>
          </section>
        </div>
      </div>
    </div>
  )
}
