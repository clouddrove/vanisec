'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { decryptWithPassword, computeVerifier } from '@/lib/clientCrypto'

interface SecretFile {
  name: string
  type: string
  size: number
  data: string
}

export default function ViewSecret() {
  const params = useParams()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [secret, setSecret] = useState('')
  const [fileData, setFileData] = useState<SecretFile | null>(null)
  const [requiresPassword, setRequiresPassword] = useState(false)
  const [viewed, setViewed] = useState(false)
  // Salt needed to derive the decryption key from the password.
  const [encSalt, setEncSalt] = useState('')
  const [authSalt, setAuthSalt] = useState('')

  // Decode the decrypted {text, file} envelope into view state.
  const applyEnvelope = (plaintext: string) => {
    const env = JSON.parse(plaintext) as { text?: string; file?: SecretFile | null }
    setSecret(env.text || '')
    setFileData(env.file || null)
    setViewed(true)
  }

  const checkSecret = useCallback(async () => {
    try {
      const response = await fetch(`/api/secrets/${params.id}`)
      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401 && data.requiresPassword) {
          setEncSalt(data.encSalt || '')
          setAuthSalt(data.authSalt || '')
          setRequiresPassword(true)
        } else {
          setError(data.error || 'Secret not found or expired')
        }
        return
      }

      // Reached only for a (future) non-password secret — no key available here.
      setError('This secret requires a password.')
    } catch {
      setError('Failed to load secret')
    }
  }, [params.id])

  useEffect(() => {
    // Fetches the secret's status on mount. Every setState in checkSecret happens
    // after an await, so this is not the synchronous cascade the rule guards against.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkSecret()
  }, [checkSecret])

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Derive the retrieval verifier from the password; the server never sees
      // the password itself.
      const verifier = await computeVerifier(password, authSalt)

      const response = await fetch(`/api/secrets/${params.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ verifier }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Invalid password')
      }

      // Decrypt in the browser, then split the envelope into text/file.
      const plaintext = await decryptWithPassword(
        { ciphertext: data.ciphertext, iv: data.iv },
        password,
        data.encSalt || encSalt
      )
      applyEnvelope(plaintext)
      setRequiresPassword(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid password')
    } finally {
      setLoading(false)
    }
  }

  if (viewed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-clouddrove-light opacity-5 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-clouddrove-dark opacity-5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="w-full max-w-2xl relative z-10">
          <div className="text-center mb-8">
            <div className="inline-block mb-6 animate-float">
              <div className="relative">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center shadow-glow transform rotate-3">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="absolute -inset-2 bg-green-400 rounded-2xl blur-xl opacity-30 animate-pulse-slow"></div>
              </div>
            </div>
            <p className="text-clouddrove-light text-xl font-light tracking-wide mb-2">Vanisec</p>
            <p className="text-clouddrove-dark text-sm font-medium italic tracking-wide">
              Share once. Vanish forever.
            </p>
          </div>

          <div className="glass-effect rounded-2xl shadow-glow p-8 md:p-10 backdrop-blur-xl border border-clouddrove-light/20">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-clouddrove-dark mb-3">
                Secret Revealed
              </h2>
              <p className="text-clouddrove-light text-lg">
                This secret has been viewed and is now permanently deleted.
              </p>
            </div>

            {secret && (
              <div className="bg-gradient-to-r from-clouddrove-light/10 to-clouddrove-dark/10 border-2 border-clouddrove-light/30 rounded-xl p-6 mb-6 backdrop-blur-sm">
                <p className="text-clouddrove-dark whitespace-pre-wrap break-words text-lg leading-relaxed">
                  {secret}
                </p>
              </div>
            )}

            {fileData && (
              <div className="bg-gradient-to-r from-clouddrove-light/10 to-clouddrove-dark/10 border-2 border-clouddrove-light/30 rounded-xl p-6 mb-6 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <svg className="w-8 h-8 text-clouddrove-dark flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <div className="min-w-0">
                      <p className="text-clouddrove-dark font-semibold truncate">{fileData.name}</p>
                      <p className="text-xs text-clouddrove-light">{(fileData.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const byteString = atob(fileData.data)
                      const ab = new ArrayBuffer(byteString.length)
                      const ia = new Uint8Array(ab)
                      for (let i = 0; i < byteString.length; i++) {
                        ia[i] = byteString.charCodeAt(i)
                      }
                      const blob = new Blob([ab], { type: fileData.type })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = fileData.name
                      a.click()
                      URL.revokeObjectURL(url)
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-clouddrove-dark to-clouddrove-light text-white rounded-lg font-semibold text-sm hover:from-clouddrove-light hover:to-clouddrove-dark transition-all min-h-[44px] shrink-0"
                  >
                    Download
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={() => router.push('/')}
              className="w-full bg-gradient-to-r from-clouddrove-dark to-clouddrove-light text-white py-4 px-6 rounded-xl font-semibold hover:from-clouddrove-light hover:to-clouddrove-dark transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 min-h-[48px]"
            >
              Create Your Own Secret
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-clouddrove-light opacity-5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-clouddrove-dark opacity-5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="inline-block mb-6 animate-float">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-clouddrove-light via-clouddrove-dark to-clouddrove-light flex items-center justify-center shadow-glow transform rotate-3">
                <span className="text-white text-5xl font-bold">V</span>
              </div>
              <div className="absolute -inset-1 bg-gradient-to-br from-clouddrove-light to-clouddrove-dark rounded-2xl blur opacity-30 animate-pulse-slow"></div>
            </div>
          </div>
          <p className="text-clouddrove-light text-xl font-light tracking-wide mb-2">Vanisec</p>
          <p className="text-clouddrove-dark text-sm font-medium italic tracking-wide">
            Share once. Vanish forever.
          </p>
        </div>

        <div className="glass-effect rounded-2xl shadow-glow p-8 md:p-10 backdrop-blur-xl border border-clouddrove-light/20">
          {requiresPassword ? (
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div className="text-center mb-6">
                <div className="inline-block mb-4">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-clouddrove-dark to-clouddrove-light rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-clouddrove-dark mb-2">
                  Password Required
                </h2>
                <p className="text-clouddrove-light">
                  This secret is protected with a password.
                </p>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-clouddrove-dark mb-3 tracking-wide">
                  Enter Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-4 md:px-5 border-2 border-clouddrove-light/30 rounded-xl focus:outline-none focus:border-clouddrove-dark focus:ring-2 focus:ring-clouddrove-dark/20 transition-all bg-white/50 backdrop-blur-sm placeholder:text-clouddrove-light/50 min-h-[48px]"
                  placeholder="Enter the password"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50/80 border-2 border-red-200/50 text-red-700 px-5 py-4 rounded-xl backdrop-blur-sm">
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
                    Verifying...
                  </span>
                ) : (
                  'View Secret'
                )}
              </button>
            </form>
          ) : error ? (
            <div className="text-center space-y-6">
              <div className="mb-4 inline-block">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-clouddrove-dark mb-2">
                Secret Not Available
              </h2>
              <p className="text-clouddrove-light mb-6 text-lg">
                {error}
              </p>
              <button
                onClick={() => router.push('/')}
                className="w-full bg-gradient-to-r from-clouddrove-dark to-clouddrove-light text-white py-4 px-6 rounded-xl font-semibold hover:from-clouddrove-light hover:to-clouddrove-dark transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 min-h-[48px]"
              >
                Create Your Own Secret
              </button>
            </div>
          ) : (
            <div className="text-center">
              <div className="inline-block mb-4">
                <svg className="animate-spin h-12 w-12 text-clouddrove-dark mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <p className="mt-4 text-clouddrove-light text-lg">Loading secret...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
