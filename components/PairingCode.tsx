'use client'

import { useCallback, useEffect, useState } from 'react'

// The sender half of pairing: turns a freshly created secret into a short code
// someone can read off this screen and type into another device.
//
// The code is minted on click, not when the secret is created. It lives for
// five minutes, and starting that clock for everyone would mean most codes were
// dead before anyone looked at them, since most people just copy the link.

interface Props {
  secretId: string
}

function mmss(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export default function PairingCode({ secretId }: Props) {
  const [code, setCode] = useState('')
  const [remaining, setRemaining] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const request = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: secretId }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Could not create a pairing code')
        return
      }
      setCode(data.code)
      setRemaining(data.expiresIn)
    } catch {
      setError('Could not create a pairing code')
    } finally {
      setLoading(false)
    }
  }, [secretId])

  // Counts the code down to nothing rather than leaving a dead one on screen
  // looking usable.
  useEffect(() => {
    if (remaining <= 0) return
    const timer = setInterval(() => setRemaining((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(timer)
  }, [remaining])

  const expired = code !== '' && remaining <= 0

  if (!code) {
    return (
      <div className="text-center">
        <button
          onClick={request}
          disabled={loading}
          className="text-sm font-semibold text-clouddrove-dark hover:text-clouddrove-light underline underline-offset-4 transition-colors disabled:opacity-50 min-h-[44px] px-2"
        >
          {loading ? 'Creating a code...' : 'Show a pairing code for another device'}
        </button>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    )
  }

  return (
    <div className="bg-clouddrove-dark/5 border-2 border-clouddrove-light/30 rounded-xl p-5 text-center backdrop-blur-sm">
      <p className="text-sm text-clouddrove-light mb-3">
        On the other device, open{' '}
        <span className="font-mono font-semibold text-clouddrove-dark">
          {typeof window === 'undefined' ? '' : window.location.host}/c
        </span>{' '}
        and enter
      </p>

      <p
        className={`font-mono font-bold tracking-[0.2em] text-3xl md:text-4xl mb-3 ${
          expired ? 'text-clouddrove-light/40 line-through' : 'text-clouddrove-dark'
        }`}
      >
        {code}
      </p>

      {expired ? (
        <button
          onClick={request}
          className="text-sm font-semibold text-clouddrove-dark hover:text-clouddrove-light underline underline-offset-4 min-h-[44px] px-2"
        >
          Code expired. Get a new one
        </button>
      ) : (
        <p className="text-sm text-clouddrove-light">
          Expires in {mmss(remaining)}. It works once, and the password is still needed.
        </p>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}
