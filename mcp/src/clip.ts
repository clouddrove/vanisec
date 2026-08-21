import { sealClip, CLIP_TTL_SECONDS } from '@lib/clipCode'
import { validateNonEmpty } from './validate.js'
import { VanisecApiError, baseUrl } from './vanisec.js'

// Clipboard clips, created from an AI client.
//
// Different from a one-time link in one way that matters here: a clip has no
// password, just a four digit code. That is too small a space to be a key, so
// the key is stored server side and Vanisec can read a clip while it exists.
// The clipboard is not zero-knowledge; see @lib/clipCode for why. Do not
// describe it as such in a tool description or anywhere a model will read it.
//
// The consequence is the reason this tool is described the way it is. The code
// has to be shown, because a code nobody can read cannot be typed into a phone,
// and a shown code stays in the conversation. For a clip that is usually fine:
// it is a handoff you are doing right now, it opens once, and it is gone in
// five minutes. For a credential that should never enter a transcript at all,
// vanisec_generate_secret is still the right tool.
//
// The sealing lives in @lib/clipCode rather than here, so a clip written by this
// package and one written by the website are byte for byte the same. A drift
// between two copies would surface to a user as "that code did not work", with
// nothing to point at.

export interface CreateClipOptions {
  text: string
  fetchImpl?: typeof fetch
}

export interface CreatedClip {
  code: string
  url: string
  expiresInSeconds: number
}

export async function createClip(opts: CreateClipOptions): Promise<CreatedClip> {
  const text = validateNonEmpty(opts.text, 'text')
  const doFetch = opts.fetchImpl ?? fetch

  // Same {text, file} envelope the website writes, so a clip created here opens
  // in a browser exactly like any other. The server picks the code.
  const sealed = await sealClip(JSON.stringify({ text, file: null }))

  let res: Response
  try {
    // No retry, for the same reason createSecret does not: a retry of a create
    // that actually succeeded would leave a second clip nobody knows about.
    res = await doFetch(`${baseUrl()}/api/clip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sealed),
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

  const { code } = (await res.json()) as { code?: string }
  if (!code) throw new VanisecApiError('Vanisec stored the clip but returned no code.')

  return {
    code,
    url: `${baseUrl()}/clipboard`,
    expiresInSeconds: CLIP_TTL_SECONDS,
  }
}
