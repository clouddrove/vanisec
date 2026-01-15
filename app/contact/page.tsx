import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Reach out to the Tessera team. We welcome feedback, inquiries, and suggestions.',
}

export default function ContactPage() {
  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-clouddrove-dark mb-4">Contact Us</h1>
          <p className="text-xl text-clouddrove-light max-w-2xl mx-auto">
            We appreciate hearing from you. Send us a message and we'll respond promptly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-2xl p-8 border-2 border-clouddrove-light/30">
            <h2 className="text-2xl font-bold text-clouddrove-dark mb-4">GitHub</h2>
            <p className="text-clouddrove-light mb-4">
              Report issues, submit feature requests, or contribute to the project development.
            </p>
            <a
              href="https://github.com/clouddrove/tessera"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-gradient-to-r from-clouddrove-dark to-clouddrove-light text-white py-3 px-6 rounded-xl font-semibold hover:from-clouddrove-light hover:to-clouddrove-dark transition-all duration-300"
            >
              Visit GitHub
            </a>
          </div>

          <div className="bg-white rounded-2xl p-8 border-2 border-clouddrove-light/30">
            <h2 className="text-2xl font-bold text-clouddrove-dark mb-4">Documentation</h2>
            <p className="text-clouddrove-light mb-4">
              Explore our documentation for comprehensive guides and API reference materials.
            </p>
            <a
              href="/docs"
              className="inline-block bg-gradient-to-r from-clouddrove-dark to-clouddrove-light text-white py-3 px-6 rounded-xl font-semibold hover:from-clouddrove-light hover:to-clouddrove-dark transition-all duration-300"
            >
              View Docs
            </a>
          </div>
        </div>

        <div className="bg-gradient-to-br from-clouddrove-light/10 to-clouddrove-dark/10 rounded-2xl p-8 border-2 border-clouddrove-light/30">
          <h2 className="text-2xl font-bold text-clouddrove-dark mb-4">Feedback & Support</h2>
          <p className="text-clouddrove-light mb-6">
            For feedback, questions, or support assistance, please open an issue on our GitHub repository. We actively monitor and respond to all issues and pull requests.
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-clouddrove-dark mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="font-semibold text-clouddrove-dark mb-1">Bug Reports</h3>
                <p className="text-clouddrove-light">Discovered a bug? Report it on GitHub with comprehensive details.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-clouddrove-dark mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <div>
                <h3 className="font-semibold text-clouddrove-dark mb-1">Feature Requests</h3>
                <p className="text-clouddrove-light">Have a feature idea? We welcome suggestions! Submit a feature request on GitHub.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-clouddrove-dark mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="font-semibold text-clouddrove-dark mb-1">Security Issues</h3>
                <p className="text-clouddrove-light">Discovered a security vulnerability? Report it responsibly through GitHub security advisories.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
