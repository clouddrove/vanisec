import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'API Documentation',
  description: 'Vanisec REST API reference — integrate one-time secret sharing into your applications with a simple POST endpoint.',
  alternates: { canonical: '/api' },
}

export default function APIPage() {
  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-clouddrove-dark mb-4">API Documentation</h1>
          <p className="text-lg md:text-xl text-clouddrove-light max-w-2xl mx-auto">
            Integrate secure one-time secret sharing into your own apps and workflows
          </p>
        </div>

        <div className="space-y-12">
          <section>
            <h2 className="text-2xl md:text-3xl font-bold text-clouddrove-dark mb-4">Create a Secret</h2>
            <div className="bg-white rounded-2xl p-8 border-2 border-clouddrove-light/30">
              <div className="mb-4">
                <span className="inline-block bg-clouddrove-dark text-white px-3 py-1 rounded text-sm font-mono">POST</span>
                <span className="ml-3 font-mono text-clouddrove-dark">/api/secrets</span>
              </div>
              <p className="text-clouddrove-light mb-6">Creates a new secret and returns a one-time URL. The secret is permanently deleted after the link is opened or it expires.</p>

              <h3 className="text-lg font-semibold text-clouddrove-dark mb-2">Request Body</h3>
              <pre className="bg-clouddrove-light/10 rounded-lg p-4 overflow-x-auto text-xs md:text-sm mb-6">
{`{
  "secret": "string (required)",
  "password": "string (optional)",
  "expiresIn": number (optional, hours, default: 24)
}`}
              </pre>

              <h3 className="text-lg font-semibold text-clouddrove-dark mb-2">Response</h3>
              <pre className="bg-clouddrove-light/10 rounded-lg p-4 overflow-x-auto text-xs md:text-sm">
{`{
  "id": "string",
  "url": "string"
}`}
              </pre>
            </div>
          </section>

          <section>
            <h2 className="text-2xl md:text-3xl font-bold text-clouddrove-dark mb-4">Examples</h2>
            <div className="bg-white rounded-2xl p-8 border-2 border-clouddrove-light/30">
              <h3 className="text-lg font-semibold text-clouddrove-dark mb-4">cURL</h3>
              <pre className="bg-clouddrove-light/10 rounded-lg p-4 overflow-x-auto text-xs md:text-sm">
{`curl -X POST https://vanisec.clouddrove.com/api/secrets \\
  -H "Content-Type: application/json" \\
  -d '{
    "secret": "my-secret-api-key",
    "password": "optional-password",
    "expiresIn": 24
  }'`}
              </pre>

              <h3 className="text-lg font-semibold text-clouddrove-dark mb-4 mt-6">JavaScript</h3>
              <pre className="bg-clouddrove-light/10 rounded-lg p-4 overflow-x-auto text-xs md:text-sm">
{`const response = await fetch('https://vanisec.clouddrove.com/api/secrets', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    secret: 'my-secret-api-key',
    password: 'optional-password',
    expiresIn: 24,
  }),
});

const { id, url } = await response.json();
console.log(url); // Share this one-time link`}
              </pre>

              <h3 className="text-lg font-semibold text-clouddrove-dark mb-4 mt-6">Python</h3>
              <pre className="bg-clouddrove-light/10 rounded-lg p-4 overflow-x-auto text-xs md:text-sm">
{`import requests

response = requests.post(
    'https://vanisec.clouddrove.com/api/secrets',
    json={
        'secret': 'my-secret-api-key',
        'expiresIn': 24,
    }
)

data = response.json()
print(data['url'])  # Share this one-time link`}
              </pre>
            </div>
          </section>

          <section>
            <h2 className="text-2xl md:text-3xl font-bold text-clouddrove-dark mb-4">Rate Limits</h2>
            <div className="bg-gradient-to-br from-clouddrove-light/10 to-clouddrove-dark/10 rounded-2xl p-8 border-2 border-clouddrove-light/30">
              <p className="text-clouddrove-light">
                The API currently has no rate limits. We may introduce limits in the future to ensure fair use for all users — if we do, we'll announce it in the GitHub repository.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl md:text-3xl font-bold text-clouddrove-dark mb-4">Self-Hosting</h2>
            <div className="bg-white rounded-2xl p-8 border-2 border-clouddrove-light/30 text-center">
              <p className="text-clouddrove-light mb-4">
                Vanisec is fully open source. Run your own instance on your own infrastructure — Docker and docker-compose configs are included.
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
