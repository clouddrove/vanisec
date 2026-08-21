'use client'

import { useState } from 'react'
import {
  generateClipCode,
  normalizeClipCode,
  formatClipCode,
  deriveClipMaterial,
  sealClip,
  openClip,
} from '@/lib/clipCode'

// One box, both directions. Type text and get a code, or type a code and get
// text back. Deliberately a single page: the whole point is that this is faster
// than thinking about it.
//
// The code never reaches the server. deriveClipMaterial turns it into an id and
// an AES key here in the browser, and only the id is sent.

const EXPIRY_OPTIONS = [
  { value: 1, label: '1 hour' },
  { value: 6, label: '6 hours' },
  { value: 24, label: '24 hours' },
  { value: 72, label: '3 days' },
  { value: 168, label: '7 days' },
]

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
  const [expiresIn, setExpiresIn] = useState(24)

  const [code, setCode] = useState('')
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
      const fresh = generateClipCode()
      const envelope = JSON.stringify({
        text,
        file: file
          ? { name: file.name, type: file.type, data: await fileToBase64(file) }
          : null,
      })
      const sealed = await sealClip(fresh, envelope)

      const response = await fetch('/api/clip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...sealed, expiresIn }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(data.error || 'Could not save')
        return
      }

      setCode(formatClipCode(fresh))
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

    setBusy('opening')
    try {
      const { id } = await deriveClipMaterial(normalized)
      const response = await fetch('/api/clip/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
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
      const envelope = JSON.parse(await openClip(normalized, data))

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

          <select
            value={expiresIn}
            onChange={(e) => setExpiresIn(Number(e.target.value))}
            className="w-full bg-white/60 border-2 border-clouddrove-light/30 rounded-lg px-3 py-2 text-clouddrove-dark text-sm focus:outline-none focus:border-clouddrove-light min-h-[44px]"
          >
            {EXPIRY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                Expires in {o.label}
              </option>
            ))}
          </select>

          <button
            onClick={save}
            disabled={busy !== ''}
            className="w-full bg-gradient-to-r from-clouddrove-dark to-clouddrove-light text-white py-3 px-6 rounded-xl font-semibold hover:from-clouddrove-light hover:to-clouddrove-dark transition-all duration-300 disabled:opacity-50 min-h-[48px]"
          >
            {busy === 'saving' ? 'Saving...' : 'Save'}
          </button>

          {code && (
            <div className="text-center pt-2">
              <p className="text-xs text-clouddrove-light mb-1">Send this code</p>
              <button
                onClick={() => copy(code, 'code')}
                className="font-mono font-bold tracking-[0.15em] text-2xl md:text-3xl text-clouddrove-dark hover:text-clouddrove-light"
                title="Copy the code"
              >
                {copied === 'code' ? 'Copied' : code}
              </button>
              <p className="text-xs text-clouddrove-light/80 mt-2">
                Opens once, then it is gone.
              </p>
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
            placeholder="XXXXX-XXXXX"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="characters"
            spellCheck={false}
            inputMode="text"
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
        The code is generated here and never sent to Vanisec. It is what decrypts your
        text, so the server only ever holds a blob it cannot read. Anyone you give the
        code to can read the clip once.
      </p>
    </div>
  )
}
