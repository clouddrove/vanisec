import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for Vanisec — the free, open-source one-time secret sharing tool by CloudDrove.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-clouddrove-dark mb-4">Terms of Service</h1>
          <p className="text-clouddrove-light">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <div className="prose prose-lg max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-clouddrove-dark mb-4">1. Acceptance of Terms</h2>
            <p className="text-clouddrove-light leading-relaxed">
              By using Vanisec, you agree to these terms. If you don't agree, please don't use the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-clouddrove-dark mb-4">2. Acceptable Use</h2>
            <p className="text-clouddrove-light leading-relaxed mb-4">
              Vanisec is free to use for personal and commercial purposes. You may not:
            </p>
            <ul className="list-disc list-inside space-y-2 text-clouddrove-light">
              <li>Use Vanisec for illegal activities or to violate applicable laws</li>
              <li>Attempt to gain unauthorized access to Vanisec's systems or infrastructure</li>
              <li>Interfere with or disrupt service availability for other users</li>
              <li>Use Vanisec to distribute malware, spam, or other harmful content</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-clouddrove-dark mb-4">3. Service Availability</h2>
            <p className="text-clouddrove-light leading-relaxed">
              Vanisec is provided "as is" without any warranties. We don't guarantee uptime, error-free operation, or continuous availability. We reserve the right to modify, suspend, or shut down the service at any time without notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-clouddrove-dark mb-4">4. Privacy and Data</h2>
            <p className="text-clouddrove-light leading-relaxed">
              Your use of Vanisec is also governed by our <a href="/privacy" className="text-clouddrove-dark hover:text-clouddrove-light underline">Privacy Policy</a>. Secrets are stored temporarily in Redis and automatically deleted after being viewed or when they expire. We do not log or store secret content beyond what is needed to serve the request.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-clouddrove-dark mb-4">5. Limitation of Liability</h2>
            <p className="text-clouddrove-light leading-relaxed">
              To the maximum extent permitted by law, Vanisec and CloudDrove are not liable for any damages arising from your use of the service, including but not limited to data loss, security breaches, or service interruptions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-clouddrove-dark mb-4">6. Changes to Terms</h2>
            <p className="text-clouddrove-light leading-relaxed">
              We may update these terms from time to time. Continued use of Vanisec after changes are posted constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-clouddrove-dark mb-4">7. Contact</h2>
            <p className="text-clouddrove-light leading-relaxed">
              Questions about these Terms? Reach out via our <a href="/contact" className="text-clouddrove-dark hover:text-clouddrove-light underline">contact page</a> or open an issue on GitHub.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
