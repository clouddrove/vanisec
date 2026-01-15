import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-white border-t-2 border-clouddrove-light mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-8">
          {/* Column 1: Brand and Description */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-clouddrove-dark to-clouddrove-light flex items-center justify-center shadow-lg">
                <span className="text-white text-2xl font-bold">V</span>
              </div>
              <span className="text-clouddrove-dark font-bold text-xl">Vanisec</span>
            </div>
            <p className="text-clouddrove-light text-sm leading-relaxed">
              A trusted way to share sensitive information that self-destructs after being viewed.
            </p>
          </div>

          {/* Column 2: Company */}
          <div>
            <h3 className="text-clouddrove-dark font-semibold mb-4 text-sm uppercase tracking-wide">
              Company
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/about" className="text-clouddrove-light hover:text-clouddrove-dark transition-colors">
                  About
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Resources */}
          <div>
            <h3 className="text-clouddrove-dark font-semibold mb-4 text-sm uppercase tracking-wide">
              Resources
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a 
                  href="https://github.com/clouddrove/vanisec" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-clouddrove-light hover:text-clouddrove-dark transition-colors"
                >
                  GitHub
                </a>
              </li>
              <li>
                <Link href="/docs" className="text-clouddrove-light hover:text-clouddrove-dark transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/api" className="text-clouddrove-light hover:text-clouddrove-dark transition-colors">
                  API
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t-2 border-clouddrove-light pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Copyright */}
            <div className="text-clouddrove-light text-sm">
              © {currentYear} Vanisec. All rights reserved.
            </div>

            {/* Legal Links */}
            <div className="flex flex-wrap gap-4 justify-center text-sm">
              <Link href="/privacy" className="text-clouddrove-light hover:text-clouddrove-dark transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-clouddrove-light hover:text-clouddrove-dark transition-colors">
                Terms
              </Link>
              <Link href="/security" className="text-clouddrove-light hover:text-clouddrove-dark transition-colors">
                Security
              </Link>
              <Link href="/contact" className="text-clouddrove-light hover:text-clouddrove-dark transition-colors">
                Feedback
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
