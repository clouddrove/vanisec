import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-white border-t-2 border-clouddrove-light mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Column 1: Services */}
          <div>
            <h3 className="text-clouddrove-dark font-semibold mb-4 text-sm uppercase">
              Services
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-clouddrove-light hover:text-clouddrove-dark transition-colors">
                  Tessera
                </Link>
              </li>
              <li>
                <Link href="/api" className="text-clouddrove-light hover:text-clouddrove-dark transition-colors">
                  API Documentation
                </Link>
              </li>
              <li>
                <Link href="/security" className="text-clouddrove-light hover:text-clouddrove-dark transition-colors">
                  Security
                </Link>
              </li>
              <li>
                <Link href="/features" className="text-clouddrove-light hover:text-clouddrove-dark transition-colors">
                  Features
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Resources */}
          <div>
            <h3 className="text-clouddrove-dark font-semibold mb-4 text-sm uppercase">
              Resources
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/blog" className="text-clouddrove-light hover:text-clouddrove-dark transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/docs" className="text-clouddrove-light hover:text-clouddrove-dark transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-clouddrove-light hover:text-clouddrove-dark transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <a href="/sitemap.xml" className="text-clouddrove-light hover:text-clouddrove-dark transition-colors">
                  Sitemap
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Company */}
          <div>
            <h3 className="text-clouddrove-dark font-semibold mb-4 text-sm uppercase">
              Company
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-clouddrove-light hover:text-clouddrove-dark transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-clouddrove-light hover:text-clouddrove-dark transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-clouddrove-light hover:text-clouddrove-dark transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/news" className="text-clouddrove-light hover:text-clouddrove-dark transition-colors">
                  News
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal */}
          <div>
            <h3 className="text-clouddrove-dark font-semibold mb-4 text-sm uppercase">
              Legal
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms" className="text-clouddrove-light hover:text-clouddrove-dark transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-clouddrove-light hover:text-clouddrove-dark transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/data-privacy" className="text-clouddrove-light hover:text-clouddrove-dark transition-colors">
                  Data Privacy
                </Link>
              </li>
              <li>
                <Link href="/equal-opportunity" className="text-clouddrove-light hover:text-clouddrove-dark transition-colors">
                  Equal Opportunity
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t-2 border-clouddrove-light pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Copyright */}
            <div className="text-clouddrove-light text-sm">
              © {currentYear} CloudDrove. All rights reserved.
            </div>

            {/* Legal Links */}
            <div className="flex flex-wrap gap-4 justify-center text-sm">
              <Link href="/terms" className="text-clouddrove-light hover:text-clouddrove-dark transition-colors">
                Terms
              </Link>
              <Link href="/privacy" className="text-clouddrove-light hover:text-clouddrove-dark transition-colors">
                Privacy
              </Link>
              <Link href="/data-privacy" className="text-clouddrove-light hover:text-clouddrove-dark transition-colors">
                Employee Data Privacy
              </Link>
              <Link href="/equal-opportunity" className="text-clouddrove-light hover:text-clouddrove-dark transition-colors">
                Equal Opportunity
              </Link>
              <a href="/sitemap.xml" className="text-clouddrove-light hover:text-clouddrove-dark transition-colors">
                Sitemap
              </a>
            </div>

            {/* Global Presence */}
            <div className="flex items-center gap-2 text-sm text-clouddrove-light">
              <span>Global Presence:</span>
              <div className="flex gap-1">
                <span title="United States" className="text-lg">🇺🇸</span>
                <span title="Canada" className="text-lg">🇨🇦</span>
                <span title="Mexico" className="text-lg">🇲🇽</span>
                <span title="Argentina" className="text-lg">🇦🇷</span>
                <span title="Chile" className="text-lg">🇨🇱</span>
                <span title="India" className="text-lg">🇮🇳</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

