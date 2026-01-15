import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for Vanisec - protected single-use confidential sharing solution.',
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
              By utilizing Vanisec, you acknowledge and consent to be governed by the terms and conditions outlined in this agreement. Should you disagree with any provisions, please refrain from using this platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-clouddrove-dark mb-4">2. Use License</h2>
            <p className="text-clouddrove-light leading-relaxed mb-4">
              You are permitted to utilize Vanisec temporarily for both personal and business applications. This constitutes a license grant, not a title transfer, and under this license you must not:
            </p>
            <ul className="list-disc list-inside space-y-2 text-clouddrove-light">
              <li>Utilize the platform for unlawful activities or in contravention of applicable regulations</li>
              <li>Seek to obtain unauthorized entry to the platform or associated infrastructure</li>
              <li>Interfere with or compromise the platform or server infrastructure</li>
              <li>Employ the platform to distribute malicious software or damaging materials</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-clouddrove-dark mb-4">3. Service Availability</h2>
            <p className="text-clouddrove-light leading-relaxed">
              Vanisec is delivered "as is" without warranties of any kind. We cannot ensure continuous availability, uninterrupted operation, or error-free performance. We retain the authority to alter, suspend, or terminate the platform at any moment without prior notification.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-clouddrove-dark mb-4">4. Privacy and Data</h2>
            <p className="text-clouddrove-light leading-relaxed">
              Your utilization of Vanisec is additionally subject to our Privacy Policy. Confidential entries remain temporarily stored and get automatically removed after access or expiration. We do not retain confidential entries in activity logs or analytical systems.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-clouddrove-dark mb-4">5. Limitation of Liability</h2>
            <p className="text-clouddrove-light leading-relaxed">
              Under no circumstances shall Vanisec or its service providers bear responsibility for any losses resulting from platform usage or inability to use the platform, encompassing but not limited to information loss, security incidents, or service disruptions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-clouddrove-dark mb-4">6. Changes to Terms</h2>
            <p className="text-clouddrove-light leading-relaxed">
              We maintain the right to revise these terms whenever necessary. Continued platform usage following modifications indicates acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-clouddrove-dark mb-4">7. Contact Information</h2>
            <p className="text-clouddrove-light leading-relaxed">
              For inquiries regarding these Terms of Service, please reach out through our <a href="/contact" className="text-clouddrove-dark hover:text-clouddrove-light underline">contact page</a> or GitHub repository.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
