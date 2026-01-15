import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
  description: 'Common inquiries about Tessera - protected single-use confidential sharing solution.',
}

export default function FAQPage() {
  const faqs = [
    {
      question: 'What is Tessera?',
      answer: 'Tessera (alternatively referred to as OTS or One-Time Secret) represents a complimentary, protected single-use confidential sharing solution. Exchange sensitive data such as authentication credentials, API tokens, access keys, or proprietary information through encrypted URLs that permit only one viewing session and remove themselves automatically.',
    },
    {
      question: 'Is Tessera free to use?',
      answer: 'Absolutely, Tessera operates entirely without cost. Registration is unnecessary, payment methods are not required, and no concealed charges exist. Utilize the service extensively without limitations, perpetually at no expense.',
    },
    {
      question: 'How secure is Tessera?',
      answer: 'Tessera employs encryption to safeguard your confidential entries. Data resides temporarily in Redis with automatic expiration, permits only single access, and gets permanently eliminated after viewing or expiration. Passphrase protection can be added for enhanced security.',
    },
    {
      question: 'Do I need to create an account?',
      answer: 'No, Tessera functions without registration or account creation requirements. Begin exchanging confidential data immediately without any signup process.',
    },
    {
      question: 'What happens to my secret after it is viewed?',
      answer: 'Immediately upon viewing, the confidential entry gets permanently eliminated from our infrastructure. It becomes unrecoverable, even using the identical URL.',
    },
    {
      question: 'What happens if my secret expires before being viewed?',
      answer: 'Should a confidential entry expire prior to access, it gets automatically and permanently removed. The URL becomes non-functional, and the entry cannot be restored.',
    },
    {
      question: 'Can I view a secret multiple times?',
      answer: 'No, each confidential entry allows only one access session. This protection mechanism ensures maximum safeguarding of your sensitive information.',
    },
    {
      question: 'What expiration times are available?',
      answer: 'Options include 60 minutes, 6 hours, 24 hours, 72 hours, or 7 days. Confidential entries get automatically removed upon expiration.',
    },
    {
      question: 'Is password protection required?',
      answer: 'No, passphrase protection remains optional. We suggest utilizing it for extremely sensitive data to provide supplementary protection layers.',
    },
    {
      question: 'Do you store my secrets?',
      answer: 'Confidential entries remain temporarily in Redis until accessed or expired. We never retain entries in activity logs, analytical systems, or persistent storage. After removal, they disappear permanently.',
    },
    {
      question: 'Can I use Tessera for commercial purposes?',
      answer: 'Yes, Tessera operates without cost for both personal and commercial applications. Usage restrictions do not apply.',
    },
    {
      question: 'Is Tessera open source?',
      answer: 'Yes, Tessera functions as open-source software. You can examine the codebase, contribute improvements, or deploy your own instance. Visit our GitHub repository for additional details.',
    },
  ]

  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-clouddrove-dark mb-4">Frequently Asked Questions</h1>
          <p className="text-xl text-clouddrove-light max-w-2xl mx-auto">
            Essential information about Tessera
          </p>
        </div>

        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-2xl p-8 border-2 border-clouddrove-light/30">
              <h2 className="text-xl font-bold text-clouddrove-dark mb-3">{faq.question}</h2>
              <p className="text-clouddrove-light leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center bg-gradient-to-br from-clouddrove-light/10 to-clouddrove-dark/10 rounded-2xl p-8 border-2 border-clouddrove-light/30">
          <h2 className="text-2xl font-bold text-clouddrove-dark mb-4">Still have questions?</h2>
          <p className="text-clouddrove-light mb-6">
            Unable to locate the information you need? Reach out to our team.
          </p>
          <a
            href="/contact"
            className="inline-block bg-gradient-to-r from-clouddrove-dark to-clouddrove-light text-white py-3 px-8 rounded-xl font-semibold hover:from-clouddrove-light hover:to-clouddrove-dark transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Contact Us
          </a>
        </div>
      </div>
    </div>
  )
}
