'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

export default function Header() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (path: string) => pathname === path

  const navLinks = [
    { href: '/', label: 'Home' },
    // For someone who reached the site before their code, rather than typing
    // /c straight in as the sending device tells them to.
    { href: '/c', label: 'Enter Code' },
    { href: '/about', label: 'About' },
    { href: '/security', label: 'Security' },
    { href: '/docs', label: 'Documentation' },
    { href: '/api', label: 'API' },
    { href: '/mcp', label: 'MCP' },
    { href: '/integrations', label: 'Integrations' },
    { href: '/faq', label: 'FAQ' },
  ]

  return (
    <header className="bg-white border-b-2 border-clouddrove-light sticky top-0 z-50 backdrop-blur-sm bg-white/95">
      <nav className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity" aria-label="Vanisec home">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-clouddrove-dark to-clouddrove-light flex items-center justify-center shadow-lg" aria-hidden="true">
              <span className="text-white text-xl font-bold">V</span>
            </div>
            <span className="text-clouddrove-dark font-bold text-xl">Vanisec</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? 'text-clouddrove-dark'
                    : 'text-clouddrove-light hover:text-clouddrove-dark'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/contact"
              className="bg-gradient-to-r from-clouddrove-dark to-clouddrove-light text-white px-4 py-2 rounded-lg text-sm font-semibold hover:from-clouddrove-light hover:to-clouddrove-dark transition-all duration-300"
            >
              Contact
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-clouddrove-dark p-2"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t-2 border-clouddrove-light pt-4">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-base font-medium transition-colors py-3 px-2 rounded-lg min-h-[44px] flex items-center ${
                    isActive(link.href)
                      ? 'text-clouddrove-dark bg-clouddrove-light/10'
                      : 'text-clouddrove-light hover:text-clouddrove-dark hover:bg-clouddrove-light/5'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="bg-gradient-to-r from-clouddrove-dark to-clouddrove-light text-white px-4 py-3 rounded-lg text-sm font-semibold hover:from-clouddrove-light hover:to-clouddrove-dark transition-all duration-300 text-center mt-2 min-h-[44px] flex items-center justify-center"
              >
                Contact
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}

