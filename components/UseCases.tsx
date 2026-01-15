export default function UseCases() {
  const useCases = [
    {
      title: 'IT Professionals',
      description: 'Securely share credentials and access information with your team. Prevent credential leaks in email and chat logs.',
      example: 'prod_api_token_51H7xYz9A2bC3dE4fG',
      benefits: [
        'Prevent credential leaks in email and chat logs',
        'Audit when secrets are accessed',
        'Enforce security protocols for sensitive information',
      ],
    },
    {
      title: 'Developers',
      description: 'Share API keys, database credentials, and configuration secrets during onboarding or team collaboration.',
      example: 'DATABASE_URL=postgresql://...',
      benefits: [
        'Secure onboarding process',
        'Share configuration safely',
        'No permanent storage of credentials',
      ],
    },
    {
      title: 'Business Teams',
      description: 'Share sensitive business information, financial data, or confidential documents with partners and clients.',
      example: 'Q4 Revenue: $2.5M',
      benefits: [
        'Protect confidential business data',
        'Comply with data privacy regulations',
        'Secure communication channel',
      ],
    },
  ]

  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-clouddrove-dark mb-4">Security for Professionals</h2>
          <p className="text-lg text-clouddrove-light max-w-2xl mx-auto">
            See how professionals use secure links in their daily workflows
          </p>
        </div>
        <div className="space-y-12">
          {useCases.map((useCase, index) => (
            <div
              key={index}
              className="glass-effect rounded-xl p-8 border border-clouddrove-light/20"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-2xl font-semibold text-clouddrove-dark mb-4">{useCase.title}</h3>
                  <p className="text-clouddrove-light mb-6">{useCase.description}</p>
                  <div className="bg-clouddrove-light/10 border border-clouddrove-light/30 rounded-lg p-4 mb-6">
                    <p className="text-xs text-clouddrove-light mb-2 uppercase tracking-wide">Example Secret</p>
                    <p className="font-mono text-sm text-clouddrove-dark break-all">{useCase.example}</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-clouddrove-dark mb-4">Key Benefits</h4>
                  <ul className="space-y-3">
                    {useCase.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-clouddrove-dark mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-clouddrove-light">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <div className="glass-effect rounded-xl p-6 border border-clouddrove-light/20 inline-block">
            <p className="text-clouddrove-dark font-semibold mb-2">Your secrets are encrypted, never stored in logs, and automatically deleted after viewing.</p>
          </div>
        </div>
      </div>
    </section>
  )
}

