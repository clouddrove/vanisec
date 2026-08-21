import { FAQS } from '@/lib/faqs'
// Helper function to ensure URL has protocol
function ensureProtocol(url: string): string {
  if (!url) return 'https://vanisec.clouddrove.com'
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  return `https://${url}`
}

export default function StructuredData() {
  const baseUrl = ensureProtocol(process.env.NEXT_PUBLIC_BASE_URL || 'https://vanisec.clouddrove.com')

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Vanisec',
    alternateName: ['OTS', 'One-Time Secret', 'One Time Secret'],
    url: baseUrl,
    logo: `${baseUrl}/favicon.svg`,
    description: 'Vanisec is a free, open-source platform for sharing passwords, API keys, and credentials through encrypted one-time links. Secrets are automatically deleted after viewing — no account needed.',
    sameAs: [
      'https://github.com/clouddrove/vanisec',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      availableLanguage: 'English',
    },
  }

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Vanisec',
    alternateName: ['OTS', 'One-Time Secret', 'One Time Secret'],
    url: baseUrl,
    description: 'Vanisec lets you create encrypted, single-use links for passwords, API keys, and confidential data. Every secret is permanently deleted after one view. Completely free, no account required.',
  }

  const softwareApplicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Vanisec',
    alternateName: ['OTS', 'One-Time Secret', 'One Time Secret'],
    applicationCategory: 'SecurityApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description: 'Vanisec is a free security tool for creating encrypted, single-use secret links. Share passwords, API keys, and credentials that automatically delete after one view. Open source, no account required.',
    url: baseUrl,
    featureList: [
      'One-time view access',
      'Automatic deletion',
      'Password protection',
      'Encrypted storage',
      'No sign-up required',
      'Free to use',
      'Self-destructing links',
      'Burn after reading',
    ],
  }

  // Built from lib/faqs.ts rather than restated here. The two used to be
  // written out separately and drifted: the visible page was corrected when the
  // password stopped being optional, and this copy was not, so the answer shown
  // in search results stayed wrong for far longer than the one on the page.
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((faq) => ({
      '@type': 'Question',
      name: faq.schemaQuestion ?? faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.schemaAnswer ?? faq.answer,
      },
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  )
}

