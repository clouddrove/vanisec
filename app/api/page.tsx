import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'API Documentation',
  description: 'Vanisec API reference - incorporate protected single-use confidential sharing functionality into your software applications.',
}

export default function APIPage() {
  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-clouddrove-dark mb-4">API Documentation</h1>
          <p className="text-xl text-clouddrove-light max-w-2xl mx-auto">
            Incorporate Vanisec into your software applications
          </p>
        </div>

        <div className="space-y-12">
          <section>
            <h2 className="text-3xl font-bold text-clouddrove-dark mb-4">Create a Secret</h2>
            <div className="bg-white rounded-2xl p-8 border-2 border-clouddrove-light/30">
              <div className="mb-4">
                <span className="inline-block bg-clouddrove-dark text-white px-3 py-1 rounded text-sm font-mono">POST</span>
                <span className="ml-3 font-mono text-clouddrove-dark">/api/secrets</span>
              </div>
              <p className="text-clouddrove-light mb-4">Generate a new confidential entry and receive a distributable URL.</p>
              
              <h3 className="text-lg font-semibold text-clouddrove-dark mb-2">Request Body</h3>
              <pre className="bg-clouddrove-light/10 rounded-lg p-4 overflow-x-auto text-sm">
{`{
  "secret": "string (required)",
  "password": "string (optional)",
  "expiresIn": number (optional, hours, default: 24)
}`}
              </pre>

              <h3 className="text-lg font-semibold text-clouddrove-dark mb-2 mt-4">Response</h3>
              <pre className="bg-clouddrove-light/10 rounded-lg p-4 overflow-x-auto text-sm">
{`{
  "id": "string",
  "url": "string"
}`}
              </pre>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-clouddrove-dark mb-4">Example Usage</h2>
            <div className="bg-white rounded-2xl p-8 border-2 border-clouddrove-light/30">
              <h3 className="text-lg font-semibold text-clouddrove-dark mb-4">cURL</h3>
              <pre className="bg-clouddrove-light/10 rounded-lg p-4 overflow-x-auto text-sm">
{`curl -X POST https://vanisec.clouddrove.com/api/secrets \\
  -H "Content-Type: application/json" \\
  -d '{
    "secret": "my-secret-api-key",
    "password": "optional-password",
    "expiresIn": 24
  }'`}
              </pre>

              <h3 className="text-lg font-semibold text-clouddrove-dark mb-4 mt-6">JavaScript</h3>
              <pre className="bg-clouddrove-light/10 rounded-lg p-4 overflow-x-auto text-sm">
{`const response = await fetch('https://vanisec.clouddrove.com/api/secrets', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    secret: 'my-secret-api-key',
    password: 'optional-password',
    expiresIn: 24
  })
});

const data = await response.json();
console.log(data.url); // Share this URL`}
              </pre>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-clouddrove-dark mb-4">Rate Limits</h2>
            <div className="bg-gradient-to-br from-clouddrove-light/10 to-clouddrove-dark/10 rounded-2xl p-8 border-2 border-clouddrove-light/30">
              <p className="text-clouddrove-light">
                Presently, the API operates without rate restrictions. We maintain the option to introduce rate limiting subsequently to guarantee equitable usage across all users.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-clouddrove-dark mb-4">Open Source</h2>
            <div className="bg-white rounded-2xl p-8 border-2 border-clouddrove-light/30 text-center">
              <p className="text-clouddrove-light mb-4">
                Vanisec operates as open-source software. You can examine the codebase, participate in development, or deploy your own version.
              </p>
              <a
                href="https://github.com/clouddrove/vanisec"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-gradient-to-r from-clouddrove-dark to-clouddrove-light text-white py-3 px-8 rounded-xl font-semibold hover:from-clouddrove-light hover:to-clouddrove-dark transition-all duration-300 shadow-lg hover:shadow-xl"
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
