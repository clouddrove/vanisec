export default function StructuredData() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tessera.clouddrove.com'

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Tessera',
    alternateName: ['OTS', 'One-Time Secret', 'One Time Secret'],
    url: baseUrl,
    logo: `${baseUrl}/favicon.svg`,
    description: 'Free secure one-time secret sharing platform (OTS). Share sensitive information like passwords, API keys, and credentials through encrypted links that automatically delete after viewing. No sign-up required.',
    sameAs: [
      'https://github.com/clouddrove/tessera',
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
    name: 'Tessera',
    alternateName: ['OTS', 'One-Time Secret', 'One Time Secret'],
    url: baseUrl,
    description: 'Free secure one-time secret sharing platform (OTS). Share passwords, API keys, credentials, and confidential data through encrypted self-destructing links. No sign-up, completely free.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  const softwareApplicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Tessera',
    alternateName: ['OTS', 'One-Time Secret', 'One Time Secret'],
    applicationCategory: 'SecurityApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description: 'Free secure one-time secret sharing platform (OTS). Share passwords, API keys, credentials, and confidential data through encrypted self-destructing links. No sign-up required, completely free.',
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

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is Tessera?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Tessera (also known as OTS or One-Time Secret) is a free, secure one-time secret sharing platform. You can share sensitive information like passwords, API keys, credentials, or confidential data through encrypted links that can only be viewed once and are automatically deleted.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is Tessera free to use?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, Tessera is completely free to use. There is no sign-up required, no credit card needed, and no hidden fees.',
        },
      },
      {
        '@type': 'Question',
        name: 'How secure is Tessera?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Tessera uses encryption to protect your secrets. Secrets are stored in Redis with automatic expiration, can only be viewed once, and are permanently deleted after viewing or expiration. You can also add password protection for an extra layer of security.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do I need to create an account?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No, Tessera does not require any sign-up or account creation. You can start sharing secrets immediately.',
        },
      },
      {
        '@type': 'Question',
        name: 'What happens to my secret after it is viewed?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Once a secret is viewed, it is immediately and permanently deleted from our servers. It cannot be accessed again, even with the same link.',
        },
      },
    ],
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

