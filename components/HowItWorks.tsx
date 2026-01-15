export default function HowItWorks() {
  const steps = [
    {
      number: '1',
      title: 'Create a Secret',
      description: 'Input your confidential data and produce a protected single-use URL',
    },
    {
      number: '2',
      title: 'Share the Link',
      description: 'Distribute the protected URL via any communication method',
    },
    {
      number: '3',
      title: 'Gone Forever',
      description: "The recipient accesses the confidential data once, then it's completely removed",
    },
  ]

  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-clouddrove-dark mb-4">How It Works</h2>
          <p className="text-lg text-clouddrove-light max-w-2xl mx-auto">
            Exchange your data once, then it's completely removed
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="relative mb-8">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-clouddrove-dark to-clouddrove-light rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                  {step.number}
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-clouddrove-light to-clouddrove-dark/20 transform translate-x-6"></div>
                )}
              </div>
              <h3 className="text-2xl font-bold text-clouddrove-dark mb-4">{step.title}</h3>
              <p className="text-clouddrove-light text-base leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
