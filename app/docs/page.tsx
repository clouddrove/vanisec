import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Documentation',
  description: 'Learn how to use Vanisec to share sensitive information securely. Guides on creating secrets, password protection, expiration times, and best practices.',
  alternates: { canonical: '/docs' },
}

export default function DocsPage() {
  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-clouddrove-dark mb-4">Documentation</h1>
          <p className="text-lg md:text-xl text-clouddrove-light max-w-2xl mx-auto">
            Everything you need to start sharing secrets securely
          </p>
        </div>

        <div className="space-y-12">
          <section>
            <h2 className="text-2xl md:text-3xl font-bold text-clouddrove-dark mb-4">Getting Started</h2>
            <div className="bg-white rounded-2xl p-8 border-2 border-clouddrove-light/30">
              <h3 className="text-xl font-semibold text-clouddrove-dark mb-3">How to Create a Secret</h3>
              <ol className="list-decimal list-inside space-y-3 text-clouddrove-light">
                <li>Paste your sensitive information into the text field on the home page</li>
                <li>Choose a password. This is required, and it never leaves your browser</li>
                <li>Choose an expiration time (1 hour to 7 days)</li>
                <li>Click <strong className="text-clouddrove-dark">Create Secret Link</strong></li>
                <li>Copy the generated link and share it with the recipient</li>
              </ol>

              <h3 className="text-xl font-semibold text-clouddrove-dark mb-3 mt-8">
                How to Use the Clipboard
              </h3>
              <p className="text-clouddrove-light mb-3">
                For moving text or a file between your own devices, a one-time link is more
                ceremony than the job needs. The{' '}
                <Link href="/clipboard" className="text-clouddrove-dark underline underline-offset-4">
                  clipboard
                </Link>{' '}
                skips the password entirely.
              </p>
              <ol className="list-decimal list-inside space-y-3 text-clouddrove-light">
                <li>Paste your text, or attach a file, at <strong className="text-clouddrove-dark">/clipboard</strong></li>
                <li>Choose an expiration time and click <strong className="text-clouddrove-dark">Save</strong></li>
                <li>You get a ten character code such as <code className="font-mono text-sm">4F2K9-QX1B7</code></li>
                <li>On the other device, open the same page, type the code and click <strong className="text-clouddrove-dark">Show</strong></li>
              </ol>
              <p className="text-clouddrove-light mt-3 text-sm">
                It opens once, then it is gone. The code is generated in your browser and
                never sent to us, because it is what derives the encryption key: see the
                Clipboard feature below.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl md:text-3xl font-bold text-clouddrove-dark mb-4">Features</h2>
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 border-2 border-clouddrove-light/30">
                <h3 className="text-xl font-semibold text-clouddrove-dark mb-2">Password Protection</h3>
                <p className="text-clouddrove-light">
                  Every secret has a password, and it is required rather than optional. It never
                  reaches our servers: your browser uses it to derive the encryption key, and
                  separately to derive a one-way value that gates retrieval. Send it to the
                  recipient through a different channel than the link, since either one alone is
                  useless and the pair together is the secret.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 border-2 border-clouddrove-light/30">
                <h3 className="text-xl font-semibold text-clouddrove-dark mb-2">Expiration Times</h3>
                <p className="text-clouddrove-light">
                  Choose from 1 hour, 6 hours, 24 hours, 72 hours, or 7 days. The secret is automatically and permanently deleted when the timer runs out, whether or not it was ever opened. Pick the shortest expiry that fits your use case.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 border-2 border-clouddrove-light/30">
                <h3 className="text-xl font-semibold text-clouddrove-dark mb-2">One-Time View</h3>
                <p className="text-clouddrove-light">
                  Secrets can only be viewed once. The first person to open the link sees the secret — then it&apos;s gone. If someone else opens the link afterwards, they&apos;ll see that the secret no longer exists. This tells the sender if the link may have been intercepted.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 border-2 border-clouddrove-light/30">
                <h3 className="text-xl font-semibold text-clouddrove-dark mb-2">Clipboard</h3>
                <p className="text-clouddrove-light">
                  A short code instead of a link, and no password, for moving text or a file
                  between devices. Nothing is weakened to get there: the ten character code is
                  itself the key. Your browser runs one PBKDF2 pass over it to produce both the
                  id we store under and the AES key, and the code never leaves the page, so we
                  hold a blob we cannot open. The tradeoff is that the code alone grants access,
                  so treat it like a password and let it expire.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl md:text-3xl font-bold text-clouddrove-dark mb-4">Best Practices</h2>
            <div className="bg-gradient-to-br from-clouddrove-light/10 to-clouddrove-dark/10 rounded-2xl p-8 border-2 border-clouddrove-light/30">
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-clouddrove-dark mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-clouddrove-light"><strong className="text-clouddrove-dark">Use a passphrase</strong> for highly sensitive information like production credentials or private keys</p>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-clouddrove-dark mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-clouddrove-light"><strong className="text-clouddrove-dark">Send the passphrase separately</strong> from the link — use a different channel (e.g., Signal vs. email)</p>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-clouddrove-dark mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-clouddrove-light"><strong className="text-clouddrove-dark">Set short expiry times</strong> — use 1 hour for passwords that need to be rotated immediately, 24 hours for general handoffs</p>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-clouddrove-dark mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-clouddrove-light"><strong className="text-clouddrove-dark">Rotate credentials after sharing</strong> — treat secrets shared through any channel as potentially seen</p>
                </li>
              </ul>
            </div>
          </section>

          <section className="bg-white rounded-2xl p-8 border-2 border-clouddrove-light/30">
            <h2 className="text-2xl md:text-3xl font-bold text-clouddrove-dark mb-4">Related Resources</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/security" className="block p-4 rounded-xl border border-clouddrove-light/30 hover:border-clouddrove-dark/50 transition-colors">
                <h3 className="font-semibold text-clouddrove-dark mb-1">Security</h3>
                <p className="text-sm text-clouddrove-light">Encryption and compliance details</p>
              </Link>
              <Link href="/faq" className="block p-4 rounded-xl border border-clouddrove-light/30 hover:border-clouddrove-dark/50 transition-colors">
                <h3 className="font-semibold text-clouddrove-dark mb-1">FAQ</h3>
                <p className="text-sm text-clouddrove-light">Answers to common questions</p>
              </Link>
              <Link href="/api" className="block p-4 rounded-xl border border-clouddrove-light/30 hover:border-clouddrove-dark/50 transition-colors">
                <h3 className="font-semibold text-clouddrove-dark mb-1">API Reference</h3>
                <p className="text-sm text-clouddrove-light">Integrate Vanisec into your apps</p>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
