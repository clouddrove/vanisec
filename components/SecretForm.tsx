'use client'

import { useState } from 'react'

export default function SecretForm() {
  const [secret, setSecret] = useState('')
  const [password, setPassword] = useState('')
  const [expiresIn, setExpiresIn] = useState('24')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [shareLink, setShareLink] = useState('')
  const [copied, setCopied] = useState(false)

  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!secret.trim() && !file) {
      setError('Please enter a secret or attach a file')
      setLoading(false)
      return
    }

    if (!password.trim()) {
      setError('Password is required')
      setLoading(false)
      return
    }

    if (file && file.size > MAX_FILE_SIZE) {
      setError('File size exceeds 5MB limit')
      setLoading(false)
      return
    }

    try {
      const formData = new FormData()
      formData.append('secret', secret)
      formData.append('password', password)
      formData.append('expiresIn', expiresIn)
      if (file) {
        formData.append('file', file)
      }

      const response = await fetch('/api/secrets', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create secret')
      }

      const fullUrl = `${window.location.origin}/secret/${data.id}`
      setShareLink(fullUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      alert('Failed to copy link')
    }
  }

  return (
    <div className="glass-effect rounded-2xl shadow-glow p-8 md:p-10 backdrop-blur-xl border border-clouddrove-light/20">
      {!shareLink ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="secret" className="block text-sm font-semibold text-clouddrove-dark mb-3 tracking-wide">
              Your Secret
            </label>
            <textarea
              id="secret"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              rows={4}
              className="w-full px-4 py-4 md:px-5 border-2 border-clouddrove-light/30 rounded-xl focus:outline-none focus:border-clouddrove-dark focus:ring-2 focus:ring-clouddrove-dark/20 transition-all resize-none bg-white/50 backdrop-blur-sm placeholder:text-clouddrove-light/50 md:rows-6"
              placeholder="Enter the secret you want to share securely..."
            />
            <p className="mt-2 text-xs text-clouddrove-light">This secret will be encrypted and can only be viewed once</p>
          </div>

          <div>
            <label htmlFor="file" className="block text-sm font-semibold text-clouddrove-dark mb-3 tracking-wide">
              Attach File <span className="font-normal text-clouddrove-light">(optional, max 5MB)</span>
            </label>
            <div className="relative">
              <input
                type="file"
                id="file"
                onChange={(e) => {
                  const selected = e.target.files?.[0] || null
                  if (selected && selected.size > MAX_FILE_SIZE) {
                    setError('File size exceeds 5MB limit')
                    setFile(null)
                    e.target.value = ''
                    return
                  }
                  setError('')
                  setFile(selected)
                }}
                className="w-full px-4 py-3 md:px-5 border-2 border-clouddrove-light/30 rounded-xl focus:outline-none focus:border-clouddrove-dark focus:ring-2 focus:ring-clouddrove-dark/20 transition-all bg-white/50 backdrop-blur-sm min-h-[48px] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-clouddrove-dark/10 file:text-clouddrove-dark hover:file:bg-clouddrove-dark/20 cursor-pointer"
              />
              {file && (
                <div className="mt-2 flex items-center gap-2 text-xs text-clouddrove-light">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null)
                      const input = document.getElementById('file') as HTMLInputElement
                      if (input) input.value = ''
                    }}
                    className="text-red-500 hover:text-red-700 font-semibold"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-clouddrove-dark mb-3 tracking-wide">
                Password Protection
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-4 md:px-5 border-2 border-clouddrove-light/30 rounded-xl focus:outline-none focus:border-clouddrove-dark focus:ring-2 focus:ring-clouddrove-dark/20 transition-all bg-white/50 backdrop-blur-sm placeholder:text-clouddrove-light/50 min-h-[48px]"
                placeholder="Enter a password"
                required
              />
            </div>

            <div>
              <label htmlFor="expiresIn" className="block text-sm font-semibold text-clouddrove-dark mb-3 tracking-wide">
                Expiration Time
              </label>
              <select
                id="expiresIn"
                value={expiresIn}
                onChange={(e) => setExpiresIn(e.target.value)}
                className="w-full px-4 py-4 md:px-5 border-2 border-clouddrove-light/30 rounded-xl focus:outline-none focus:border-clouddrove-dark focus:ring-2 focus:ring-clouddrove-dark/20 transition-all bg-white/50 backdrop-blur-sm appearance-none cursor-pointer min-h-[48px]"
              >
                <option value="1">1 hour</option>
                <option value="6">6 hours</option>
                <option value="24">24 hours</option>
                <option value="72">72 hours</option>
                <option value="168">7 days</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="bg-red-50/80 border-2 border-red-200/50 text-red-700 px-5 py-4 rounded-xl backdrop-blur-sm animate-pulse">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-clouddrove-dark to-clouddrove-light text-white py-4 px-6 rounded-xl font-semibold hover:from-clouddrove-light hover:to-clouddrove-dark transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 min-h-[48px]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Secure Link...
              </span>
            ) : (
              'Create Secret Link'
            )}
          </button>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="text-center">
            <div className="mb-6 inline-block">
              <div className="relative">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg animate-float">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="absolute -inset-2 bg-green-400 rounded-full blur-xl opacity-30 animate-pulse"></div>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-clouddrove-dark mb-3">
              Secret Link Created!
            </h2>
            <p className="text-clouddrove-light text-lg mb-2">
              Share this link securely
            </p>
            <p className="text-clouddrove-light/70 text-sm">
              It can only be viewed once and will expire automatically
            </p>
          </div>

          <div className="bg-gradient-to-r from-clouddrove-light/10 to-clouddrove-dark/10 border-2 border-clouddrove-light/30 rounded-xl p-4 md:p-5 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="flex-1 bg-white/50 backdrop-blur-sm border border-clouddrove-light/30 rounded-lg px-4 py-3 text-clouddrove-dark text-sm focus:outline-none font-mono min-h-[48px] min-w-0"
              />
              <button
                onClick={copyToClipboard}
                className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-300 transform hover:scale-105 active:scale-95 min-h-[48px] shrink-0 ${
                  copied
                    ? 'bg-green-500 text-white'
                    : 'bg-gradient-to-r from-clouddrove-dark to-clouddrove-light text-white hover:from-clouddrove-light hover:to-clouddrove-dark'
                }`}
              >
                {copied ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Copied!
                  </span>
                ) : (
                  'Copy Link'
                )}
              </button>
            </div>
          </div>

          <div className="bg-amber-50/80 border-2 border-amber-200/50 text-amber-800 px-5 py-4 rounded-xl backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-semibold mb-1">Important Security Notice</p>
                <p className="text-sm">This link will expire and can only be viewed once. Make sure to share it securely through a trusted channel.</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setShareLink('')
              setSecret('')
              setPassword('')
              setExpiresIn('24')
              setFile(null)
              setCopied(false)
              const fileInput = document.getElementById('file') as HTMLInputElement
              if (fileInput) fileInput.value = ''
            }}
            className="w-full bg-gradient-to-r from-clouddrove-light to-clouddrove-dark text-white py-4 px-6 rounded-xl font-semibold hover:from-clouddrove-dark hover:to-clouddrove-light transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 min-h-[48px]"
          >
            Create Another Secret
          </button>
        </div>
      )}
    </div>
  )
}

