import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Vanisec vs PrivateBin — Feature Comparison',
  description: 'Comparing Vanisec and PrivateBin for secure sharing. See differences in encryption approach, one-time viewing, ease of use, and secret management.',
  alternates: { canonical: '/compare/privatebin' },
}

export default function VsPrivateBinPage() {
  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-clouddrove-light uppercase tracking-wider mb-2">Comparison</p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-clouddrove-dark mb-4">
            Vanisec vs PrivateBin
          </h1>
          <p className="text-lg md:text-xl text-clouddrove-light max-w-2xl mx-auto">
            Both are open-source tools for secure sharing. They solve different problems in different ways.
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
                    <th className="px-6 py-4 text-clouddrove-light font-semibold text-sm">PrivateBin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-clouddrove-light/20">
                  <tr>
                    <td className="px-6 py-4 text-clouddrove-dark font-medium">Primary Purpose</td>
                    <td className="px-6 py-4 text-clouddrove-dark font-semibold">One-time secret sharing</td>
                    <td className="px-6 py-4 text-clouddrove-light">Encrypted pastebin</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-clouddrove-dark font-medium">One-Time View</td>
                    <td className="px-6 py-4 text-clouddrove-dark font-semibold">Always — by design</td>
                    <td className="px-6 py-4 text-clouddrove-light">Optional &quot;burn after reading&quot;</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-clouddrove-dark font-medium">Encryption Model</td>
                    <td className="px-6 py-4 text-clouddrove-dark font-semibold">Server-side encryption + HTTPS</td>
                    <td className="px-6 py-4 text-clouddrove-light">Client-side (browser) AES-256-GCM</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-clouddrove-dark font-medium">Zero-Knowledge Server</td>
                    <td className="px-6 py-4 text-clouddrove-light">No — server handles encryption</td>
                    <td className="px-6 py-4 text-clouddrove-dark font-semibold">Yes — server never sees plaintext</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-clouddrove-dark font-medium">Hosting Model</td>
                    <td className="px-6 py-4 text-clouddrove-dark font-semibold">Managed + self-host (Docker/K8s)</td>
                    <td className="px-6 py-4 text-clouddrove-light">Self-host only (PHP)</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-clouddrove-dark font-medium">Setup Complexity</td>
                    <td className="px-6 py-4 text-clouddrove-dark font-semibold">Zero — use vanisec.clouddrove.com</td>
                    <td className="px-6 py-4 text-clouddrove-light">Requires server setup (PHP + web server)</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-clouddrove-dark font-medium">Discussion/Comments</td>
                    <td className="px-6 py-4 text-clouddrove-light">No — single-purpose</td>
                    <td className="px-6 py-4 text-clouddrove-dark font-semibold">Yes — anonymous discussions</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-clouddrove-dark font-medium">Syntax Highlighting</td>
                    <td className="px-6 py-4 text-clouddrove-light">No</td>
                    <td className="px-6 py-4 text-clouddrove-dark font-semibold">Yes</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-clouddrove-dark font-medium">Markdown Support</td>
                    <td className="px-6 py-4 text-clouddrove-light">No</td>
                    <td className="px-6 py-4 text-clouddrove-dark font-semibold">Yes</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-clouddrove-dark font-medium">File Upload</td>
                    <td className="px-6 py-4 text-clouddrove-dark font-semibold">Yes — up to 5MB</td>
                    <td className="px-6 py-4 text-clouddrove-dark font-semibold">Yes</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-clouddrove-dark font-medium">REST API</td>
                    <td className="px-6 py-4 text-clouddrove-dark font-semibold">Yes — documented with examples</td>
                    <td className="px-6 py-4 text-clouddrove-light">Limited</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-clouddrove-dark font-medium">Tech Stack</td>
                    <td className="px-6 py-4 text-clouddrove-dark">Next.js + Redis</td>
                    <td className="px-6 py-4 text-clouddrove-light">PHP + flat file / database</td>
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
                <h3 className="text-xl font-semibold text-clouddrove-dark mb-3">Different Tools, Different Jobs</h3>
                <p className="text-clouddrove-light leading-relaxed">
                  PrivateBin is an encrypted pastebin — a place to store and share text, code snippets, and files with optional expiration. It supports discussions, syntax highlighting, and Markdown rendering. Vanisec is purpose-built for one thing: sharing a secret exactly once and ensuring it cannot be accessed again. If you need a general-purpose encrypted notepad, PrivateBin is a strong choice. If you need to securely hand off a password, API key, or credential to a specific person, Vanisec is designed for that workflow.
                </p>
              </div>
              <div className="bg-white rounded-2xl p-8 border-2 border-clouddrove-light/30">
                <h3 className="text-xl font-semibold text-clouddrove-dark mb-3">Encryption Approach</h3>
                <p className="text-clouddrove-light leading-relaxed">
                  PrivateBin encrypts data in your browser before it reaches the server, so the server never sees your plaintext. The decryption key is stored in the URL fragment (after the #), which is never sent to the server. Vanisec encrypts data server-side and stores it in Redis with automatic TTL-based expiration. Both approaches have trade-offs: PrivateBin offers stronger zero-knowledge guarantees, while Vanisec offers a simpler deployment model and guaranteed one-time access enforcement at the server level.
                </p>
              </div>
              <div className="bg-white rounded-2xl p-8 border-2 border-clouddrove-light/30">
                <h3 className="text-xl font-semibold text-clouddrove-dark mb-3">Ease of Use</h3>
                <p className="text-clouddrove-light leading-relaxed">
                  Vanisec is available as a hosted service at vanisec.clouddrove.com — no server setup needed. PrivateBin requires you to deploy and maintain your own instance on a PHP-capable web server. For teams that want instant access without infrastructure work, Vanisec is ready out of the box. For teams that want full client-side encryption with zero server trust, PrivateBin is worth the setup effort.
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
                  <span>Guaranteed one-time viewing for credentials</span>
                </li>
                <li className="flex items-start gap-2 text-clouddrove-light">
                  <span className="text-clouddrove-dark font-bold mt-0.5">+</span>
                  <span>A hosted service with zero setup</span>
                </li>
                <li className="flex items-start gap-2 text-clouddrove-light">
                  <span className="text-clouddrove-dark font-bold mt-0.5">+</span>
                  <span>Modern stack (Next.js, Redis, Docker, Kubernetes)</span>
                </li>
                <li className="flex items-start gap-2 text-clouddrove-light">
                  <span className="text-clouddrove-dark font-bold mt-0.5">+</span>
                  <span>A documented REST API for automation</span>
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-2xl p-8 border-2 border-clouddrove-light/30">
              <h2 className="text-xl font-bold text-clouddrove-dark mb-4">Choose PrivateBin if you want</h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-clouddrove-light">
                  <span className="text-clouddrove-light font-bold mt-0.5">+</span>
                  <span>Client-side encryption with zero-knowledge server</span>
                </li>
                <li className="flex items-start gap-2 text-clouddrove-light">
                  <span className="text-clouddrove-light font-bold mt-0.5">+</span>
                  <span>Multi-view pastes with optional burn-after-reading</span>
                </li>
                <li className="flex items-start gap-2 text-clouddrove-light">
                  <span className="text-clouddrove-light font-bold mt-0.5">+</span>
                  <span>Discussion threads and code syntax highlighting</span>
                </li>
                <li className="flex items-start gap-2 text-clouddrove-light">
                  <span className="text-clouddrove-light font-bold mt-0.5">+</span>
                  <span>Full control with self-hosted PHP deployment</span>
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
