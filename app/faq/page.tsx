import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
  description: 'Common questions about Vanisec — how one-time secret sharing works, security details, expiration options, and more.',
  alternates: { canonical: '/faq' },
}

export default function FAQPage() {
  const faqs = [
    {
      question: 'What is Vanisec?',
      answer: 'Vanisec is a free, open-source one-time secret sharing tool. You paste sensitive information — passwords, API keys, tokens, private notes — and get back a secure link that works exactly once. After the recipient opens it, the secret is permanently deleted.',
    },
    {
      question: 'Is Vanisec free to use?',
      answer: 'Yes, completely. No account required, no credit card, no usage limits. Vanisec is free for personal and commercial use.',
    },
    {
      question: 'How secure is Vanisec?',
      answer: 'Secrets are encrypted before being stored in Redis, transmitted over HTTPS, and can only be viewed once. After viewing or expiration, they are permanently deleted with no way to recover them. You can also add a passphrase for an additional layer of protection.',
    },
    {
      question: 'Do I need to create an account?',
      answer: 'No. There are no accounts, no sign-ups, no email addresses required. Just paste your secret and share the link.',
    },
    {
      question: 'What happens after my secret is viewed?',
      answer: 'The moment someone opens the link, the secret is permanently deleted from our servers. The link becomes dead immediately — even if you try to open it again with the same URL, it will show that the secret no longer exists.',
    },
    {
      question: 'What if my secret expires before it\'s viewed?',
      answer: 'If the secret expires before anyone opens it, it is automatically and permanently deleted. The link stops working and the secret cannot be recovered.',
    },
    {
      question: 'Can a secret be viewed more than once?',
      answer: 'No. Each secret can only be viewed exactly one time. This is by design — it\'s what makes Vanisec useful for sharing sensitive information without risk of long-term exposure.',
    },
    {
      question: 'What expiration options are available?',
      answer: 'You can set secrets to expire after 1 hour, 6 hours, 24 hours, 72 hours, or 7 days. Secrets are deleted automatically when the timer runs out, regardless of whether they were viewed.',
    },
    {
      question: 'Is the passphrase required?',
      answer: 'No, it\'s optional. But for especially sensitive information, we recommend using a passphrase and sharing it via a separate channel from the link itself.',
    },
    {
      question: 'Do you store my secrets?',
      answer: 'Secrets are temporarily held in Redis until they are viewed or expire. We never write them to application logs, databases, or any persistent storage. Once deleted, they\'re gone permanently.',
    },
    {
      question: 'Can I use Vanisec commercially?',
      answer: 'Yes. Vanisec is free for both personal and commercial use with no restrictions.',
    },
    {
      question: 'Is Vanisec open source?',
      answer: 'Yes. The full source code is available on GitHub. You can read it, contribute to it, or deploy your own instance if you prefer to self-host.',
    },
  ]

  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-clouddrove-dark mb-4">Frequently Asked Questions</h1>
          <p className="text-lg md:text-xl text-clouddrove-light max-w-2xl mx-auto">
            Everything you need to know about Vanisec
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
            Can't find what you're looking for? Open an issue on GitHub or reach out.
          </p>
          <a
            href="/contact"
            className="inline-block bg-gradient-to-r from-clouddrove-dark to-clouddrove-light text-white py-4 px-8 rounded-xl font-semibold hover:from-clouddrove-light hover:to-clouddrove-dark transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Contact Us
          </a>
        </div>
      </div>
    </div>
  )
}
