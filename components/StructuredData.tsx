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

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is Vanisec?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Vanisec (also known as OTS or One-Time Secret) is a free, secure one-time secret sharing platform. You can share sensitive information like passwords, API keys, credentials, or confidential data through encrypted links that can only be viewed once and are automatically deleted.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is Vanisec free to use?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, Vanisec is completely free to use. There is no sign-up required, no credit card needed, and no hidden fees.',
        },
      },
      {
        '@type': 'Question',
        name: 'How secure is Vanisec?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Vanisec uses encryption to protect your secrets. Secrets are stored in Redis with automatic expiration, can only be viewed once, and are permanently deleted after viewing or expiration. You can also add password protection for an extra layer of security.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do I need to create an account?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No, Vanisec does not require any sign-up or account creation. You can start sharing secrets immediately.',
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
      {
        '@type': 'Question',
        name: 'What if my secret expires before it is viewed?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'If the secret expires before anyone opens it, it is automatically and permanently deleted. The link stops working and the secret cannot be recovered.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can a secret be viewed more than once?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. Each secret can only be viewed exactly one time. This is by design — it is what makes Vanisec useful for sharing sensitive information without risk of long-term exposure.',
        },
      },
      {
        '@type': 'Question',
        name: 'What expiration options are available?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'You can set secrets to expire after 1 hour, 6 hours, 24 hours, 72 hours, or 7 days. Secrets are deleted automatically when the timer runs out, regardless of whether they were viewed.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is the passphrase required?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No, it is optional. But for especially sensitive information, we recommend using a passphrase and sharing it via a separate channel from the link itself.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do you store my secrets?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Secrets are temporarily held in Redis until they are viewed or expire. We never write them to application logs, databases, or any persistent storage. Once deleted, they are gone permanently.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I use Vanisec commercially?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Vanisec is free for both personal and commercial use with no restrictions.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is Vanisec open source?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. The full source code is available on GitHub. You can read it, contribute to it, or deploy your own instance if you prefer to self-host.',
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

