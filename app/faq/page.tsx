import type { Metadata } from 'next'
import Link from 'next/link'

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
      question: 'Is the password required?',
      answer: 'Yes, for one-time secret links. Every secret is protected by a password, and it never leaves your browser: it derives the encryption key, and separately a one-way value that gates retrieval. Send it to the recipient through a different channel than the link, because either one alone is useless and the pair together is the secret. The clipboard is the exception and needs no password, because its code is the key.',
    },
    {
      question: 'Do you store my secrets?',
      answer: 'Secrets are temporarily held in Redis until they are viewed or expire. We never write them to application logs, databases, or any persistent storage. Once deleted, they\'re gone permanently.',
    },
    {
      question: 'Can I use Vanisec to move text between my own devices?',
      answer: 'Yes, that is what the clipboard is for. Paste text or attach a file at /clipboard, click Save, and you get a ten character code such as 4F2K9-QX1B7. Open the same page on your other device, type the code, and the text appears. There is no password and no login, and it opens exactly once.',
    },
    {
      question: 'What is the difference between a one-time link and the clipboard?',
      answer: 'A one-time link is for handing something to another person: it has a password, and you send the link and the password through different channels. The clipboard is for moving something to a device you are holding: no password, just a short code you can read off one screen and type into another. Both encrypt in your browser, both open once, and both expire.',
    },
    {
      question: 'Is the clipboard less secure without a password?',
      answer: 'It is a different tradeoff rather than a weaker one. The code is the key: your browser runs one PBKDF2 pass over the ten character code to produce both the id we store under and the AES key, and the code itself is never sent to us, so we hold ciphertext we cannot open. What you do give up is that the code alone grants access, so anyone who sees it can read the clip. Treat it like a password, and let it expire.',
    },
    {
      question: 'Can I share a file through the clipboard?',
      answer: 'Yes, up to 5MB. The file is encrypted in your browser alongside any text, and the recipient gets a download link after entering the code. Same rules apply: it opens once and then it is gone.',
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

        <div className="mt-12 bg-white rounded-2xl p-8 border-2 border-clouddrove-light/30">
          <h2 className="text-2xl font-bold text-clouddrove-dark mb-4">Explore More</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/docs" className="block p-4 rounded-xl border border-clouddrove-light/30 hover:border-clouddrove-dark/50 transition-colors">
              <h3 className="font-semibold text-clouddrove-dark mb-1">Documentation</h3>
              <p className="text-sm text-clouddrove-light">Step-by-step guides and best practices</p>
            </Link>
            <Link href="/security" className="block p-4 rounded-xl border border-clouddrove-light/30 hover:border-clouddrove-dark/50 transition-colors">
              <h3 className="font-semibold text-clouddrove-dark mb-1">Security</h3>
              <p className="text-sm text-clouddrove-light">Encryption and compliance details</p>
            </Link>
            <Link href="/api" className="block p-4 rounded-xl border border-clouddrove-light/30 hover:border-clouddrove-dark/50 transition-colors">
              <h3 className="font-semibold text-clouddrove-dark mb-1">API Reference</h3>
              <p className="text-sm text-clouddrove-light">Integrate Vanisec into your apps</p>
            </Link>
          </div>
        </div>

        <div className="mt-8 text-center bg-gradient-to-br from-clouddrove-light/10 to-clouddrove-dark/10 rounded-2xl p-8 border-2 border-clouddrove-light/30">
          <h2 className="text-2xl font-bold text-clouddrove-dark mb-4">Still have questions?</h2>
          <p className="text-clouddrove-light mb-6">
            Can&apos;t find what you&apos;re looking for? Open an issue on GitHub or reach out.
          </p>
          <Link
            href="/contact"
            className="inline-block bg-gradient-to-r from-clouddrove-dark to-clouddrove-light text-white py-4 px-8 rounded-xl font-semibold hover:from-clouddrove-light hover:to-clouddrove-dark transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  )
}
