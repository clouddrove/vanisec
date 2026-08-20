import { encryptWithPassword } from '@lib/clientCrypto'
import { validateExpiry, validateNonEmpty } from './validate.js'

export class VanisecApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'VanisecApiError'
  }
}

const DEFAULT_BASE_URL = 'https://vanisec.clouddrove.com'

export function baseUrl(): string {
  return (process.env.VANISEC_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '')
}

export interface CreateSecretOptions {
  text: string
  password: string
  expiresIn?: number
  // Also ask for a short code that can be typed into another device by hand.
  pairingCode?: boolean
  fetchImpl?: typeof fetch
}

export interface CreatedSecret {
  url: string
  expiresAt: string
  // Absent when not asked for, and also when minting failed. See mintPairingCode.
  pairingCode?: string
  pairingCodeExpiresIn?: number
}

// Pairing codes are minted after the secret exists, so this can only ever run
// once there is a live one-time link the caller has not been told about yet.
//
// That is why every failure here is swallowed. Throwing would lose the url and
// leave the secret orphaned: sitting in Redis, single-use, with nobody holding
// the link. A missing code costs the caller a convenience; a lost url costs
// them the secret. Same reasoning as the no-retry rule on the create itself.
async function mintPairingCode(
  id: string,
  doFetch: typeof fetch
): Promise<{ code: string; expiresIn: number } | null> {
  try {
    const res = await doFetch(`${baseUrl()}/api/pair`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (!res.ok) return null
    const { code, expiresIn } = (await res.json()) as { code?: string; expiresIn?: number }
    if (!code || typeof expiresIn !== 'number') return null
    return { code, expiresIn }
  } catch {
    return null
  }
}

export async function createSecret(opts: CreateSecretOptions): Promise<CreatedSecret> {
  const text = validateNonEmpty(opts.text, 'text')
  const password = validateNonEmpty(opts.password, 'password')
  const expiresIn = validateExpiry(opts.expiresIn)
  const doFetch = opts.fetchImpl ?? fetch

  // The API expects the same {text, file} envelope the website encrypts.
  const envelope = JSON.stringify({ text, file: null })
  const enc = await encryptWithPassword(envelope, password)

  let res: Response
  try {
    // No retry. A retry of a create that actually succeeded would leave two
    // live one-time links for one secret, and the caller only learns of one.
    res = await doFetch(`${baseUrl()}/api/secrets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ciphertext: enc.ciphertext,
        iv: enc.iv,
        passwordProtected: true,
        encSalt: enc.encSalt,
        authSalt: enc.authSalt,
        verifier: enc.verifier,
        iterations: enc.iterations,
        expiresIn,
      }),
    })
  } catch (cause) {
    throw new VanisecApiError(
      `Could not reach ${baseUrl()}: ${(cause as Error).message}. The secret was not created.`
    )
  }

  if (res.status === 429) {
    const retryAfter = res.headers.get('Retry-After')
    throw new VanisecApiError(
      `Vanisec rate limit reached.${retryAfter ? ` Try again in ${retryAfter} seconds.` : ''}`
    )
  }
  if (res.status === 413) {
    throw new VanisecApiError('The secret is too large to store.')
  }
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}))
    throw new VanisecApiError(
      `Vanisec returned ${res.status}${(detail as { error?: string }).error ? `: ${(detail as { error?: string }).error}` : ''}`
    )
  }

  const { id } = (await res.json()) as { id?: string }
  if (!id) throw new VanisecApiError('Vanisec accepted the secret but returned no id.')

  const created: CreatedSecret = {
    url: `${baseUrl()}/secret/${id}`,
    expiresAt: new Date(Date.now() + expiresIn * 3600_000).toISOString(),
  }

  if (opts.pairingCode) {
    const minted = await mintPairingCode(id, doFetch)
    if (minted) {
      created.pairingCode = minted.code
      created.pairingCodeExpiresIn = minted.expiresIn
    }
  }

  return created
}
