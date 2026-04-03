export default function UseCases() {
  const useCases = [
    {
      title: 'IT Professionals',
      description: 'Stop sending SSH keys, server passwords, and access credentials over email or Slack. Share them once via a secure link that disappears the moment it\'s opened.',
      example: 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC7...',
      benefits: [
        'No credentials left sitting in chat history or email threads',
        'Know exactly when a secret was accessed',
        'Enforce least-privilege access patterns across your team',
      ],
    },
    {
      title: 'Developers',
      description: 'Onboarding a new team member? Sharing API keys, database URLs, or environment variables? Skip the insecure clipboard handoff and use a link that works exactly once.',
      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      benefits: [
        'Safely bootstrap new developer environments',
        'Share .env files without long-lived exposure',
        'Keep credentials out of Slack, Notion, and wikis',
      ],
    },
    {
      title: 'Business Teams',
      description: 'Share sensitive contracts, financial data, or client information with external partners without worrying about forwarded emails or screenshots living on forever.',
      example: 'Contract #CN-2024-8472 | Client: Acme Corp',
      benefits: [
        'Protect confidential business information in transit',
        'Stay aligned with GDPR, CCPA, and internal data policies',
        'Give auditors confidence that sensitive data is ephemeral',
      ],
    },
  ]

  return (
    <section className="py-12 md:py-20 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-clouddrove-dark mb-4">Who Uses Vanisec</h2>
          <p className="text-base md:text-lg text-clouddrove-light max-w-2xl mx-auto">
            Trusted by teams who take data security seriously
          </p>
        </div>
        <div className="space-y-10 md:space-y-16">
          {useCases.map((useCase, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start">
              {/* Left Column: Title, Description, Example */}
              <div>
                <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-clouddrove-dark mb-4">
                  {useCase.title}
                </h3>
                <p className="text-lg text-clouddrove-light mb-8 leading-relaxed">
                  {useCase.description}
                </p>
                <div className="bg-clouddrove-light/10 border border-clouddrove-light/30 rounded-lg p-5">
                  <p className="text-xs text-clouddrove-light mb-3 uppercase tracking-wider font-semibold">
                    Example Secret
                  </p>
                  <p className="font-mono text-base text-clouddrove-dark break-all">
                    {useCase.example}
                  </p>
                </div>
              </div>

              {/* Right Column: Key Benefits */}
              <div>
                <h4 className="text-lg md:text-xl font-bold text-clouddrove-dark mb-4 md:mb-6">
                  Key Benefits
                </h4>
                <ul className="space-y-4">
                  {useCase.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <svg
                        className="w-6 h-6 text-clouddrove-dark mt-0.5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-clouddrove-light text-base leading-relaxed">
                        {benefit}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
