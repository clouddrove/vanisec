export default function UseCases() {
  const useCases = [
    {
      title: 'IT Professionals',
      description: 'Exchange access credentials and authentication details with colleagues safely. Eliminate credential exposure risks in email threads and messaging platforms.',
      example: 'prod_api_token_51H7xYz9A2bC3dE4fG',
      benefits: [
        'Eliminate credential exposure risks in email threads and messaging platforms',
        'Monitor when confidential data gets accessed',
        'Implement security policies for sensitive data handling',
      ],
    },
    {
      title: 'Developers',
      description: 'Exchange API credentials, database connection strings, and configuration parameters during team integration or collaborative projects.',
      example: 'DATABASE_URL=postgresql://...',
      benefits: [
        'Streamline secure team integration workflows',
        'Exchange configuration parameters safely',
        'Avoid long-term credential storage',
      ],
    },
    {
      title: 'Business Teams',
      description: 'Exchange proprietary business intelligence, financial metrics, or sensitive documents with external partners and stakeholders.',
      example: 'Q4 Revenue: $2.5M',
      benefits: [
        'Safeguard proprietary business intelligence',
        'Maintain adherence to data protection regulations',
        'Establish protected communication pathways',
      ],
    },
  ]

  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="space-y-16">
          {useCases.map((useCase, index) => (
            <div key={index} className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              {/* Left Column: Title, Description, Example */}
              <div>
                <h3 className="text-3xl md:text-4xl font-bold text-clouddrove-dark mb-4">
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
                <h4 className="text-xl font-bold text-clouddrove-dark mb-6">
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
