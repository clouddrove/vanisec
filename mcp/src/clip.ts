import { generateClipCode, formatClipCode, sealClip } from '@lib/clipCode'
import { validateExpiry, validateNonEmpty } from './validate.js'
import { VanisecApiError, baseUrl } from './vanisec.js'

// Clipboard clips, created from an AI client.
//
// Different from a one-time link in one way that matters here: a clip has no
// password. The ten character code is itself the key, derived in this process
// and never sent to Vanisec, so the server stores ciphertext it cannot open.
//
// The consequence is the reason this tool is described the way it is. The code
// has to be shown, because a code nobody can read cannot be typed into a phone,
// and a shown code stays in the conversation. For a clip that is usually fine:
// it is a handoff you are doing right now and it opens once. For a credential
// that should never enter a transcript at all, vanisec_generate_secret is still
// the right tool.
//
// The sealing lives in @lib/clipCode rather than here, so a clip written by this
// package and one written by the website are byte for byte the same. A drift
// between two copies would surface to a user as "that code did not work", with
// nothing to point at.

export interface CreateClipOptions {
  text: string
  expiresIn?: number
  fetchImpl?: typeof fetch
}

export interface CreatedClip {
  code: string
  url: string
  expiresAt: string
}

export async function createClip(opts: CreateClipOptions): Promise<CreatedClip> {
  const text = validateNonEmpty(opts.text, 'text')
  const expiresIn = validateExpiry(opts.expiresIn)
  const doFetch = opts.fetchImpl ?? fetch

  const code = generateClipCode()
  // Same {text, file} envelope the website writes, so a clip created here opens
  // in a browser exactly like any other.
  const sealed = await sealClip(code, JSON.stringify({ text, file: null }))

  let res: Response
  try {
    // No retry, for the same reason createSecret does not: a retry of a create
    // that actually succeeded would leave a second clip nobody knows about.
    res = await doFetch(`${baseUrl()}/api/clip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...sealed, expiresIn }),
    })
  } catch (cause) {
    throw new VanisecApiError(
      `Could not reach ${baseUrl()}: ${(cause as Error).message}. The clip was not created.`
    )
  }

  if (res.status === 429) {
    const retryAfter = res.headers.get('Retry-After')
    throw new VanisecApiError(
      `Vanisec rate limit reached.${retryAfter ? ` Try again in ${retryAfter} seconds.` : ''}`
    )
  }
  if (res.status === 413) {
    throw new VanisecApiError('The text is too large to store.')
  }
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}))
    throw new VanisecApiError(
      `Vanisec returned ${res.status}${(detail as { error?: string }).error ? `: ${(detail as { error?: string }).error}` : ''}`
    )
  }

  return {
    code: formatClipCode(code),
    url: `${baseUrl()}/clipboard`,
    expiresAt: new Date(Date.now() + expiresIn * 3600_000).toISOString(),
  }
}
