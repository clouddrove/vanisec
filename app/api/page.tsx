import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'API Documentation',
  description:
    'Vanisec REST API reference — create and retrieve end-to-end encrypted one-time secrets. Encryption happens in your client; the server only ever stores ciphertext.',
  alternates: { canonical: '/api' },
}

const CARD = 'bg-white rounded-2xl p-8 border-2 border-clouddrove-light/30'
const PRE = 'bg-clouddrove-light/10 rounded-lg p-4 overflow-x-auto text-xs md:text-sm'
const H2 = 'text-2xl md:text-3xl font-bold text-clouddrove-dark mb-4'
const H3 = 'text-lg font-semibold text-clouddrove-dark mb-2'
const VERB = 'inline-block bg-clouddrove-dark text-white px-3 py-1 rounded text-sm font-mono'

export default function APIPage() {
  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-clouddrove-dark mb-4">API Documentation</h1>
          <p className="text-lg md:text-xl text-clouddrove-light max-w-2xl mx-auto">
            Integrate end-to-end encrypted one-time secret sharing into your own apps and workflows
          </p>
        </div>

        <div className="space-y-12">
          <section>
            <div className="bg-gradient-to-br from-clouddrove-light/10 to-clouddrove-dark/10 rounded-2xl p-8 border-2 border-clouddrove-light/30">
              <h2 className="text-xl font-bold text-clouddrove-dark mb-3">Your client does the encryption</h2>
              <p className="text-clouddrove-light mb-3">
                Vanisec is zero-knowledge. The server never receives your plaintext, your password, or your
                encryption key — it stores ciphertext and nothing else. That means the API does not accept a
                secret directly. You encrypt first, then upload the result.
              </p>
              <p className="text-clouddrove-light">
                If you just want to share a secret, use the website. This API is for building your own client,
                and you have to implement the key derivation described below exactly, or your secret will not
                decrypt.
              </p>
            </div>
          </section>

          <section>
            <h2 className={H2}>How the crypto works</h2>
            <div className={CARD}>
              <p className="text-clouddrove-light mb-6">
                Every secret is password-protected. Two independent values are derived from that password using
                PBKDF2-HMAC-SHA256, each with its own random 16-byte salt:
              </p>
              <ul className="space-y-3 text-clouddrove-light mb-6">
                <li>
                  <strong className="text-clouddrove-dark">Encryption key</strong> — derived with{' '}
                  <code className="font-mono text-sm">encSalt</code>, 256 bits, used as an AES-256-GCM key with a
                  random 12-byte IV. This key never leaves your client.
                </li>
                <li>
                  <strong className="text-clouddrove-dark">Verifier</strong> — derived with{' '}
                  <code className="font-mono text-sm">authSalt</code>, 256 bits, sent to the server to prove you
                  know the password. The server stores only its SHA-256 hash and compares in constant time, so it
                  cannot recover the verifier, let alone the password or the key.
                </li>
              </ul>
              <p className="text-clouddrove-light mb-6">
                Because the two salts differ, holding the verifier tells you nothing about the encryption key.
                Wrong guesses are rejected without consuming the secret.
              </p>

              <h3 className={H3}>Parameters</h3>
              <pre className={PRE + ' mb-6'}>
{`KDF          PBKDF2-HMAC-SHA256
Iterations   600000   (minimum accepted; sent as "iterations")
Salts        16 random bytes each, for encSalt and authSalt
Cipher       AES-256-GCM
IV           12 random bytes
Encoding     base64url, unpadded, for every binary field`}
              </pre>

              <h3 className={H3}>Plaintext envelope</h3>
              <p className="text-clouddrove-light mb-3">
                Encrypt this JSON structure, not your raw string. Text-only secrets set{' '}
                <code className="font-mono text-sm">file</code> to null.
              </p>
              <pre className={PRE}>
{`{
  "text": "your secret text",
  "file": null
}

// or, to attach a file:
{
  "text": "",
  "file": {
    "name": "id_rsa",
    "type": "application/octet-stream",
    "size": 2610,
    "data": "<standard base64 of the file bytes>"
  }
}`}
              </pre>
            </div>
          </section>

          <section>
            <h2 className={H2}>Create a secret</h2>
            <div className={CARD}>
              <div className="mb-4">
                <span className={VERB}>POST</span>
                <span className="ml-3 font-mono text-clouddrove-dark">/api/secrets</span>
              </div>
              <p className="text-clouddrove-light mb-6">
                Stores an encrypted payload and returns its id. Build the share link yourself as{' '}
                <code className="font-mono text-sm">/secret/&#123;id&#125;</code>.
              </p>

              <h3 className={H3}>Request body</h3>
              <pre className={PRE + ' mb-6'}>
{`{
  "ciphertext":        "string  (required, base64url, max 12000000 chars)",
  "iv":                "string  (required, base64url)",
  "passwordProtected": true,
  "encSalt":           "string  (required, base64url)",
  "authSalt":          "string  (required, base64url)",
  "verifier":          "string  (required, base64url)",
  "iterations":         600000,
  "expiresIn":          24
}`}
              </pre>
              <p className="text-clouddrove-light mb-6 text-sm">
                <code className="font-mono">passwordProtected</code> must be true — every secret requires a
                password. <code className="font-mono">iterations</code> must be at least 600000.{' '}
                <code className="font-mono">expiresIn</code> is in hours and must be one of 1, 6, 24, 72 or 168.
                The request body itself is capped at 16 MB.
              </p>

              <h3 className={H3}>Response</h3>
              <pre className={PRE}>
{`{
  "id": "31c3e8d4-43a8-4e72-aac7-b38a00b46a50"
}`}
              </pre>
            </div>
          </section>

          <section>
            <h2 className={H2}>Fetch retrieval parameters</h2>
            <div className={CARD}>
              <div className="mb-4">
                <span className={VERB}>GET</span>
                <span className="ml-3 font-mono text-clouddrove-dark">/api/secrets/&#123;id&#125;</span>
              </div>
              <p className="text-clouddrove-light mb-6">
                Returns what you need to compute the verifier. This does <strong>not</strong> consume the secret,
                and it deliberately withholds <code className="font-mono text-sm">encSalt</code> until you have
                proven you know the password. A password-protected secret answers with{' '}
                <code className="font-mono text-sm">401</code>, which is expected, not an error.
              </p>

              <h3 className={H3}>Response — 401</h3>
              <pre className={PRE}>
{`{
  "requiresPassword": true,
  "authSalt":         "string (base64url)",
  "iterations":        600000
}`}
              </pre>
              <p className="text-clouddrove-light mt-4 text-sm">
                Always use the returned <code className="font-mono">iterations</code> rather than assuming the
                current default — secrets created before the work factor was raised carry the older value.
              </p>
            </div>
          </section>

          <section>
            <h2 className={H2}>Retrieve and burn a secret</h2>
            <div className={CARD}>
              <div className="mb-4">
                <span className={VERB}>POST</span>
                <span className="ml-3 font-mono text-clouddrove-dark">/api/secrets/&#123;id&#125;</span>
              </div>
              <p className="text-clouddrove-light mb-6">
                Submits the verifier. On a match the secret is deleted atomically and returned in the same
                operation, so exactly one caller can ever succeed. On a mismatch nothing is deleted.
              </p>

              <h3 className={H3}>Request body</h3>
              <pre className={PRE + ' mb-6'}>
{`{
  "verifier": "string (base64url)"
}`}
              </pre>

              <h3 className={H3}>Response — 200</h3>
              <pre className={PRE + ' mb-6'}>
{`{
  "ciphertext": "string (base64url)",
  "iv":         "string (base64url)",
  "encSalt":    "string (base64url)",
  "iterations":  600000
}`}
              </pre>
              <p className="text-clouddrove-light mb-6 text-sm">
                Derive the AES key from your password and this{' '}
                <code className="font-mono">encSalt</code>, decrypt, then parse the envelope.
              </p>

              <h3 className={H3}>Response — 401</h3>
              <pre className={PRE}>
{`{
  "error": "Invalid password",
  "attemptsRemaining": 7
}`}
              </pre>
            </div>
          </section>

          <section>
            <h2 className={H2}>Complete example</h2>
            <div className={CARD}>
              <p className="text-clouddrove-light mb-4">
                Node.js 18 or newer, no dependencies — it uses the built-in Web Crypto API. The same code runs in
                a browser unchanged apart from the base64 helpers.
              </p>
              <pre className={PRE}>
{`const BASE = 'https://vanisec.clouddrove.com'
const ITERATIONS = 600000

const b64url = (bytes) =>
  Buffer.from(bytes).toString('base64')
    .replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/, '')

const unb64url = (s) =>
  new Uint8Array(Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64'))

async function deriveBits(password, salt, iterations) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  return new Uint8Array(await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, key, 256))
}

async function createSecret(text, password) {
  const encSalt = crypto.getRandomValues(new Uint8Array(16))
  const authSalt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))

  const envelope = JSON.stringify({ text, file: null })
  const keyBits = await deriveBits(password, encSalt, ITERATIONS)
  const key = await crypto.subtle.importKey(
    'raw', keyBits, { name: 'AES-GCM' }, false, ['encrypt'])
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv }, key, new TextEncoder().encode(envelope))
  const verifier = await deriveBits(password, authSalt, ITERATIONS)

  const res = await fetch(BASE + '/api/secrets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ciphertext: b64url(new Uint8Array(ciphertext)),
      iv: b64url(iv),
      passwordProtected: true,
      encSalt: b64url(encSalt),
      authSalt: b64url(authSalt),
      verifier: b64url(verifier),
      iterations: ITERATIONS,
      expiresIn: 24,
    }),
  })
  if (!res.ok) throw new Error('create failed: ' + res.status)
  const { id } = await res.json()
  return BASE + '/secret/' + id
}

async function readSecret(url, password) {
  const id = url.split('/').pop()

  const metaRes = await fetch(BASE + '/api/secrets/' + id)
  const meta = await metaRes.json()
  if (metaRes.status !== 401) throw new Error('not available: ' + metaRes.status)

  const verifier = await deriveBits(password, unb64url(meta.authSalt), meta.iterations)
  const res = await fetch(BASE + '/api/secrets/' + id, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ verifier: b64url(verifier) }),
  })
  if (!res.ok) throw new Error('read failed: ' + res.status)
  const data = await res.json()

  const keyBits = await deriveBits(password, unb64url(data.encSalt), data.iterations)
  const key = await crypto.subtle.importKey(
    'raw', keyBits, { name: 'AES-GCM' }, false, ['decrypt'])
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: unb64url(data.iv) }, key, unb64url(data.ciphertext))
  return JSON.parse(new TextDecoder().decode(plaintext)).text
}

const url = await createSecret('deploy key: abc123', 'hunter2')
console.log('created:', url)
console.log('read back:', await readSecret(url, 'hunter2'))
// a second read fails — the secret is gone`}
              </pre>
            </div>
          </section>

          <section>
            <h2 className={H2}>Errors</h2>
            <div className={CARD}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-clouddrove-light/30 text-left">
                      <th className="py-2 pr-4 font-semibold text-clouddrove-dark">Status</th>
                      <th className="py-2 font-semibold text-clouddrove-dark">Meaning</th>
                    </tr>
                  </thead>
                  <tbody className="text-clouddrove-light">
                    <tr className="border-b border-clouddrove-light/20">
                      <td className="py-2 pr-4 font-mono">400</td>
                      <td className="py-2">Malformed body, missing field, iterations below the minimum, or an expiry outside the allowed set</td>
                    </tr>
                    <tr className="border-b border-clouddrove-light/20">
                      <td className="py-2 pr-4 font-mono">401</td>
                      <td className="py-2">On GET, the secret exists and needs a password. On POST, the verifier did not match</td>
                    </tr>
                    <tr className="border-b border-clouddrove-light/20">
                      <td className="py-2 pr-4 font-mono">404</td>
                      <td className="py-2">No such secret, or it has already been viewed</td>
                    </tr>
                    <tr className="border-b border-clouddrove-light/20">
                      <td className="py-2 pr-4 font-mono">410</td>
                      <td className="py-2">The secret expired, or was taken between your two requests</td>
                    </tr>
                    <tr className="border-b border-clouddrove-light/20">
                      <td className="py-2 pr-4 font-mono">413</td>
                      <td className="py-2">Request body over 16 MB</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-mono">429</td>
                      <td className="py-2">Rate limited. Check the Retry-After header</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section>
            <h2 className={H2}>Rate limits</h2>
            <div className="bg-gradient-to-br from-clouddrove-light/10 to-clouddrove-dark/10 rounded-2xl p-8 border-2 border-clouddrove-light/30">
              <p className="text-clouddrove-light mb-4">
                All limits use fixed windows and return{' '}
                <code className="font-mono text-sm">429</code> with a{' '}
                <code className="font-mono text-sm">Retry-After</code> header when exceeded.
              </p>
              <ul className="space-y-2 text-clouddrove-light">
                <li>
                  <strong className="text-clouddrove-dark">Creating secrets</strong> — 30 per 10 minutes per IP
                </li>
                <li>
                  <strong className="text-clouddrove-dark">Reading metadata</strong> — 120 per 15 minutes per IP
                </li>
                <li>
                  <strong className="text-clouddrove-dark">Password attempts</strong> — 60 per 15 minutes per IP,
                  and 10 per 15 minutes per secret
                </li>
              </ul>
              <p className="text-clouddrove-light mt-4 text-sm">
                The per-secret limit is what stops a leaked link from being brute-forced. A failed attempt never
                deletes the secret, so the limit is the only thing bounding guesses.
              </p>
            </div>
          </section>

          <section>
            <h2 className={H2}>Self-Hosting</h2>
            <div className="bg-white rounded-2xl p-8 border-2 border-clouddrove-light/30 text-center">
              <p className="text-clouddrove-light mb-4">
                Vanisec is fully open source. Run your own instance on your own infrastructure — Docker and
                docker-compose configs are included.
              </p>
              <a
                href="https://github.com/clouddrove/vanisec"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-gradient-to-r from-clouddrove-dark to-clouddrove-light text-white py-4 px-8 rounded-xl font-semibold hover:from-clouddrove-light hover:to-clouddrove-dark transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                View on GitHub
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
