import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Vanisec is a free, open-source one-time secret sharing tool built by CloudDrove. Share sensitive data securely — no accounts, no logs, no traces.',
  alternates: { canonical: '/about' },
}

export default function AboutPage() {
  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-clouddrove-dark mb-4">About Vanisec</h1>
          <p className="text-lg md:text-xl text-clouddrove-light max-w-2xl mx-auto">
            Secure secret sharing — free, open-source, and built for everyone
          </p>
        </div>

        <div className="space-y-12">
          <section className="prose prose-lg max-w-none">
            <h2 className="text-2xl md:text-3xl font-bold text-clouddrove-dark mb-4">Our Mission</h2>
            <p className="text-clouddrove-light leading-relaxed mb-4">
              Vanisec was built on a simple belief: secure communication should be accessible to everyone, regardless of technical background or budget. Sharing sensitive information shouldn&apos;t require enterprise tools, complex setup, or expensive subscriptions.
            </p>
            <p className="text-clouddrove-light leading-relaxed">
              Every day, people share passwords, API keys, tokens, and private data over email and chat — channels that create permanent, insecure records. Vanisec solves this by generating encrypted, one-time links that self-destruct after being opened. No history. No exposure. No risk of something sensitive being found months later in a chat log.
            </p>
          </section>

          <section className="prose prose-lg max-w-none">
            <h2 className="text-2xl md:text-3xl font-bold text-clouddrove-dark mb-4">What We Offer</h2>
            <ul className="list-none space-y-4">
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-clouddrove-dark mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-xl font-semibold text-clouddrove-dark mb-1">Completely Free</h3>
                  <p className="text-clouddrove-light">No account. No credit card. No hidden limits. Vanisec is free to use for individuals and teams alike.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-clouddrove-dark mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-xl font-semibold text-clouddrove-dark mb-1">Privacy First</h3>
                  <p className="text-clouddrove-light">We never log your secrets. Once a secret is deleted — whether opened or expired — it&apos;s gone for good and cannot be recovered.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-clouddrove-dark mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-xl font-semibold text-clouddrove-dark mb-1">Open Source</h3>
                  <p className="text-clouddrove-light">Vanisec is fully open source. Inspect the code, contribute improvements, or self-host your own instance. Trust is built on transparency.</p>
                </div>
              </li>
            </ul>
          </section>

          <section className="bg-gradient-to-br from-clouddrove-light/5 to-clouddrove-dark/5 rounded-2xl p-8 border-2 border-clouddrove-light/30">
            <h2 className="text-2xl md:text-3xl font-bold text-clouddrove-dark mb-6">Why Open Source?</h2>
            <p className="text-clouddrove-light leading-relaxed mb-4">
              Security tools should be transparent. When your data is at stake, you shouldn&apos;t have to trust a black box. Vanisec is fully open source so anyone can audit the code, verify the implementation, and confirm that secrets are handled exactly as we describe.
            </p>
            <p className="text-clouddrove-light leading-relaxed mb-4">
              Open source also means you can self-host Vanisec on your own infrastructure. If your organization requires full control over where data is stored and processed, deploy your own instance using our Docker and Kubernetes configurations — no vendor lock-in, no external dependencies.
            </p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="bg-white rounded-xl p-4 border border-clouddrove-light/30">
                <p className="text-2xl font-bold text-clouddrove-dark">MIT</p>
                <p className="text-sm text-clouddrove-light">Licensed</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-clouddrove-light/30">
                <p className="text-2xl font-bold text-clouddrove-dark">100%</p>
                <p className="text-sm text-clouddrove-light">Free to use</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-clouddrove-light/30">
                <p className="text-2xl font-bold text-clouddrove-dark">Self-Host</p>
                <p className="text-sm text-clouddrove-light">Ready</p>
              </div>
            </div>
          </section>

          <section className="prose prose-lg max-w-none">
            <h2 className="text-2xl md:text-3xl font-bold text-clouddrove-dark mb-4">Built by CloudDrove</h2>
            <p className="text-clouddrove-light leading-relaxed mb-4">
              Vanisec is built and maintained by <strong className="text-clouddrove-dark">CloudDrove</strong>, a team dedicated to creating open-source tools that make the internet safer and more secure. We believe in transparency, privacy, and giving back to the developer community.
            </p>
            <p className="text-clouddrove-light leading-relaxed">
              CloudDrove specializes in cloud infrastructure, DevOps tooling, and security-first solutions. Vanisec was born from a real problem we saw across engineering teams: sensitive credentials being shared through insecure channels like email, Slack DMs, and sticky notes. We built what we wished existed — a simple, secure, and ephemeral way to share secrets.
            </p>
          </section>

          <section className="bg-white rounded-2xl p-8 border-2 border-clouddrove-light/30">
            <h2 className="text-2xl md:text-3xl font-bold text-clouddrove-dark mb-4">Learn More</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/security" className="block p-4 rounded-xl border border-clouddrove-light/30 hover:border-clouddrove-dark/50 transition-colors">
                <h3 className="font-semibold text-clouddrove-dark mb-1">Security</h3>
                <p className="text-sm text-clouddrove-light">How we protect your data</p>
              </Link>
              <Link href="/docs" className="block p-4 rounded-xl border border-clouddrove-light/30 hover:border-clouddrove-dark/50 transition-colors">
                <h3 className="font-semibold text-clouddrove-dark mb-1">Documentation</h3>
                <p className="text-sm text-clouddrove-light">Guides and best practices</p>
              </Link>
              <Link href="/faq" className="block p-4 rounded-xl border border-clouddrove-light/30 hover:border-clouddrove-dark/50 transition-colors">
                <h3 className="font-semibold text-clouddrove-dark mb-1">FAQ</h3>
                <p className="text-sm text-clouddrove-light">Answers to common questions</p>
              </Link>
            </div>
          </section>

          <section className="bg-gradient-to-br from-clouddrove-light/10 to-clouddrove-dark/10 rounded-2xl p-8 border-2 border-clouddrove-light/30">
            <h2 className="text-2xl md:text-3xl font-bold text-clouddrove-dark mb-4">Ready to Get Started?</h2>
            <p className="text-clouddrove-light mb-6">
              No sign-up required. Create your first secure, self-destructing link in seconds.
            </p>
            <Link
              href="/"
              className="inline-block bg-gradient-to-r from-clouddrove-dark to-clouddrove-light text-white py-4 px-8 rounded-xl font-semibold hover:from-clouddrove-light hover:to-clouddrove-dark transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Create Your First Secret
            </Link>
          </section>
        </div>
      </div>
    </div>
  )
}
