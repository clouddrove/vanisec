import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for Tessera - understand how we manage your data and safeguard your privacy.',
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
            <h2 className="text-2xl font-bold text-clouddrove-dark mb-4">1. Information We Collect</h2>
            <p className="text-clouddrove-light leading-relaxed mb-4">
              Tessera is architected with privacy as a fundamental principle. We gather minimal data:
            </p>
            <ul className="list-disc list-inside space-y-2 text-clouddrove-light">
              <li><strong>Confidential Entries:</strong> Held temporarily in Redis until accessed or expired, then permanently eliminated</li>
              <li><strong>No Personal Data:</strong> Registration is unnecessary, so we don't gather names, email addresses, or other identifying information</li>
              <li><strong>No Tracking:</strong> We don't employ tracking cookies or gather analytical data on your usage patterns</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-clouddrove-dark mb-4">2. How We Use Information</h2>
            <p className="text-clouddrove-light leading-relaxed">
              Confidential entries remain temporarily in Redis to facilitate the single-access functionality. They get automatically eliminated after access or expiration. We never retain confidential entries in activity logs, analytical systems, or persistent storage.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-clouddrove-dark mb-4">3. Data Security</h2>
            <p className="text-clouddrove-light leading-relaxed mb-4">
              We deploy protection mechanisms to safeguard your data:
            </p>
            <ul className="list-disc list-inside space-y-2 text-clouddrove-light">
              <li>All confidential entries undergo encryption prior to storage</li>
              <li>Confidential entries permit only a single access session</li>
              <li>Automatic expiration guarantees removal even without access</li>
              <li>No recording of confidential entries or sensitive data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-clouddrove-dark mb-4">4. Data Retention</h2>
            <p className="text-clouddrove-light leading-relaxed">
              Confidential entries remain stored only until accessed or expired (maximum 7 days). After elimination, they become unrecoverable. We do not maintain backup copies of confidential entries.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-clouddrove-dark mb-4">5. Third-Party Services</h2>
            <p className="text-clouddrove-light leading-relaxed">
              Tessera utilizes Redis for temporary storage. We do not disclose your confidential entries to external services. If Google Analytics is enabled (via NEXT_PUBLIC_GA_ID), standard analytical data may be gathered by Google.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-clouddrove-dark mb-4">6. Your Rights</h2>
            <p className="text-clouddrove-light leading-relaxed mb-4">
              Since we don't gather personal information and confidential entries get automatically removed, you maintain complete control:
            </p>
            <ul className="list-disc list-inside space-y-2 text-clouddrove-light">
              <li>No account requirement means no personal data retention</li>
              <li>Confidential entries get automatically eliminated after access or expiration</li>
              <li>You may discontinue platform usage at any moment</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-clouddrove-dark mb-4">7. Changes to Privacy Policy</h2>
            <p className="text-clouddrove-light leading-relaxed">
              We may periodically revise this Privacy Policy. We will communicate any modifications by publishing the updated Privacy Policy on this page and revising the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-clouddrove-dark mb-4">8. Contact Us</h2>
            <p className="text-clouddrove-light leading-relaxed">
              For questions regarding this Privacy Policy, please contact us through our <a href="/contact" className="text-clouddrove-dark hover:text-clouddrove-light underline">contact page</a> or GitHub repository.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
