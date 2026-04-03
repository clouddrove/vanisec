import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Vanisec vs OneTimeSecret — Feature Comparison',
  description: 'Comparing Vanisec and OneTimeSecret (OTS) for secure secret sharing. See differences in pricing, open-source availability, self-hosting, and features.',
  alternates: { canonical: '/compare/onetimesecret' },
}

export default function VsOneTimeSecretPage() {
  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-clouddrove-light uppercase tracking-wider mb-2">Comparison</p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-clouddrove-dark mb-4">
            Vanisec vs OneTimeSecret
          </h1>
          <p className="text-lg md:text-xl text-clouddrove-light max-w-2xl mx-auto">
            Both tools let you share secrets through single-use links. Here is where they differ.
          </p>
        </div>

        <div className="space-y-12">
          {/* Comparison Table */}
          <section className="bg-white rounded-2xl border-2 border-clouddrove-light/30 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b-2 border-clouddrove-light/30">
                    <th className="px-6 py-4 text-clouddrove-light font-semibold text-sm">Feature</th>
                    <th className="px-6 py-4 text-clouddrove-dark font-bold text-sm">Vanisec</th>
                    <th className="px-6 py-4 text-clouddrove-light font-semibold text-sm">OneTimeSecret</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-clouddrove-light/20">
                  <tr>
                    <td className="px-6 py-4 text-clouddrove-dark font-medium">Pricing</td>
                    <td className="px-6 py-4 text-clouddrove-dark font-semibold">100% free, all features</td>
                    <td className="px-6 py-4 text-clouddrove-light">Free tier + paid plans</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-clouddrove-dark font-medium">Open Source</td>
                    <td className="px-6 py-4 text-clouddrove-dark font-semibold">Yes — MIT license</td>
                    <td className="px-6 py-4 text-clouddrove-light">Partial — some features proprietary</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-clouddrove-dark font-medium">Self-Hosting</td>
                    <td className="px-6 py-4 text-clouddrove-dark font-semibold">Docker + Helm charts included</td>
                    <td className="px-6 py-4 text-clouddrove-light">Available but limited docs</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-clouddrove-dark font-medium">Account Required</td>
                    <td className="px-6 py-4 text-clouddrove-dark font-semibold">Never</td>
                    <td className="px-6 py-4 text-clouddrove-light">Optional (required for some features)</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-clouddrove-dark font-medium">Password Protection</td>
                    <td className="px-6 py-4 text-clouddrove-dark font-semibold">Yes — included free</td>
                    <td className="px-6 py-4 text-clouddrove-light">Yes</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-clouddrove-dark font-medium">Expiration Options</td>
                    <td className="px-6 py-4 text-clouddrove-dark font-semibold">1h, 6h, 24h, 72h, 7 days</td>
                    <td className="px-6 py-4 text-clouddrove-light">Up to 14 days (varies by plan)</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-clouddrove-dark font-medium">File Upload</td>
                    <td className="px-6 py-4 text-clouddrove-dark font-semibold">Yes — up to 5MB</td>
                    <td className="px-6 py-4 text-clouddrove-light">No</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-clouddrove-dark font-medium">Custom Branding</td>
                    <td className="px-6 py-4 text-clouddrove-light">Self-host and customize</td>
                    <td className="px-6 py-4 text-clouddrove-light">Paid plans only</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-clouddrove-dark font-medium">Regional Data Storage</td>
                    <td className="px-6 py-4 text-clouddrove-light">Via self-hosting</td>
                    <td className="px-6 py-4 text-clouddrove-light">EU/US options on paid plans</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-clouddrove-dark font-medium">API Access</td>
                    <td className="px-6 py-4 text-clouddrove-dark font-semibold">Yes — free, no key required</td>
                    <td className="px-6 py-4 text-clouddrove-light">Yes — requires account</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Key Differences */}
          <section>
            <h2 className="text-2xl md:text-3xl font-bold text-clouddrove-dark mb-6">Key Differences</h2>
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-8 border-2 border-clouddrove-light/30">
                <h3 className="text-xl font-semibold text-clouddrove-dark mb-3">Pricing Model</h3>
                <p className="text-clouddrove-light leading-relaxed">
                  OneTimeSecret operates on a freemium model — basic sharing is free, but features like custom branding, SSO, and regional data storage require a paid subscription. Vanisec takes a different approach: every feature is free for everyone, with no usage limits or paywalls. If you need custom branding, you self-host the open-source code and modify it directly.
                </p>
              </div>
              <div className="bg-white rounded-2xl p-8 border-2 border-clouddrove-light/30">
                <h3 className="text-xl font-semibold text-clouddrove-dark mb-3">Open Source Philosophy</h3>
                <p className="text-clouddrove-light leading-relaxed">
                  Both tools have open-source roots, but Vanisec is fully MIT-licensed with no proprietary components. The entire codebase — including infrastructure configurations (Docker, Helm) — is available on GitHub. This makes it straightforward to audit, fork, or deploy on your own infrastructure without depending on a third-party service.
                </p>
              </div>
              <div className="bg-white rounded-2xl p-8 border-2 border-clouddrove-light/30">
                <h3 className="text-xl font-semibold text-clouddrove-dark mb-3">Simplicity vs. Feature Breadth</h3>
                <p className="text-clouddrove-light leading-relaxed">
                  OneTimeSecret has evolved into a broader platform with team features, SSO integration, and incoming secret workflows. Vanisec stays deliberately simple: paste a secret, get a link, share it. No accounts, no dashboards, no team management overhead. This makes Vanisec faster for ad-hoc sharing, while OneTimeSecret may suit organizations that want a managed secret-sharing platform.
                </p>
              </div>
            </div>
          </section>

          {/* When to Choose */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-clouddrove-light/10 to-clouddrove-dark/10 rounded-2xl p-8 border-2 border-clouddrove-light/30">
              <h2 className="text-xl font-bold text-clouddrove-dark mb-4">Choose Vanisec if you want</h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-clouddrove-light">
                  <span className="text-clouddrove-dark font-bold mt-0.5">+</span>
                  <span>Everything free with no account walls</span>
                </li>
                <li className="flex items-start gap-2 text-clouddrove-light">
                  <span className="text-clouddrove-dark font-bold mt-0.5">+</span>
                  <span>Full self-hosting with Docker and Kubernetes</span>
                </li>
                <li className="flex items-start gap-2 text-clouddrove-light">
                  <span className="text-clouddrove-dark font-bold mt-0.5">+</span>
                  <span>A lightweight tool with zero onboarding</span>
                </li>
                <li className="flex items-start gap-2 text-clouddrove-light">
                  <span className="text-clouddrove-dark font-bold mt-0.5">+</span>
                  <span>MIT-licensed code you can fully audit</span>
                </li>
                <li className="flex items-start gap-2 text-clouddrove-light">
                  <span className="text-clouddrove-dark font-bold mt-0.5">+</span>
                  <span>File upload support for sharing documents securely</span>
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-2xl p-8 border-2 border-clouddrove-light/30">
              <h2 className="text-xl font-bold text-clouddrove-dark mb-4">Choose OneTimeSecret if you want</h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-clouddrove-light">
                  <span className="text-clouddrove-light font-bold mt-0.5">+</span>
                  <span>Managed hosting with regional data residency</span>
                </li>
                <li className="flex items-start gap-2 text-clouddrove-light">
                  <span className="text-clouddrove-light font-bold mt-0.5">+</span>
                  <span>Built-in SSO and team management</span>
                </li>
                <li className="flex items-start gap-2 text-clouddrove-light">
                  <span className="text-clouddrove-light font-bold mt-0.5">+</span>
                  <span>Custom branding without self-hosting</span>
                </li>
                <li className="flex items-start gap-2 text-clouddrove-light">
                  <span className="text-clouddrove-light font-bold mt-0.5">+</span>
                  <span>Incoming secret workflows for receiving data</span>
                </li>
              </ul>
            </div>
          </section>

          {/* CTA */}
          <section className="text-center">
            <Link
              href="/"
              className="inline-block bg-gradient-to-r from-clouddrove-dark to-clouddrove-light text-white py-4 px-8 rounded-xl font-semibold hover:from-clouddrove-light hover:to-clouddrove-dark transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Try Vanisec Free
            </Link>
          </section>
        </div>
      </div>
    </div>
  )
}
