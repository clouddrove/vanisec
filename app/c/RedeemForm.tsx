'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CODE_LENGTH, formatCode, normalizeCode } from '@/lib/pairingCode'
import { sealTo } from '@/lib/ecdh'

// One code box, two kinds of code.
//
// A pairing code points at an existing secret and still needs its password. A
// beam code is a device waiting to receive, and needs no password at all. The
// person typing should not have to know which they were handed, so this asks
// the cheap non-destructive question first.
//
// Order matters: /api/beam/peek does not consume anything, while
// /api/pair/redeem is a one-shot GETDEL. Trying peek first is therefore safe;
// the reverse would burn a pairing code just to find out it was not a beam.

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

type Mode = { kind: 'code' } | { kind: 'compose'; code: string; publicKey: string } | { kind: 'sent' }

export default function RedeemForm() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>({ kind: 'code' })
  const [value, setValue] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const tooMany = (response: Response) => {
    const retryAfter = Number(response.headers.get('Retry-After') || 0)
    setError(
      retryAfter
        ? `Too many attempts. Try again in ${Math.ceil(retryAfter / 60)} minutes.`
        : 'Too many attempts. Try again later.'
    )
  }

  const submitCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Checked here as well as on the server so an obviously incomplete code
    // does not spend one of the caller's redeem attempts.
    if (!normalizeCode(value)) {
      setError('That does not look like a complete code')
      return
    }

    setLoading(true)
    try {
      const beam = await fetch('/api/beam/peek', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: value }),
      })
      if (beam.status === 429) return tooMany(beam)
      if (beam.ok) {
        const { publicKey } = await beam.json()
        setMode({ kind: 'compose', code: value, publicKey })
        return
      }

      const redeem = await fetch('/api/pair/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: value }),
      })
      if (redeem.status === 429) return tooMany(redeem)

      const data = await redeem.json()
      if (!redeem.ok) {
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

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    if (mode.kind !== 'compose') return
    setError('')

    if (!message.trim()) {
      setError('Nothing to send')
      return
    }

    setLoading(true)
    try {
      // Sealed to the waiting device's public key, in this browser. The server
      // receives ciphertext and two public keys, which decrypt nothing.
      const sealed = await sealTo(mode.publicKey, JSON.stringify({ text: message }))
      const response = await fetch('/api/beam/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: mode.code, ...sealed }),
      })
      if (response.status === 429) return tooMany(response)

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Could not send to that code')
        return
      }

      setMessage('')
      setMode({ kind: 'sent' })
    } catch {
      setError('Could not send. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const CARD =
    'bg-white/70 backdrop-blur-sm border-2 border-clouddrove-light/30 rounded-2xl p-6 md:p-8 shadow-lg space-y-5'

  if (mode.kind === 'sent') {
    return (
      <div className={`${CARD} text-center`}>
        <p className="text-clouddrove-dark font-semibold">Sent</p>
        <p className="text-sm text-clouddrove-light">
          It should already be on your other device. Nothing was left on the server.
        </p>
        <button
          onClick={() => {
            setValue('')
            setMode({ kind: 'code' })
          }}
          className="w-full bg-gradient-to-r from-clouddrove-dark to-clouddrove-light text-white py-4 px-6 rounded-xl font-semibold hover:from-clouddrove-light hover:to-clouddrove-dark transition-all duration-300 min-h-[48px]"
        >
          Send something else
        </button>
      </div>
    )
  }

  if (mode.kind === 'compose') {
    return (
      <form onSubmit={send} className={CARD}>
        <div>
          <label htmlFor="message" className="block text-sm font-semibold text-clouddrove-dark mb-2">
            Send to {mode.code}
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Paste or type what should appear on the other device"
            rows={6}
            autoFocus
            className="w-full bg-white/60 border-2 border-clouddrove-light/30 rounded-xl px-4 py-3 text-clouddrove-dark focus:outline-none focus:border-clouddrove-light resize-y"
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
          {loading ? 'Sending...' : 'Send'}
        </button>

        <p className="text-xs text-clouddrove-light/80 text-center">
          Encrypted in this browser to the waiting device. No password needed, and
          the server cannot read it.
        </p>
      </form>
    )
  }

  return (
    <form onSubmit={submitCode} className={CARD}>
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
          // A pairing code mixes digits and letters, so inputMode="text" is
          // correct; "numeric" would give phones the wrong keyboard.
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
        {loading ? 'Checking...' : 'Continue'}
      </button>

      <p className="text-xs text-clouddrove-light/80 text-center">
        Codes work once and expire after five minutes.{' '}
        <a href="/r" className="underline underline-offset-2 hover:text-clouddrove-dark">
          Receive on this device instead
        </a>
      </p>
    </form>
  )
}
