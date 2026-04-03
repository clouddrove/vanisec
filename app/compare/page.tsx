import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Compare Vanisec — Secret Sharing Alternatives',
  description: 'Compare Vanisec with other secret sharing tools like OneTimeSecret and PrivateBin. See how Vanisec stands out with free, open-source, encrypted one-time links.',
  alternates: { canonical: '/compare' },
}

export default function ComparePage() {
  const comparisons = [
    {
      name: 'OneTimeSecret',
      href: '/compare/onetimesecret',
      description: 'See how Vanisec compares to OneTimeSecret on pricing, features, and open-source availability.',
    },
    {
      name: 'PrivateBin',
      href: '/compare/privatebin',
      description: 'Compare Vanisec with PrivateBin on encryption approach, ease of use, and secret management.',
    },
  ]

  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-clouddrove-dark mb-4">
            Compare Vanisec
          </h1>
          <p className="text-lg md:text-xl text-clouddrove-light max-w-2xl mx-auto">
            How does Vanisec stack up against other secret sharing tools?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {comparisons.map((comp) => (
            <Link
              key={comp.href}
              href={comp.href}
              className="bg-white rounded-2xl p-8 border-2 border-clouddrove-light/30 hover:border-clouddrove-dark/50 transition-all hover:shadow-lg"
            >
              <h2 className="text-2xl font-bold text-clouddrove-dark mb-3">
                Vanisec vs {comp.name}
              </h2>
              <p className="text-clouddrove-light mb-4">{comp.description}</p>
              <span className="text-clouddrove-dark font-semibold text-sm">
                Read comparison &rarr;
              </span>
            </Link>
          ))}
        </div>

        <div className="bg-gradient-to-br from-clouddrove-light/10 to-clouddrove-dark/10 rounded-2xl p-8 border-2 border-clouddrove-light/30">
          <h2 className="text-2xl font-bold text-clouddrove-dark mb-4">Why Teams Choose Vanisec</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-clouddrove-dark mb-2">Truly Free</h3>
              <p className="text-sm text-clouddrove-light">
                No freemium tiers, no usage caps, no credit card required. Every feature is available to everyone.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-clouddrove-dark mb-2">Open Source</h3>
              <p className="text-sm text-clouddrove-light">
                MIT-licensed. Audit the code, self-host it, or contribute improvements. Full transparency.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-clouddrove-dark mb-2">Zero Friction</h3>
              <p className="text-sm text-clouddrove-light">
                No accounts, no onboarding, no setup. Paste a secret and get a link in under 10 seconds.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
