export default function Features() {
  const features = [
    {
      title: 'Password Protection',
      description: 'Add an optional passphrase to your secret for an extra layer of security. Only recipients who know the passphrase can unlock the content.',
      icon: (
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-clouddrove-dark to-clouddrove-light flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
      ),
    },
    {
      title: 'Self-Destructing Links',
      description: 'Once viewed or expired, your secret is permanently deleted from our servers. The link dies instantly — no residual data, no way to retrieve it.',
      icon: (
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-clouddrove-dark to-clouddrove-light flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
      ),
    },
    {
      title: 'Automatic Expiration',
      description: 'Set a TTL from 1 hour up to 7 days. Secrets are automatically purged when the timer runs out, whether or not they were ever opened.',
      icon: (
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-clouddrove-dark to-clouddrove-light flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      ),
    },
    {
      title: 'Compliance Ready',
      description: 'Designed to help teams meet SOC 2, GDPR, CCPA, and HIPAA requirements for sensitive data handling and privacy protection.',
      icon: (
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-clouddrove-dark to-clouddrove-light flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
      ),
    },
    {
      title: 'File Upload',
      description: 'Attach files up to 5MB alongside your secret text. Share documents, keys, or configs through the same secure one-time link.',
      icon: (
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-clouddrove-dark to-clouddrove-light flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
      ),
    },
    {
      title: 'Use it from Claude',
      description: 'Share a secret straight from your AI client with the Vanisec MCP server. Generated credentials never enter the conversation.',
      icon: (
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-clouddrove-dark to-clouddrove-light flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l-3 3 3 3m8-6l3 3-3 3M14 4l-4 16" />
          </svg>
        </div>
      ),
    },
  ]

  return (
    <section className="py-12 md:py-20 px-4 bg-gradient-to-b from-white to-clouddrove-light/5">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-clouddrove-dark mb-4">Key Features</h2>
          <p className="text-base md:text-lg text-clouddrove-light max-w-2xl mx-auto">
            Everything you need to share sensitive information safely — without the risk of it living on forever
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 border-2 border-clouddrove-light/30 hover:border-clouddrove-dark/50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <div className="mb-6 flex justify-center">{feature.icon}</div>
              <h3 className="text-xl font-bold text-clouddrove-dark mb-3 text-center">{feature.title}</h3>
              <p className="text-clouddrove-light text-center leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
