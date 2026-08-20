'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CODE_LENGTH, formatCode, normalizeCode } from '@/lib/pairingCode'

// The receiving half of pairing. Exchanges a typed code for the secret id and
// hands off to the normal password-gated retrieval page, which is unchanged.

// Shapes what is typed into 4F2K-9QX1 as it goes in, so the field always looks
// like the code being copied from the other screen. Folding to the canonical
// alphabet happens on submit, in normalizeCode.
function displayValue(raw: string): string {
  const cleaned = raw
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, '')
    .slice(0, CODE_LENGTH)
  return cleaned.length > 4 ? formatCode(cleaned) : cleaned
}

export default function RedeemForm() {
  const router = useRouter()
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Checked here as well as on the server so an obviously incomplete code
    // does not spend one of the caller's ten redeem attempts.
    if (!normalizeCode(value)) {
      setError('That does not look like a complete code')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/pair/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: value }),
      })
      const data = await response.json()

      if (response.status === 429) {
        const retryAfter = Number(response.headers.get('Retry-After') || 0)
        setError(
          retryAfter
            ? `Too many attempts. Try again in ${Math.ceil(retryAfter / 60)} minutes.`
            : 'Too many attempts. Try again later.'
        )
        return
      }
      if (!response.ok) {
        setError(data.error || 'That code has expired or has already been used')
        return
      }

      // replace, not push: the code must not sit in browser history, and there
      // is nothing to come back to since it has now been spent.
      router.replace(`/secret/${data.id}`)
    } catch {
      setError('Could not reach Vanisec. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white/70 backdrop-blur-sm border-2 border-clouddrove-light/30 rounded-2xl p-6 md:p-8 shadow-lg space-y-5">
      <div>
        <label htmlFor="code" className="block text-sm font-semibold text-clouddrove-dark mb-2">
          Pairing code
        </label>
        <input
          id="code"
          name="code"
          type="text"
          value={value}
          onChange={(e) => setValue(displayValue(e.target.value))}
          placeholder="XXXX-XXXX"
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="characters"
          spellCheck={false}
          // A pairing code is a mix of digits and letters, so inputMode="text"
          // is correct; "numeric" would give phones the wrong keyboard.
          inputMode="text"
          className="w-full bg-white/60 border-2 border-clouddrove-light/30 rounded-xl px-4 py-4 text-center font-mono font-bold tracking-[0.2em] text-2xl md:text-3xl text-clouddrove-dark placeholder:text-clouddrove-light/40 placeholder:tracking-normal placeholder:text-lg focus:outline-none focus:border-clouddrove-light min-h-[64px]"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 text-center" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-clouddrove-dark to-clouddrove-light text-white py-4 px-6 rounded-xl font-semibold hover:from-clouddrove-light hover:to-clouddrove-dark transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg min-h-[48px]"
      >
        {loading ? 'Checking...' : 'Open secret'}
      </button>

      <p className="text-xs text-clouddrove-light/80 text-center">
        Codes work once and expire after five minutes.
      </p>
    </form>
  )
}
