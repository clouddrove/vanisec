export default function HowItWorks() {
  const steps = [
    {
      number: '1',
      title: 'Create a Secret',
      description: 'Enter your sensitive information and generate a secure one-time link. Optionally add password protection and set expiration time.',
    },
    {
      number: '2',
      title: 'Share the Link',
      description: 'Send the secure link through any messaging platform, email, or communication channel. The link is unique and unguessable.',
    },
    {
      number: '3',
      title: 'Gone Forever',
      description: 'Recipient views the secret once, then it is permanently deleted from our servers. No copies, no traces, no recovery.',
    },
  ]

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-white to-clouddrove-light/5">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-clouddrove-dark mb-4">How It Works</h2>
          <p className="text-lg text-clouddrove-light max-w-2xl mx-auto">
            Share your information once, then it's permanently deleted
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="relative mb-6">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-clouddrove-dark to-clouddrove-light rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                  {step.number}
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-clouddrove-light to-clouddrove-dark/20 transform translate-x-4"></div>
                )}
              </div>
              <h3 className="text-2xl font-semibold text-clouddrove-dark mb-3">{step.title}</h3>
              <p className="text-clouddrove-light">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

