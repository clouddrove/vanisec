'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { generateEphemeralKeyPair, openSealed } from '@/lib/ecdh'

// The waiting half of a passwordless handoff.
//
// This page makes a keypair, publishes only the public half under a short code,
// and waits. Whatever comes back was sealed to that key, so this browser is the
// only thing on earth that can read it. That is what replaces the password.

const POLL_MS = 2000

type Phase = 'starting' | 'waiting' | 'received' | 'expired' | 'error'

function mmss(total: number): string {
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function ReceiveView() {
  const [phase, setPhase] = useState<Phase>('starting')
  const [code, setCode] = useState('')
  const [remaining, setRemaining] = useState(0)
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  // The private key never goes into state that could be serialised, and the
  // token never leaves this component.
  const privateKey = useRef<CryptoKey | null>(null)
  const token = useRef('')
  const codeRef = useRef('')

  // Split in two on purpose. openBeam touches state only after an await, so the
  // mount effect can call it without setting state synchronously during render.
  // start() adds the synchronous reset and is what the buttons use, where that
  // is fine.
  const openBeam = useCallback(async () => {
    try {
      const pair = await generateEphemeralKeyPair()
      privateKey.current = pair.privateKey

      const response = await fetch('/api/beam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicKey: pair.publicKeyB64 }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Could not get a code')
        setPhase('error')
        return
      }

      setCode(data.code)
      codeRef.current = data.code
      token.current = data.token
      setRemaining(data.expiresIn)
      setPhase('waiting')
    } catch {
      setError('Could not get a code. Your browser may not support this.')
      setPhase('error')
    }
  }, [])

  const start = useCallback(() => {
    setPhase('starting')
    setError('')
    setText('')
    void openBeam()
  }, [openBeam])

  // Requesting the code on mount rather than behind a button: someone opening
  // /r is here to receive now, and an extra tap on a phone buys nothing.
  //
  // The lint rule cannot see that openBeam awaits key generation and a fetch
  // before it touches state, so the cascading render it guards against does not
  // happen here.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void openBeam()
  }, [openBeam])

  // Drop the beam when the tab goes away, rather than leaving a live address
  // sitting there for the rest of its five minutes.
  useEffect(() => {
    const release = () => {
      if (!codeRef.current || !token.current) return
      const body = JSON.stringify({ code: codeRef.current, token: token.current, cancel: true })
      navigator.sendBeacon?.('/api/beam/poll', new Blob([body], { type: 'application/json' }))
    }
    window.addEventListener('pagehide', release)
    return () => window.removeEventListener('pagehide', release)
  }, [])

  useEffect(() => {
    if (phase !== 'waiting') return

    let stop = false
    const tick = async () => {
      try {
        const response = await fetch('/api/beam/poll', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: codeRef.current, token: token.current }),
        })
        if (stop) return

        if (response.status === 404) {
          setPhase('expired')
          return
        }
        if (!response.ok) return // transient, including 429; the next tick retries

        const data = await response.json()
        if (data.waiting) return

        const plain = await openSealed(privateKey.current!, {
          ciphertext: data.ciphertext,
          iv: data.iv,
          senderPublicKey: data.senderPublicKey,
        })
        if (stop) return
        setText(JSON.parse(plain).text ?? '')
        setPhase('received')
      } catch {
        // Network blips are expected while a phone is waiting. Keep polling;
        // the countdown is what ends this, not a single failed request.
      }
    }

    const poll = setInterval(tick, POLL_MS)
    return () => {
      stop = true
      clearInterval(poll)
    }
  }, [phase])

  useEffect(() => {
    if (phase !== 'waiting' || remaining <= 0) return
    const timer = setInterval(() => {
      setRemaining((s) => {
        if (s <= 1) {
          setPhase('expired')
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [phase, remaining])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Could not copy. Select the text and copy it manually.')
    }
  }

  const CARD =
    'bg-white/70 backdrop-blur-sm border-2 border-clouddrove-light/30 rounded-2xl p-6 md:p-8 shadow-lg'

  if (phase === 'received') {
    return (
      <div className={CARD}>
        <p className="text-sm font-semibold text-clouddrove-dark mb-3">Received</p>
        <pre className="bg-white/60 border-2 border-clouddrove-light/30 rounded-xl p-4 mb-4 text-clouddrove-dark text-sm font-mono whitespace-pre-wrap break-words max-h-80 overflow-y-auto">
{text}
        </pre>
        <button
          onClick={copy}
          className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300 min-h-[48px] ${
            copied
              ? 'bg-green-500 text-white'
              : 'bg-gradient-to-r from-clouddrove-dark to-clouddrove-light text-white hover:from-clouddrove-light hover:to-clouddrove-dark'
          }`}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
        {error && <p className="mt-3 text-sm text-red-600 text-center">{error}</p>}
        <p className="mt-4 text-xs text-clouddrove-light/80 text-center">
          This was decrypted in your browser and is already gone from the server.
        </p>
        <button
          onClick={start}
          className="mt-4 w-full text-sm font-semibold text-clouddrove-dark hover:text-clouddrove-light underline underline-offset-4 min-h-[44px]"
        >
          Receive something else
        </button>
      </div>
    )
  }

  if (phase === 'expired' || phase === 'error') {
    return (
      <div className={`${CARD} text-center`}>
        <p className="text-clouddrove-dark font-semibold mb-2">
          {phase === 'expired' ? 'That code expired' : 'Something went wrong'}
        </p>
        <p className="text-sm text-clouddrove-light mb-5">
          {phase === 'expired'
            ? 'Codes last five minutes so an unused one cannot sit around.'
            : error}
        </p>
        <button
          onClick={start}
          className="w-full bg-gradient-to-r from-clouddrove-dark to-clouddrove-light text-white py-4 px-6 rounded-xl font-semibold hover:from-clouddrove-light hover:to-clouddrove-dark transition-all duration-300 min-h-[48px]"
        >
          Get a new code
        </button>
      </div>
    )
  }

  return (
    <div className={`${CARD} text-center`}>
      {phase === 'starting' ? (
        <p className="text-clouddrove-light py-8">Getting a code...</p>
      ) : (
        <>
          <p className="text-sm text-clouddrove-light mb-4">
            On your other device, open{' '}
            <span className="font-mono font-semibold text-clouddrove-dark">
              {typeof window === 'undefined' ? '' : window.location.host}/c
            </span>{' '}
            and enter
          </p>
          <p className="font-mono font-bold tracking-[0.2em] text-3xl md:text-4xl text-clouddrove-dark mb-4">
            {code}
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-clouddrove-light">
            <span className="inline-block w-2 h-2 rounded-full bg-clouddrove-light animate-pulse" />
            Waiting. Expires in {mmss(remaining)}
          </div>
          <p className="mt-5 text-xs text-clouddrove-light/80">
            No password needed. This device made a key that never left it, so only
            it can read what arrives.
          </p>
        </>
      )}
    </div>
  )
}
