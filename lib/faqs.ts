// The single source of truth for the FAQ.
//
// This list previously existed twice: once in app/faq/page.tsx for the visible
// page, and once again inside components/StructuredData.tsx as a hand-written
// FAQPage schema. They drifted, and the drift was invisible because only one of
// them renders as text. When the password stopped being optional, the page was
// eventually corrected and the schema was not, so the answer Google surfaced
// stayed wrong.
//
// Both now read from here.
//
// schemaQuestion and schemaAnswer exist because the schema copy carried more
// keyword-heavy wording for search, which is worth keeping. Where they are
// absent the visible text is used for both.

export interface Faq {
  question: string
  answer: string
  schemaQuestion?: string
  schemaAnswer?: string
}

export const FAQS: Faq[] = [
  {
    question: 'What is Vanisec?',
    answer: 'Vanisec is a free, open-source one-time secret sharing tool. You paste sensitive information — passwords, API keys, tokens, private notes — and get back a secure link that works exactly once. After the recipient opens it, the secret is permanently deleted.',
    schemaAnswer: 'Vanisec (also known as OTS or One-Time Secret) is a free, secure one-time secret sharing platform. You can share sensitive information like passwords, API keys, credentials, or confidential data through encrypted links that can only be viewed once and are automatically deleted.',
  },
  {
    question: 'Is Vanisec free to use?',
    answer: 'Yes, completely. No account required, no credit card, no usage limits. Vanisec is free for personal and commercial use.',
    schemaAnswer: 'Yes, Vanisec is completely free to use. There is no sign-up required, no credit card needed, and no hidden fees.',
  },
  {
    question: 'How secure is Vanisec?',
    answer: 'Secrets are encrypted before being stored in Redis, transmitted over HTTPS, and can only be viewed once. After viewing or expiration, they are permanently deleted with no way to recover them. You can also add a passphrase for an additional layer of protection.',
    schemaAnswer: 'Vanisec uses encryption to protect your secrets. Secrets are stored in Redis with automatic expiration, can only be viewed once, and are permanently deleted after viewing or expiration. You can also add password protection for an extra layer of security.',
  },
  {
    question: 'Do I need to create an account?',
    answer: 'No. There are no accounts, no sign-ups, no email addresses required. Just paste your secret and share the link.',
    schemaAnswer: 'No, Vanisec does not require any sign-up or account creation. You can start sharing secrets immediately.',
  },
  {
    question: 'What happens after my secret is viewed?',
    answer: 'The moment someone opens the link, the secret is permanently deleted from our servers. The link becomes dead immediately — even if you try to open it again with the same URL, it will show that the secret no longer exists.',
    schemaQuestion: 'What happens to my secret after it is viewed?',
    schemaAnswer: 'Once a secret is viewed, it is immediately and permanently deleted from our servers. It cannot be accessed again, even with the same link.',
  },
  {
    question: 'What if my secret expires before it\'s viewed?',
    answer: 'If the secret expires before anyone opens it, it is automatically and permanently deleted. The link stops working and the secret cannot be recovered.',
  },
  {
    question: 'Can a secret be viewed more than once?',
    answer: 'No. Each secret can only be viewed exactly one time. This is by design — it\'s what makes Vanisec useful for sharing sensitive information without risk of long-term exposure.',
    schemaAnswer: 'No. Each secret can only be viewed exactly one time. This is by design — it is what makes Vanisec useful for sharing sensitive information without risk of long-term exposure.',
  },
  {
    question: 'What expiration options are available?',
    answer: 'You can set secrets to expire after 1 hour, 6 hours, 24 hours, 72 hours, or 7 days. Secrets are deleted automatically when the timer runs out, regardless of whether they were viewed.',
  },
  {
    question: 'Is the password required?',
    answer: 'Yes, for one-time secret links. Every secret is protected by a password, and it never leaves your browser: it derives the encryption key, and separately a one-way value that gates retrieval. Send it to the recipient through a different channel than the link, because either one alone is useless and the pair together is the secret. The clipboard is the exception: it uses a short code instead, and is convenience rather than privacy.',
  },
  {
    question: 'Do you store my secrets?',
    answer: 'Secrets are temporarily held in Redis until they are viewed or expire. We never write them to application logs, databases, or any persistent storage. Once deleted, they\'re gone permanently.',
    schemaAnswer: 'Secrets are temporarily held in Redis until they are viewed or expire. We never write them to application logs, databases, or any persistent storage. Once deleted, they are gone permanently.',
  },
  {
    question: 'Can I use Vanisec to move text between my own devices?',
    answer: 'Yes, that is what the clipboard is for. Paste text or attach a file at /clipboard, click Save, and you get a four digit code. Open the same page on your other device and enter it, or scan the QR code shown next to it and type nothing at all. It expires after five minutes and opens exactly once.',
  },
  {
    question: 'What is the difference between a one-time link and the clipboard?',
    answer: 'A one-time link is private: it has a password that never leaves your browser, so Vanisec cannot read the secret. Use it for anything sensitive. The clipboard is fast: a four digit code, no password, five minutes. Vanisec can read a clip while it exists, and a four digit code is guessable, so use it for moving ordinary text between your own devices, not for credentials.',
  },
  {
    question: 'Is the clipboard less secure without a password?',
    answer: 'Yes, and deliberately so. A four digit code is only ten thousand possibilities, which is far too few to be an encryption key, so the key is held on our server instead. That means Vanisec can read a clip while it exists, and someone guessing codes could find one. What limits it is time: a clip lives five minutes and opens once, so a code that has been used is already dead. Use the clipboard for moving ordinary text between your own devices. For a password, an API key or anything else sensitive, use a one-time link, where the password never leaves your browser and we genuinely cannot read it.',
  },
  {
    question: 'Can I share a file through the clipboard?',
    answer: 'Yes, up to 5MB. The file is encrypted in your browser alongside any text, and whoever enters the code gets a download link. Same rules apply: five minutes, opens once, and not the place for a sensitive file.',
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
