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

const PROTOCOL_VERSION = '2024-11-05'
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
  const declaredLength = Number(request.headers.get('content-length') || 0)
  if (declaredLength > MAX_BODY_BYTES) {
    return error(null, -32600, 'Request body too large', 413)
  }

  let body: JsonRpcRequest
  try {
    body = (await request.json()) as JsonRpcRequest
  } catch {
    return error(null, -32700, 'Parse error', 400)
  }

  if (!body || body.jsonrpc !== '2.0' || typeof body.method !== 'string') {
    return error(body?.id ?? null, -32600, 'Invalid Request', 400)
  }

  const id = body.id ?? null

  switch (body.method) {
    case 'initialize':
      return result(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: { name: 'vanisec-hosted', version: '0.1.0' },
        instructions:
          'This hosted endpoint encrypts server side and is not zero-knowledge. Prefer the local ' +
          '@clouddrove/vanisec-mcp package, which encrypts on your machine and can also generate ' +
          'credentials without them entering the conversation.',
      })

    // Notifications carry no id and expect no result.
    case 'notifications/initialized':
      return new NextResponse(null, { status: 202 })

    case 'ping':
      return result(id, {})

    case 'tools/list':
      return result(id, { tools: [CREATE_TOOL] })

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

// The spec allows a server to decline the SSE stream. Everything here answers
// in a single JSON response, so there is no stream to open.
export async function GET() {
  return NextResponse.json(
    {
      error: 'This endpoint speaks MCP over POST only.',
      documentation: 'https://vanisec.clouddrove.com/mcp',
      preferred: 'npx -y @clouddrove/vanisec-mcp',
      iterations: PBKDF2_ITERATIONS,
    },
    { status: 405, headers: { Allow: 'POST' } }
  )
}
