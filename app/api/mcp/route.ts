import { NextRequest, NextResponse } from 'next/server'
import { createSecret } from '@/lib/secrets'
import { hashVerifier } from '@/lib/serverCrypto'
import { encryptWithPassword } from '@/lib/clientCrypto'
import { rateLimit, clientIp } from '@/lib/rateLimit'
import { PBKDF2_ITERATIONS } from '@/lib/kdfParams'

// Hosted MCP endpoint, for clients that cannot run a local process.
//
// Read this before using it. Unlike the @clouddrove/vanisec-mcp package, which
// encrypts on the caller's machine, this endpoint receives the plaintext secret
// and the password in the request body and encrypts them here. Vanisec is
// therefore NOT zero-knowledge over this path: for the duration of the request
// this server holds material it otherwise never sees. Prefer the local package.
//
// vanisec_generate_secret is deliberately absent. Its whole purpose is writing
// the link password to the caller's system clipboard, and over HTTP the
// clipboard would be this server's, so the password would have to come back in
// the response and land in the conversation. That is the opposite of what the
// tool exists to do, so offering it here would be misleading rather than useful.
//
// Transport: the Streamable HTTP JSON mode. Every method here is a plain
// request and response with nothing to stream, so the endpoint answers with
// application/json and does not open an SSE stream.

// The protocol revisions this endpoint speaks, newest first. Hardcoded rather
// than imported from @modelcontextprotocol/sdk: the Next app does not depend on
// that package, and adding it for two constants would tie the website build to
// the separately published server in mcp/.
//
// The list stops at 2025-11-25 because that is the newest revision whose server
// obligations this endpoint actually meets. Checked against the published spec:
//
//   - 2025-03-26 introduced Streamable HTTP. A JSON-only server is conformant:
//     on POST the server "MUST either return Content-Type: text/event-stream
//     ... or application/json", and on GET it "MUST either return
//     Content-Type: text/event-stream ... or else return HTTP 405 Method Not
//     Allowed, indicating that the server does not offer an SSE stream at this
//     endpoint". Sessions and Mcp-Session-Id are a MAY, so a stateless server
//     needs none. The one gap is JSON-RPC batching, which 2025-03-26 allows a
//     client to send and this switch does not accept; the batch branch in POST
//     says so rather than failing opaquely, and 2025-06-18 removed batching.
//   - 2025-06-18 made the MCP-Protocol-Version header binding: a server that
//     receives "an invalid or unsupported MCP-Protocol-Version ... MUST respond
//     with 400 Bad Request", and when the header is absent it "SHOULD assume
//     protocol version 2025-03-26". Both are implemented below.
//   - 2025-11-25 adds icons, tasks, sampling tool calls and OAuth discovery,
//     all opt-in through capabilities this endpoint does not declare, plus one
//     server MUST: an invalid Origin has to be answered with 403 Forbidden.
//     That is implemented below too.
//   - 2026-07-28, the current revision, drops the initialize handshake for
//     per-request metadata and a mandatory server/discover RPC. None of that
//     exists here, so it is deliberately absent from this list.
//
// 2024-11-05 stays because dropping it would break clients that work today. It
// means the 2024-11-05 message schema carried over Streamable HTTP; that
// revision's own HTTP+SSE transport, with its two endpoints and endpoint event,
// has never been implemented here.
const SUPPORTED_PROTOCOL_VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'] as const

// What we answer with when the client asks for something we do not speak. The
// spec says this SHOULD be the latest version the server supports.
const PREFERRED_PROTOCOL_VERSION = SUPPORTED_PROTOCOL_VERSIONS[0]

const ALLOWED_EXPIRY_HOURS = [1, 6, 24, 72, 168]
const DEFAULT_EXPIRY_HOURS = 24
const MAX_TEXT_CHARS = 100_000
const MAX_BODY_BYTES = 1_000_000

// Tighter than the browser form's budget: this path costs server CPU for the
// key derivation, so it is cheaper to abuse.
const CALL_LIMIT = 20
const CALL_WINDOW_SECONDS = 600

type JsonRpcId = string | number | null

interface JsonRpcRequest {
  jsonrpc: string
  id?: JsonRpcId
  method: string
  params?: Record<string, unknown>
}

function result(id: JsonRpcId, value: unknown) {
  return NextResponse.json({ jsonrpc: '2.0', id, result: value })
}

function error(id: JsonRpcId, code: number, message: string, status = 200) {
  return NextResponse.json({ jsonrpc: '2.0', id, error: { code, message } }, { status })
}

function toolText(text: string, isError = false) {
  return { content: [{ type: 'text', text }], ...(isError ? { isError: true } : {}) }
}

function speaks(version: string): boolean {
  return (SUPPORTED_PROTOCOL_VERSIONS as readonly string[]).includes(version)
}

// Version negotiation, from the lifecycle spec: "If the server supports the
// requested protocol version, it MUST respond with the same version. Otherwise,
// the server MUST respond with another protocol version it supports."
//
// Echoing what the client asked for is the point. Always answering our newest
// would hand 2025-11-25 to a client that asked for 2024-11-05, and the spec
// tells such a client to disconnect, so today's working clients would break.
//
// Nothing else in this file branches on the negotiated version: every method
// answers identically under all four revisions, so there is no state to keep
// and nothing for a stateless endpoint to forget between requests.
function negotiateProtocolVersion(params: Record<string, unknown> | undefined): string {
  const requested = params?.protocolVersion
  if (typeof requested === 'string' && speaks(requested)) return requested
  return PREFERRED_PROTOCOL_VERSION
}

// "If the server receives a request with an invalid or unsupported
// MCP-Protocol-Version, it MUST respond with 400 Bad Request." When the header
// is absent the spec says to assume 2025-03-26, which needs no code here
// because no answer depends on the revision.
//
// -32000 and this wording match what the SDK's own Streamable HTTP server
// returns, so a client sees the same failure from either Vanisec transport.
function unsupportedVersionHeader(request: NextRequest): NextResponse | null {
  const requested = request.headers.get('mcp-protocol-version')
  if (requested === null || speaks(requested)) return null
  return error(
    null,
    -32000,
    `Bad Request: Unsupported protocol version: ${requested} ` +
      `(supported versions: ${SUPPORTED_PROTOCOL_VERSIONS.join(', ')})`,
    400
  )
}

// "Servers MUST validate the Origin header on all incoming connections to
// prevent DNS rebinding attacks", and since 2025-11-25: "If the Origin header
// is present and invalid, servers MUST respond with HTTP 403 Forbidden."
//
// Only a browser labels a request with an Origin, and a browser cannot read an
// answer from here anyway because nothing serves CORS headers. So this rejects
// the case the spec names and leaves every real MCP client, which sends no
// Origin at all, untouched.
function forbiddenOrigin(request: NextRequest): NextResponse | null {
  const origin = request.headers.get('origin')
  if (origin === null) return null

  const allowed = [new URL(request.url).origin]
  const configured = process.env.NEXT_PUBLIC_BASE_URL
  if (configured) {
    try {
      allowed.push(new URL(configured).origin)
    } catch {
      // A malformed NEXT_PUBLIC_BASE_URL should not widen what is accepted.
    }
  }

  if (allowed.includes(origin)) return null
  return error(null, -32000, 'Forbidden: Origin not allowed', 403)
}

const CREATE_TOOL = {
  name: 'vanisec_create_secret',
  title: 'Share a secret as a one-time link',
  description:
    'Creates a one-time Vanisec link for a secret. Note that this hosted endpoint receives the secret and the ' +
    'password in plaintext and encrypts them server side, so Vanisec is not zero-knowledge over this path. The ' +
    'local @clouddrove/vanisec-mcp package encrypts on your own machine and should be preferred where it can run.',
  inputSchema: {
    type: 'object',
    properties: {
      text: { type: 'string', description: 'The secret to share' },
      password: {
        type: 'string',
        description: 'Password protecting the link. Send it to the recipient separately.',
      },
      expiresIn: {
        type: 'number',
        description: `Hours until expiry. One of ${ALLOWED_EXPIRY_HOURS.join(', ')}. Defaults to ${DEFAULT_EXPIRY_HOURS}.`,
      },
    },
    required: ['text', 'password'],
    additionalProperties: false,
  },
}

// Prompts are declared here rather than imported from mcp/src, because the
// root tsconfig excludes mcp/ and that package is published on its own. The
// wording also has to differ: vanisec_generate_secret is not reachable over
// HTTP, so the hosted copy names it as the better path and says how to get it,
// instead of telling the caller to invoke a tool this endpoint does not offer.
const PROMPTS = [
  {
    name: 'share-credential',
    title: 'Share a credential',
    description:
      'Works out which Vanisec tool fits the situation, and what to do with the link and its password afterwards.',
    arguments: [
      {
        name: 'what',
        description: 'What needs sharing, for example a database password or an API key.',
        required: false,
      },
      {
        name: 'alreadyExists',
        description:
          'Say yes if the credential already exists somewhere else and you have the value in hand. ' +
          'Leave it out if it still has to be created.',
        required: false,
      },
    ],
  },
  {
    name: 'rotate-and-share',
    title: 'Rotate a credential and hand the new one over',
    description:
      'Replaces an existing credential and gets the new one to its recipient, in an order that never leaves the ' +
      'recipient without a working credential.',
    arguments: [
      {
        name: 'credential',
        description:
          'The kind of credential being rotated, for example a Postgres password, an AWS access key or a ' +
          'webhook signing secret.',
        required: true,
      },
      { name: 'recipient', description: 'Who receives the new credential. Optional.', required: false },
    ],
  },
]

// Server-wide guidance, returned from initialize. Clients such as Codex read
// this and treat it as standing instructions, which matters because prompts are
// close to unreachable outside VS Code and the tool descriptions are otherwise
// the only surface that reaches a model.
//
// Codex advises that the first 512 characters be self-contained. The first
// three entries below are 500 characters together and hold every rule that
// changes what the model does. The install instructions and the zero-knowledge
// caveat follow, because they are context rather than something to act on, and
// the first entry already says the generating tool is not offered here.
const INSTRUCTIONS = [
  'Only vanisec_create_secret is available here. Anything passed to it stays in the transcript for good and ' +
    'reaches this server in plaintext.',
  'If the secret does not exist yet, prefer vanisec_generate_secret in the local @clouddrove/vanisec-mcp ' +
    'package: it creates the value on your machine and puts the link password on your clipboard, so neither ' +
    'enters the conversation.',
  'Send the link and its password through different channels; together they grant access. Opening the link ' +
    'once destroys the secret.',
  // Everything below this point is outside the 512-character budget.
  'There is deliberately no retrieval tool. Expiry is 1, 6, 24, 72 or 168 hours and defaults to 24.',
  "vanisec_generate_secret cannot run over HTTP, because the clipboard would be the server's. Install the " +
    'local package with npx -y @clouddrove/vanisec-mcp. It encrypts on your own machine, so Vanisec only ' +
    'ever receives ciphertext; this hosted endpoint encrypts server side and is not zero-knowledge, so it ' +
    'should be the fallback rather than the default.',
].join('\n\n')

function promptMessages(description: string, text: string) {
  return { description, messages: [{ role: 'user', content: { type: 'text', text } }] }
}

function sharePrompt(args: Record<string, unknown>) {
  const what = typeof args.what === 'string' ? args.what.trim() : ''
  const subject = what || 'a credential'
  const raw = typeof args.alreadyExists === 'string' ? args.alreadyExists.trim() : ''
  const situation =
    raw === ''
      ? 'I have not said whether this credential already exists. Settle that first, because it decides how to share it.'
      : /^(y|yes|true|1)$/i.test(raw)
        ? 'This credential already exists somewhere else and I have the value in hand.'
        : 'This credential does not exist yet, so it can be created from scratch.'

  return promptMessages(
    `Choose the right Vanisec tool for sharing ${subject}`,
    `Help me share ${subject} through Vanisec.

${situation}

Choose the tool this way:

- If the credential does not exist yet, the best path is vanisec_generate_secret in the local @clouddrove/vanisec-mcp package. It creates the value on my own machine and puts the link password on my system clipboard, so neither the value nor the link password ever enters this conversation. It cannot run over this hosted endpoint, because the clipboard would be the server's. Tell me to install it with "npx -y @clouddrove/vanisec-mcp" if it is worth the detour.
- Otherwise use vanisec_create_secret. It works, but the value and the link password are passed in as arguments, so both stay in this transcript for good, and over this hosted endpoint they also reach the server in plaintext.

Once the link exists, remind me of two things:

1. The link password goes to the recipient through a different channel than the link. Sending both through the same channel is the same as sending the secret in plain text, because either one alone is useless and the pair together is the secret.
2. Opening the link once destroys the secret. The recipient gets exactly one read, so tell them to open it when they are ready to store the value, not to check that the link works.`
  )
}

function rotatePrompt(args: Record<string, unknown>) {
  const credential =
    (typeof args.credential === 'string' ? args.credential.trim() : '') || 'credential'
  const named = typeof args.recipient === 'string' ? args.recipient.trim() : ''
  const recipient = named || 'the recipient'

  return promptMessages(
    `Rotate ${credential} and hand the new one over`,
    `Help me rotate the ${credential} and hand the new one to ${recipient}.

The replacement should come from vanisec_generate_secret in the local @clouddrove/vanisec-mcp package. It generates the new ${credential} on my own machine and puts the link password on my clipboard, so the new value and the password stay out of this conversation. That tool is not available over this hosted endpoint; installing the package with "npx -y @clouddrove/vanisec-mcp" is the way to get it. Fall back to vanisec_create_secret only when the new value has to be issued by the system that owns it, or the package cannot be installed.

Follow this order and do not reorder it:

1. Generate the new ${credential} and create the one-time link.
2. Send the link to ${recipient}, and send the link password through a different channel than the link.
3. Wait for ${recipient} to confirm they have the new ${credential} and that it works. The link opens once and is then destroyed, so if it expired or was opened by the wrong person, go back to step 1.
4. Only after that confirmation, revoke or delete the old ${credential}.

Revoking first is the mistake worth avoiding. It locks out everything still using the old value, and if anything goes wrong in steps 2 and 3 there is no working credential left at all.

Before step 4, list anything I have to update myself: configuration files, CI variables, secret managers, running services that hold the old value.`
  )
}

function baseUrl(request: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_BASE_URL
  if (configured) return configured.replace(/\/+$/, '')
  return new URL(request.url).origin
}

async function handleCreate(
  args: Record<string, unknown>,
  request: NextRequest
): Promise<ReturnType<typeof toolText>> {
  const text = args.text
  const password = args.password
  const expiresIn = args.expiresIn === undefined ? DEFAULT_EXPIRY_HOURS : args.expiresIn

  if (typeof text !== 'string' || text.trim().length === 0) {
    return toolText('text must be a non-empty string', true)
  }
  if (text.length > MAX_TEXT_CHARS) {
    return toolText(`text must be at most ${MAX_TEXT_CHARS} characters`, true)
  }
  if (typeof password !== 'string' || password.trim().length === 0) {
    return toolText('password must be a non-empty string', true)
  }
  if (typeof expiresIn !== 'number' || !ALLOWED_EXPIRY_HOURS.includes(expiresIn)) {
    return toolText(`expiresIn must be one of ${ALLOWED_EXPIRY_HOURS.join(', ')} hours`, true)
  }

  // The same envelope the browser builds, so a secret created here renders on
  // the website exactly like any other.
  const envelope = JSON.stringify({ text, file: null })
  const enc = await encryptWithPassword(envelope, password)

  const id = await createSecret({
    ciphertext: enc.ciphertext,
    iv: enc.iv,
    passwordProtected: true,
    encSalt: enc.encSalt,
    authSalt: enc.authSalt,
    verifierHash: hashVerifier(enc.verifier),
    iterations: enc.iterations,
    expiresIn,
  })

  const url = `${baseUrl(request)}/secret/${id}`
  const expiresAt = new Date(Date.now() + expiresIn * 3600_000).toISOString()

  return toolText(
    `One-time link created.\n\n${url}\n\nExpires ${expiresAt}. Opening it once destroys the secret. ` +
      `The recipient needs the password you chose; send it through a different channel.`
  )
}

export async function POST(request: NextRequest) {
  const rejected = forbiddenOrigin(request) ?? unsupportedVersionHeader(request)
  if (rejected) return rejected

  const declaredLength = Number(request.headers.get('content-length') || 0)
  if (declaredLength > MAX_BODY_BYTES) {
    return error(null, -32600, 'Request body too large', 413)
  }

  let parsed: unknown
  try {
    parsed = await request.json()
  } catch {
    return error(null, -32700, 'Parse error', 400)
  }

  // 2025-03-26 let a client batch messages into an array. 2025-06-18 removed
  // that again, and this switch answers one message per request. Naming the
  // limitation costs a client one round trip; letting the array fall through to
  // "Invalid Request" would leave it guessing what was wrong with its JSON.
  if (Array.isArray(parsed)) {
    return error(null, -32600, 'JSON-RPC batching is not supported. Send one message per request.', 400)
  }

  const body = parsed as JsonRpcRequest

  if (!body || body.jsonrpc !== '2.0' || typeof body.method !== 'string') {
    return error(body?.id ?? null, -32600, 'Invalid Request', 400)
  }

  const id = body.id ?? null

  switch (body.method) {
    case 'initialize':
      return result(id, {
        protocolVersion: negotiateProtocolVersion(body.params),
        capabilities: { tools: {}, prompts: {} },
        serverInfo: { name: 'vanisec-hosted', version: '0.1.0' },
        instructions: INSTRUCTIONS,
      })

    // Notifications carry no id and expect no result.
    case 'notifications/initialized':
      return new NextResponse(null, { status: 202 })

    case 'ping':
      return result(id, {})

    case 'tools/list':
      return result(id, { tools: [CREATE_TOOL] })

    case 'prompts/list':
      return result(id, { prompts: PROMPTS })

    // Prompts only build text, so there is nothing to rate limit and nothing
    // that can fail beyond an unknown name or a missing required argument.
    case 'prompts/get': {
      const params = (body.params ?? {}) as { name?: string; arguments?: Record<string, unknown> }
      const args = params.arguments ?? {}

      if (params.name === 'share-credential') return result(id, sharePrompt(args))
      if (params.name === 'rotate-and-share') {
        if (typeof args.credential !== 'string' || args.credential.trim() === '') {
          return error(id, -32602, 'rotate-and-share requires a credential argument')
        }
        return result(id, rotatePrompt(args))
      }
      return error(id, -32602, `Unknown prompt: ${params.name}`)
    }

    case 'tools/call': {
      const params = (body.params ?? {}) as { name?: string; arguments?: Record<string, unknown> }

      if (params.name === 'vanisec_generate_secret') {
        return result(
          id,
          toolText(
            'vanisec_generate_secret is not available over HTTP. It puts the link password on your system ' +
              'clipboard, which only works when the server runs on your own machine. Install ' +
              '@clouddrove/vanisec-mcp to use it.',
            true
          )
        )
      }
      if (params.name !== CREATE_TOOL.name) {
        return error(id, -32602, `Unknown tool: ${params.name}`)
      }

      const ip = clientIp(request.headers) ?? 'unknown'
      const rl = await rateLimit(`mcp-call:${ip}`, CALL_LIMIT, CALL_WINDOW_SECONDS)
      if (!rl.allowed) {
        return NextResponse.json(
          {
            jsonrpc: '2.0',
            id,
            error: { code: -32000, message: 'Too many requests. Please try again later.' },
          },
          { status: 429, headers: { 'Retry-After': String(rl.resetSeconds) } }
        )
      }

      try {
        return result(id, await handleCreate(params.arguments ?? {}, request))
      } catch {
        return result(id, toolText('Failed to create the secret.', true))
      }
    }

    default:
      return error(id, -32601, `Method not found: ${body.method}`)
  }
}

// A client GETs this path to open an SSE stream. The spec lets a server decline
// with 405, and everything here answers in a single JSON response, so there is
// no stream to open and 405 stays.
//
// What changed is the body. A bare status code tells a client nothing about
// whether the endpoint is broken, moved or simply JSON only, so the answer is
// now a JSON-RPC error saying which of those it is. The id is null because a
// GET carries no request to answer.
export async function GET(request: NextRequest) {
  const rejected = forbiddenOrigin(request)
  if (rejected) return rejected

  return NextResponse.json(
    {
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32000,
        message:
          'This MCP endpoint runs the Streamable HTTP JSON mode and does not open an SSE stream. ' +
          'Send JSON-RPC messages by POST to this same URL.',
        data: {
          documentation: 'https://vanisec.clouddrove.com/mcp',
          preferred: 'npx -y @clouddrove/vanisec-mcp',
          protocolVersions: SUPPORTED_PROTOCOL_VERSIONS,
          iterations: PBKDF2_ITERATIONS,
        },
      },
    },
    { status: 405, headers: { Allow: 'POST' } }
  )
}
