import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for Vanisec — how we handle your data, what we collect, and how secrets are stored and deleted.',
  alternates: { canonical: '/privacy' },
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-clouddrove-dark mb-4">Privacy Policy</h1>
          <p className="text-clouddrove-light">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <div className="prose prose-lg max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-clouddrove-dark mb-4">1. What We Collect</h2>
            <p className="text-clouddrove-light leading-relaxed mb-4">
              Vanisec is built with minimal data collection in mind. Here&apos;s what we do and don&apos;t collect:
            </p>
            <ul className="list-disc list-inside space-y-2 text-clouddrove-light">
              <li><strong className="text-clouddrove-dark">Secrets:</strong> Stored temporarily in Redis until viewed or expired, then permanently deleted</li>
              <li><strong className="text-clouddrove-dark">No personal data:</strong> No accounts required, so we collect no names, emails, or identifying information</li>
              <li><strong className="text-clouddrove-dark">No tracking cookies:</strong> We don&apos;t use tracking cookies or collect behavioral analytics</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-clouddrove-dark mb-4">2. How We Use Your Data</h2>
            <p className="text-clouddrove-light leading-relaxed">
              Secrets are stored in Redis only long enough to serve them once to the recipient. They are deleted immediately after being viewed or when the TTL expires. We never write secret content to application logs, databases, or any form of persistent storage.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-clouddrove-dark mb-4">3. Security Measures</h2>
            <p className="text-clouddrove-light leading-relaxed mb-4">
              We take the following measures to protect your data:
            </p>
            <ul className="list-disc list-inside space-y-2 text-clouddrove-light">
              <li>Secrets are encrypted before being stored</li>
              <li>Each secret can only be viewed once before being deleted</li>
              <li>Automatic expiration ensures secrets don&apos;t persist indefinitely</li>
              <li>No sensitive content is written to logs or monitoring systems</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-clouddrove-dark mb-4">4. Data Retention</h2>
            <p className="text-clouddrove-light leading-relaxed">
              Secrets are stored for a maximum of 7 days, or until they are viewed — whichever comes first. Once deleted, they are permanently unrecoverable. We do not keep backups of secret content.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-clouddrove-dark mb-4">5. Third-Party Services</h2>
            <p className="text-clouddrove-light leading-relaxed">
              Vanisec uses Redis for temporary secret storage. Secret content is not shared with any third parties. If Google Analytics is configured via the <code className="text-clouddrove-dark bg-clouddrove-light/10 px-1 rounded">NEXT_PUBLIC_GA_ID</code> environment variable, standard anonymous usage data (page views, referrers) may be collected by Google Analytics.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-clouddrove-dark mb-4">6. Your Rights</h2>
            <p className="text-clouddrove-light leading-relaxed mb-4">
              Because we collect no personal data and secrets self-destruct, there&apos;s very little to manage:
            </p>
            <ul className="list-disc list-inside space-y-2 text-clouddrove-light">
              <li>No account means no personal profile to request or delete</li>
              <li>Secrets are automatically deleted after use or expiration</li>
              <li>You can stop using the service at any time — no data lingers</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-clouddrove-dark mb-4">7. Changes to This Policy</h2>
            <p className="text-clouddrove-light leading-relaxed">
              We may update this Privacy Policy from time to time. Changes will be posted here with an updated date. Continued use of Vanisec after changes are posted constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-clouddrove-dark mb-4">8. Contact</h2>
            <p className="text-clouddrove-light leading-relaxed">
              Questions about this Privacy Policy? Contact us via our <a href="/contact" className="text-clouddrove-dark hover:text-clouddrove-light underline">contact page</a> or open an issue on GitHub.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
