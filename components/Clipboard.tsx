'use client'

import { useEffect, useState } from 'react'
import qrcode from 'qrcode-generator'
import { normalizeClipCode, sealClip, openClip, CLIP_TTL_SECONDS } from '@/lib/clipCode'

// One box, both directions. Type text and get a code, or type a code and get
// text back. Deliberately a single page: the whole point is that this is faster
// than thinking about it.
//
// The code is four digits, so it cannot be the key: see lib/clipCode.ts. The
// key travels to the server with the ciphertext, which means Vanisec can read a
// clip while it exists. The page says so rather than leaving people to assume
// otherwise from the rest of the site.

// The QR is the point of the short code: a phone scans it and types nothing.
// Encoded as a fragment so the code never appears in a request line or a server
// log when the page is opened.
function qrSvg(text: string): string {
  const qr = qrcode(0, 'M')
  qr.addData(text)
  qr.make()
  return qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true })
}

const MAX_FILE_SIZE = 5 * 1024 * 1024

async function fileToBase64(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  let bin = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)))
  }
  return btoa(bin)
}

function base64ToBlobUrl(b64: string, type: string): string {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i)
  return URL.createObjectURL(new Blob([bytes], { type: type || 'application/octet-stream' }))
}

interface ReceivedFile {
  name: string
  type: string
  data: string
}

export default function Clipboard() {
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const [code, setCode] = useState('')
  const [remaining, setRemaining] = useState(0)
  const [codeInput, setCodeInput] = useState('')

  const [received, setReceived] = useState<ReceivedFile | null>(null)
  const [busy, setBusy] = useState<'' | 'saving' | 'opening'>('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<'' | 'text' | 'code'>('')

  const save = async () => {
    setError('')
    if (!text.trim() && !file) {
      setError('Nothing to save yet')
      return
    }
    if (file && file.size > MAX_FILE_SIZE) {
      setError('File is larger than 5MB')
      return
    }

    setBusy('saving')
    try {
      const envelope = JSON.stringify({
        text,
        file: file
          ? { name: file.name, type: file.type, data: await fileToBase64(file) }
          : null,
      })
      const sealed = await sealClip(envelope)

      const response = await fetch('/api/clip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sealed),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(data.error || 'Could not save')
        return
      }

      const { code: fresh } = await response.json()
      setCode(fresh)
      setRemaining(CLIP_TTL_SECONDS)
    } catch {
      setError('Could not save. Your browser may not support this.')
    } finally {
      setBusy('')
    }
  }

  const open = async () => {
    setError('')
    const normalized = normalizeClipCode(codeInput)
    if (!normalized) {
      setError('That does not look like a complete code')
      return
    }
    await openWithCode(normalized)
  }

  const openWithCode = async (normalized: string) => {
    setError('')
    setBusy('opening')
    try {
      const response = await fetch('/api/clip/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: normalized }),
      })

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
        const data = await response.json().catch(() => ({}))
        setError(data.error || 'That code has expired or has already been used')
        return
      }

      const data = await response.json()
      const envelope = JSON.parse(await openClip(data))

      setText(envelope.text ?? '')
      setReceived(envelope.file ?? null)
      setCodeInput('')
      setCode('')
    } catch {
      // A wrong code fails here rather than at the server, because AES-GCM
      // rejects a key it was not sealed with.
      setError('That code did not work')
    } finally {
      setBusy('')
    }
  }

  // A QR scan lands here with the code in the fragment. The fragment is cleared
  // immediately: it is a live capability for five minutes, and leaving it in the
  // address bar puts it in history and in anything the user later shares.
  useEffect(() => {
    const fromQr = normalizeClipCode(window.location.hash.replace('#', ''))
    if (!fromQr) return
    history.replaceState(null, '', window.location.pathname)
    // Both of these reach state, but only after the effect has returned, so the
    // cascading render the rule guards against does not happen. Runs once on
    // mount by design: re-firing a scan on every render would spend the clip.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCodeInput(fromQr)
    void openWithCode(fromQr)
  }, [])

  // A dead code left on screen looks usable, and five minutes is short enough
  // that people will hit it.
  useEffect(() => {
    if (remaining <= 0) return
    const timer = setInterval(() => setRemaining((n) => Math.max(0, n - 1)), 1000)
    return () => clearInterval(timer)
  }, [remaining])

  const copy = async (value: string, which: 'text' | 'code') => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(which)
      setTimeout(() => setCopied(''), 2000)
    } catch {
      setError('Could not copy. Select it and copy manually.')
    }
  }

  const clear = () => {
    setText('')
    setFile(null)
    setCode('')
    setReceived(null)
    setError('')
    const input = document.getElementById('clip-file') as HTMLInputElement | null
    if (input) input.value = ''
  }

  return (
    <div className="space-y-4">
      <div className="bg-white/70 backdrop-blur-sm border-2 border-clouddrove-light/30 rounded-2xl p-4 md:p-6 shadow-lg">
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            if (code) setCode('')
          }}
          placeholder="Text goes here"
          rows={10}
          className="w-full bg-transparent text-clouddrove-dark placeholder:text-clouddrove-light/50 focus:outline-none resize-y"
        />

        <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-clouddrove-light/20 text-sm">
          <button
            onClick={() => copy(text, 'text')}
            disabled={!text}
            className="font-semibold text-clouddrove-dark hover:text-clouddrove-light disabled:opacity-40 min-h-[44px]"
          >
            {copied === 'text' ? 'Copied' : 'Copy'}
          </button>
          <button
            onClick={clear}
            className="font-semibold text-red-600 hover:text-red-700 min-h-[44px]"
          >
            Clear
          </button>
          <span className="ml-auto text-clouddrove-light/70">{text.length} characters</span>
        </div>
      </div>

      {received && (
        <div className="bg-white/70 border-2 border-clouddrove-light/30 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-sm text-clouddrove-dark font-semibold truncate">{received.name}</span>
          <a
            href={base64ToBlobUrl(received.data, received.type)}
            download={received.name}
            className="ml-auto shrink-0 text-sm font-semibold text-clouddrove-dark underline underline-offset-4"
          >
            Download
          </a>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-white/70 backdrop-blur-sm border-2 border-clouddrove-light/30 rounded-2xl p-4 md:p-6 space-y-3">
          <p className="text-sm font-semibold text-clouddrove-dark">Save and get a code</p>

          <div className="flex flex-wrap items-center gap-3">
            <input
              id="clip-file"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-sm text-clouddrove-light file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-clouddrove-dark/10 file:text-clouddrove-dark file:font-semibold"
            />
          </div>

          <button
            onClick={save}
            disabled={busy !== ''}
            className="w-full bg-gradient-to-r from-clouddrove-dark to-clouddrove-light text-white py-3 px-6 rounded-xl font-semibold hover:from-clouddrove-light hover:to-clouddrove-dark transition-all duration-300 disabled:opacity-50 min-h-[48px]"
          >
            {busy === 'saving' ? 'Saving...' : 'Save'}
          </button>

          {code && (
            <div className="text-center pt-2">
              <p className="text-xs text-clouddrove-light mb-1">Enter this on the other device</p>
              <button
                onClick={() => copy(code, 'code')}
                className={`font-mono font-bold tracking-[0.3em] text-5xl md:text-6xl ${
                  remaining > 0
                    ? 'text-clouddrove-dark hover:text-clouddrove-light'
                    : 'text-clouddrove-light/40 line-through'
                }`}
                title="Copy the code"
              >
                {copied === 'code' ? 'Copied' : code}
              </button>

              {remaining > 0 ? (
                <>
                  <p className="text-xs text-clouddrove-light mt-2">
                    Expires in {Math.floor(remaining / 60)}:
                    {String(remaining % 60).padStart(2, '0')}, opens once
                  </p>
                  <div className="mt-4 flex flex-col items-center">
                    <p className="text-xs text-clouddrove-light mb-2">or scan, no typing</p>
                    <div
                      className="w-40 h-40 [&>svg]:w-full [&>svg]:h-full"
                      aria-label="QR code linking to this clip"
                      dangerouslySetInnerHTML={{
                        __html: qrSvg(`${window.location.origin}/clipboard#${code}`),
                      }}
                    />
                  </div>
                </>
              ) : (
                <p className="text-xs text-clouddrove-light mt-2">
                  That code expired. Save again for a new one.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="bg-white/70 backdrop-blur-sm border-2 border-clouddrove-light/30 rounded-2xl p-4 md:p-6 space-y-3">
          <p className="text-sm font-semibold text-clouddrove-dark">Have a code?</p>

          <input
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') open()
            }}
            placeholder="1234"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="characters"
            spellCheck={false}
            inputMode="numeric"
            className="w-full bg-white/60 border-2 border-clouddrove-light/30 rounded-lg px-3 py-3 text-center font-mono font-bold tracking-[0.15em] text-lg text-clouddrove-dark placeholder:text-clouddrove-light/40 placeholder:tracking-normal placeholder:font-normal focus:outline-none focus:border-clouddrove-light min-h-[48px]"
          />

          <button
            onClick={open}
            disabled={busy !== ''}
            className="w-full bg-white border-2 border-clouddrove-dark text-clouddrove-dark py-3 px-6 rounded-xl font-semibold hover:bg-clouddrove-dark hover:text-white transition-all duration-300 disabled:opacity-50 min-h-[48px]"
          >
            {busy === 'opening' ? 'Opening...' : 'Show'}
          </button>

          <p className="text-xs text-clouddrove-light/80 text-center">
            The text appears in the box above.
          </p>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 text-center" role="alert">
          {error}
        </p>
      )}

      <p className="text-xs text-clouddrove-light/70 text-center">
        Four digits is short enough to read out loud, which means it is also short
        enough to guess. Clips last five minutes, open once, and unlike one-time links
        the key is held on the server, so treat the clipboard as convenience rather than
        privacy. For anything sensitive, use a one-time link.
      </p>
    </div>
  )
}
