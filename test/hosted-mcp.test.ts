// The hosted MCP endpoint at /api/mcp is a hand-written JSON-RPC switch. It
// duplicates the create tool, declares its own capabilities and serves its own
// prompts, none of which the published @clouddrove/vanisec-mcp package can
// cover: that package is installed on its own and cannot import next/server,
// ioredis or uuid. So the shape of this endpoint is only ever checked here.
//
// Storage runs against the in-memory Redis stand-in installed by
// test/support/redisHooks.mjs, so no server and no Docker are involved.

import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { POST, GET } from '@/app/api/mcp/route'
import { getRedisClient } from '@/lib/redis'
import { jsonRequest, rawRequest, getRequest, jsonBody, ORIGIN } from './support/http'

// Kept as a literal rather than imported from the route, so that quietly
// widening the route's list cannot quietly widen what the suite checks. The
// list stops at 2025-11-25 because 2026-07-28 replaced the initialize handshake
// with per-request metadata and a mandatory server/discover, none of which this
// endpoint implements.
const SUPPORTED_VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05']
const PREFERRED_VERSION = SUPPORTED_VERSIONS[0]

interface RpcError {
  jsonrpc: string
  id: number | string | null
  error: { code: number; message: string }
}

interface RpcResult<T> {
  jsonrpc: string
  id: number | string | null
  result: T
}

interface ToolResult {
  content: { type: string; text: string }[]
  isError?: boolean
}

// Every test picks its own client IP so the per-IP call budget of one test
// cannot spill into another.
async function rpc<T>(
  method: string,
  params?: Record<string, unknown>,
  ip = 'unused'
): Promise<{ status: number; body: T }> {
  const response = await POST(
    jsonRequest('/api/mcp', { jsonrpc: '2.0', id: 1, method, params }, { 'x-real-ip': ip })
  )
  return { status: response.status, body: await jsonBody<T>(response) }
}

beforeEach(async () => {
  await getRedisClient().flushall()
})

test('initialize advertises exactly the capabilities the switch implements', async () => {
  const { body } = await rpc<
    RpcResult<{
      protocolVersion: string
      capabilities: Record<string, unknown>
      serverInfo: { name: string; version: string }
      instructions: string
    }>
  >('initialize')

  // This request names no version, so the endpoint answers with its own best.
  // It used to answer 2024-11-05 to everyone, having never read the request.
  assert.equal(body.result.protocolVersion, PREFERRED_VERSION)
  // Declaring a capability the switch has no case for makes a client issue
  // requests that fall through to "Method not found".
  assert.deepEqual(body.result.capabilities, { tools: {}, prompts: {} })
  assert.equal(body.result.serverInfo.name, 'vanisec-hosted')
  assert.ok(body.result.instructions.trim().length > 0)
})

// "If the server supports the requested protocol version, it MUST respond with
// the same version." Answering our newest to everyone would break the older
// clients that work today, because a client handed a version it does not
// support is told to disconnect.
test('initialize echoes back each revision the endpoint supports', async () => {
  for (const version of SUPPORTED_VERSIONS) {
    const { body } = await rpc<RpcResult<{ protocolVersion: string }>>('initialize', {
      protocolVersion: version,
    })
    assert.equal(body.result.protocolVersion, version, `${version} has to come back unchanged`)
  }
})

// "Otherwise, the server MUST respond with another protocol version it
// supports. This SHOULD be the latest version supported by the server."
test('initialize answers its own best version for a revision it does not speak', async () => {
  // 2026-07-28 is the current spec revision and is newer than anything here;
  // 2024-10-07 is older than anything here and was never published as a
  // revision on modelcontextprotocol.io; the third is simply not a version.
  for (const version of ['2026-07-28', '2024-10-07', 'not-a-version']) {
    const { body } = await rpc<RpcResult<{ protocolVersion: string }>>('initialize', {
      protocolVersion: version,
    })
    assert.equal(body.result.protocolVersion, PREFERRED_VERSION, `asked for ${version}`)
  }
})

test('initialize handles a missing or malformed protocolVersion without failing', async () => {
  const cases: (Record<string, unknown> | undefined)[] = [
    undefined,
    {},
    { protocolVersion: null },
    { protocolVersion: 20241105 },
    { protocolVersion: '' },
    { protocolVersion: ['2025-11-25'] },
  ]

  for (const params of cases) {
    const { status, body } = await rpc<RpcResult<{ protocolVersion: string }>>('initialize', params)
    assert.equal(status, 200, JSON.stringify(params))
    assert.equal(body.result.protocolVersion, PREFERRED_VERSION, JSON.stringify(params))
  }
})

// From 2025-06-18 on, the client MUST send MCP-Protocol-Version on every
// request after initialize, and the server MUST answer 400 to a version it
// does not support. Claiming 2025-06-18 without this check was the reason the
// old fixed 2024-11-05 answer could not simply be raised.
test('a supported MCP-Protocol-Version header is accepted on any method', async () => {
  for (const version of SUPPORTED_VERSIONS) {
    const response = await POST(
      jsonRequest(
        '/api/mcp',
        { jsonrpc: '2.0', id: 1, method: 'tools/list' },
        { 'mcp-protocol-version': version }
      )
    )
    assert.equal(response.status, 200, version)
  }
})

test('an unsupported MCP-Protocol-Version header is 400 and names what we do speak', async () => {
  const response = await POST(
    jsonRequest(
      '/api/mcp',
      { jsonrpc: '2.0', id: 1, method: 'tools/list' },
      { 'mcp-protocol-version': '2026-07-28' }
    )
  )
  assert.equal(response.status, 400)

  const body = await jsonBody<RpcError>(response)
  assert.equal(body.error.code, -32000)
  assert.match(body.error.message, /2026-07-28/)
  for (const version of SUPPORTED_VERSIONS) {
    assert.match(body.error.message, new RegExp(version), `${version} should be listed`)
  }
})

// The spec tells a server with no other way to identify the version to assume
// 2025-03-26 rather than reject. Nothing here answers differently per revision,
// so the request simply proceeds.
test('a request with no MCP-Protocol-Version header is served, not rejected', async () => {
  const { status } = await rpc<RpcResult<{ tools: unknown[] }>>('tools/list')
  assert.equal(status, 200)
})

// 2025-03-26 let a client batch messages into an array and 2025-06-18 removed
// it again. This switch handles one message per request either way, so the
// point of the test is that a batching client is told which it is.
test('a batched array body is refused with a message that names batching', async () => {
  const response = await POST(
    jsonRequest('/api/mcp', [
      { jsonrpc: '2.0', id: 1, method: 'ping' },
      { jsonrpc: '2.0', id: 2, method: 'tools/list' },
    ])
  )
  assert.equal(response.status, 400)

  const body = await jsonBody<RpcError>(response)
  assert.equal(body.error.code, -32600)
  assert.match(body.error.message, /batching/i)
})

// "Servers MUST validate the Origin header on all incoming connections", and
// since 2025-11-25 an invalid one MUST be answered with 403. Only browsers set
// Origin, and a browser could never read an answer from here anyway, so this
// costs real MCP clients nothing.
test('a foreign Origin is refused with 403 on both POST and GET', async () => {
  const posted = await POST(
    jsonRequest(
      '/api/mcp',
      { jsonrpc: '2.0', id: 1, method: 'tools/list' },
      { origin: 'https://evil.example' }
    )
  )
  assert.equal(posted.status, 403)
  assert.equal((await jsonBody<RpcError>(posted)).id, null, 'no request id can be attributed')

  const got = await GET(getRequest('/api/mcp', { origin: 'https://evil.example' }))
  assert.equal(got.status, 403)
})

test('the endpoint own origin is accepted, and so is no Origin at all', async () => {
  const labelled = await POST(
    jsonRequest('/api/mcp', { jsonrpc: '2.0', id: 1, method: 'tools/list' }, { origin: ORIGIN })
  )
  assert.equal(labelled.status, 200)

  const { status } = await rpc<RpcResult<{ tools: unknown[] }>>('tools/list')
  assert.equal(status, 200, 'MCP clients are not browsers and send no Origin')
})

// Behind a proxy the request URL carries the internal host, so the public
// origin has to come from the configured base URL or a browser on the real site
// would be turned away.
test('NEXT_PUBLIC_BASE_URL widens the accepted Origin to the public site', async () => {
  const previous = process.env.NEXT_PUBLIC_BASE_URL
  process.env.NEXT_PUBLIC_BASE_URL = 'https://vanisec.clouddrove.com/'
  try {
    const response = await POST(
      jsonRequest(
        '/api/mcp',
        { jsonrpc: '2.0', id: 1, method: 'tools/list' },
        { origin: 'https://vanisec.clouddrove.com' }
      )
    )
    assert.equal(response.status, 200)
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_BASE_URL
    else process.env.NEXT_PUBLIC_BASE_URL = previous
  }
})

test('tools/list offers the create tool and nothing else', async () => {
  const { body } = await rpc<
    RpcResult<{ tools: { name: string; inputSchema: Record<string, unknown> }[] }>
  >('tools/list')

  assert.deepEqual(
    body.result.tools.map((t) => t.name),
    ['vanisec_create_secret']
  )
  const schema = body.result.tools[0].inputSchema
  assert.deepEqual(schema.required, ['text', 'password'])
  assert.equal(schema.additionalProperties, false)
})

// The absence is the design, not an oversight: the tool exists to put the link
// password on the caller's clipboard, and over HTTP that clipboard would be the
// server's. If it ever reappears in the listing, the password starts coming
// back in responses, which is the exact outcome the tool was built to avoid.
test('vanisec_generate_secret is absent from tools/list', async () => {
  const { body } = await rpc<RpcResult<{ tools: { name: string }[] }>>('tools/list')
  assert.ok(
    !body.result.tools.some((t) => t.name === 'vanisec_generate_secret'),
    'the clipboard tool must never be advertised over HTTP'
  )
})

test('calling vanisec_generate_secret explains where to get it instead of failing blankly', async () => {
  const { body } = await rpc<RpcResult<ToolResult>>('tools/call', {
    name: 'vanisec_generate_secret',
    arguments: {},
  })
  assert.equal(body.result.isError, true)
  assert.match(body.result.content[0].text, /@clouddrove\/vanisec-mcp/)
})

test('the create tool description warns that this path is not zero knowledge', async () => {
  const { body } = await rpc<RpcResult<{ tools: { description: string }[] }>>('tools/list')
  assert.match(
    body.result.tools[0].description,
    /not zero-knowledge/i,
    'a caller choosing between this endpoint and the local package needs to know the difference'
  )
})

test('prompts/list returns both prompts with their argument requirements', async () => {
  const { body } = await rpc<
    RpcResult<{ prompts: { name: string; arguments: { name: string; required?: boolean }[] }[] }>
  >('prompts/list')

  assert.deepEqual(
    body.result.prompts.map((p) => p.name),
    ['share-credential', 'rotate-and-share']
  )
  const rotate = body.result.prompts[1]
  assert.deepEqual(
    rotate.arguments.filter((a) => a.required).map((a) => a.name),
    ['credential']
  )
})

test('prompts/get share-credential works with no arguments at all', async () => {
  const { body } = await rpc<
    RpcResult<{ description: string; messages: { content: { text: string } }[] }>
  >('prompts/get', { name: 'share-credential' })

  const text = body.result.messages[0].content.text
  assert.match(text, /share a credential through Vanisec/i)
  // The hosted wording has to point at the package rather than at a tool this
  // endpoint does not serve.
  assert.match(text, /npx -y @clouddrove\/vanisec-mcp/)
  assert.match(text, /different channel/i)
  assert.match(text, /once destroys the secret/i)
})

test('prompts/get share-credential reflects whether the credential already exists', async () => {
  const asText = async (args: Record<string, unknown>) => {
    const { body } = await rpc<RpcResult<{ messages: { content: { text: string } }[] }>>(
      'prompts/get',
      { name: 'share-credential', arguments: args }
    )
    return body.result.messages[0].content.text
  }

  assert.match(await asText({ alreadyExists: 'yes' }), /already exists somewhere else/)
  assert.match(await asText({ alreadyExists: 'no' }), /does not exist yet/)
  assert.match(await asText({}), /have not said whether/)
})

test('prompts/get rotate-and-share hands over before revoking', async () => {
  const { body } = await rpc<RpcResult<{ messages: { content: { text: string } }[] }>>(
    'prompts/get',
    { name: 'rotate-and-share', arguments: { credential: 'Postgres password', recipient: 'Priya' } }
  )
  const text = body.result.messages[0].content.text

  assert.match(text, /rotate the Postgres password/)
  assert.match(text, /to Priya/)
  assert.ok(
    text.indexOf('Send the link to') < text.indexOf('revoke or delete the old'),
    'revoking first locks out everything still using the old credential'
  )
})

test('prompts/get rejects a missing required argument as invalid params', async () => {
  const { body } = await rpc<RpcError>('prompts/get', { name: 'rotate-and-share', arguments: {} })
  assert.equal(body.error.code, -32602)
  assert.match(body.error.message, /credential/)
})

test('prompts/get rejects an unknown prompt name', async () => {
  const { body } = await rpc<RpcError>('prompts/get', { name: 'no-such-prompt' })
  assert.equal(body.error.code, -32602)
})

test('an unknown method is Method not found, not Invalid params', async () => {
  const { body } = await rpc<RpcError>('resources/list')
  assert.equal(body.error.code, -32601)
  assert.match(body.error.message, /resources\/list/)
})

test('an unknown tool is Invalid params, not Method not found', async () => {
  const { body } = await rpc<RpcError>('tools/call', { name: 'vanisec_delete_everything' })
  assert.equal(body.error.code, -32602)
  assert.match(body.error.message, /vanisec_delete_everything/)
})

test('ping answers and notifications/initialized answers with no body', async () => {
  const { body } = await rpc<RpcResult<Record<string, never>>>('ping')
  assert.deepEqual(body.result, {})

  const notified = await POST(
    jsonRequest('/api/mcp', { jsonrpc: '2.0', method: 'notifications/initialized' })
  )
  assert.equal(notified.status, 202)
  assert.equal(await notified.text(), '')
})

test('a body that is not JSON is a parse error', async () => {
  const response = await POST(rawRequest('/api/mcp', 'not json at all'))
  assert.equal(response.status, 400)
  const body = await jsonBody<RpcError>(response)
  assert.equal(body.error.code, -32700)
})

test('a body without jsonrpc 2.0 is an invalid request', async () => {
  const response = await POST(jsonRequest('/api/mcp', { id: 7, method: 'initialize' }))
  assert.equal(response.status, 400)
  const body = await jsonBody<RpcError>(response)
  assert.equal(body.error.code, -32600)
  assert.equal(body.id, 7, 'the id has to come back so the client can settle the call')
})

test('an oversized declared body is refused before it is read', async () => {
  const response = await POST(
    jsonRequest(
      '/api/mcp',
      { jsonrpc: '2.0', id: 1, method: 'initialize' },
      { 'content-length': String(2_000_000) }
    )
  )
  assert.equal(response.status, 413)
})

// A GET here is a client probing for an SSE stream. The spec lets a server
// decline with 405, so the status and the Allow header stay exactly as they
// were. What changed is the body: it is now a JSON-RPC error, so a client that
// only knows how to read JSON-RPC learns this endpoint is JSON mode rather than
// broken or moved. The old flat shape is preserved under error.data.
test('GET declines the SSE stream as a JSON-RPC error and keeps the 405', async () => {
  const response = await GET(getRequest('/api/mcp'))
  assert.equal(response.status, 405)
  assert.equal(response.headers.get('Allow'), 'POST')

  const body = await jsonBody<{
    jsonrpc: string
    id: null
    error: {
      code: number
      message: string
      data: { documentation: string; preferred: string; protocolVersions: string[]; iterations: number }
    }
  }>(response)

  assert.equal(body.jsonrpc, '2.0')
  assert.equal(body.id, null, 'a GET carries no request to answer')
  assert.equal(typeof body.error.code, 'number')
  assert.match(body.error.message, /does not open an SSE stream/i)
  assert.match(body.error.message, /POST/)
  assert.match(body.error.data.preferred, /@clouddrove\/vanisec-mcp/)
  assert.match(body.error.data.documentation, /vanisec\.clouddrove\.com\/mcp/)
  assert.deepEqual(body.error.data.protocolVersions, SUPPORTED_VERSIONS)
  assert.equal(body.error.data.iterations, 600_000)
})

test('tools/call creates a secret and returns a link on this origin', async () => {
  const previous = process.env.NEXT_PUBLIC_BASE_URL
  delete process.env.NEXT_PUBLIC_BASE_URL
  try {
    const { body } = await rpc<RpcResult<ToolResult>>(
      'tools/call',
      { name: 'vanisec_create_secret', arguments: { text: 'hunter2', password: 'pw', expiresIn: 1 } },
      '10.0.0.1'
    )
    assert.notEqual(body.result.isError, true)
    assert.match(body.result.content[0].text, /http:\/\/vanisec\.test\/secret\/[0-9a-f-]{36}/)
    assert.match(body.result.content[0].text, /different channel/)
  } finally {
    if (previous !== undefined) process.env.NEXT_PUBLIC_BASE_URL = previous
  }
})

test('NEXT_PUBLIC_BASE_URL wins over the request origin and loses its trailing slash', async () => {
  const previous = process.env.NEXT_PUBLIC_BASE_URL
  process.env.NEXT_PUBLIC_BASE_URL = 'https://vanisec.clouddrove.com/'
  try {
    const { body } = await rpc<RpcResult<ToolResult>>(
      'tools/call',
      { name: 'vanisec_create_secret', arguments: { text: 'hunter2', password: 'pw' } },
      '10.0.0.2'
    )
    assert.match(body.result.content[0].text, /https:\/\/vanisec\.clouddrove\.com\/secret\//)
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_BASE_URL
    else process.env.NEXT_PUBLIC_BASE_URL = previous
  }
})

test('create rejects bad arguments as tool errors rather than protocol errors', async () => {
  const cases: [string, Record<string, unknown>, RegExp][] = [
    ['empty text', { text: '   ', password: 'pw' }, /text must be a non-empty string/],
    ['missing password', { text: 'x' }, /password must be a non-empty string/],
    ['oversized text', { text: 'x'.repeat(100_001), password: 'pw' }, /at most 100000 characters/],
    ['unlisted expiry', { text: 'x', password: 'pw', expiresIn: 5 }, /expiresIn must be one of/],
    ['expiry as a string', { text: 'x', password: 'pw', expiresIn: '24' }, /expiresIn must be one of/],
  ]

  for (const [name, args, expected] of cases) {
    const { body } = await rpc<RpcResult<ToolResult>>(
      'tools/call',
      { name: 'vanisec_create_secret', arguments: args },
      '10.0.1.1'
    )
    assert.equal(body.result.isError, true, name)
    assert.match(body.result.content[0].text, expected, name)
  }
})

// The call budget is the only thing standing between this endpoint and a free
// PBKDF2 oracle, since every accepted call burns 600k iterations of server CPU.
test('tools/call is capped per IP and answers 429 with Retry-After', async () => {
  const args = { name: 'vanisec_create_secret', arguments: { text: '', password: '' } }
  for (let i = 0; i < 20; i++) {
    const { status } = await rpc<RpcResult<ToolResult>>('tools/call', args, '10.0.2.1')
    assert.equal(status, 200, `call ${i + 1} should still be inside the budget`)
  }

  const response = await POST(
    jsonRequest('/api/mcp', { jsonrpc: '2.0', id: 1, method: 'tools/call', params: args }, {
      'x-real-ip': '10.0.2.1',
    })
  )
  assert.equal(response.status, 429)
  assert.ok(Number(response.headers.get('Retry-After')) > 0)
  const body = await jsonBody<RpcError>(response)
  assert.equal(body.error.code, -32000)
})

// --- pairing codes ---
//
// The hosted endpoint mints in-process rather than over HTTP, but the rule is
// the same one the published package follows: the secret is already live and
// single-use by the time a code is requested, so nothing about pairing may cost
// the caller the url.

type ToolCall = { result: { content: { type: string; text: string }[]; isError?: boolean } }

async function callCreate(args: Record<string, unknown>) {
  const { body } = await rpc<ToolCall>('tools/call', {
    name: 'vanisec_create_secret',
    arguments: args,
  })
  return body.result
}

test('the create tool advertises pairingCode as an optional boolean', async () => {
  const { body } = await rpc<{ result: { tools: { name: string; inputSchema: any }[] } }>(
    'tools/list'
  )
  const create = body.result.tools.find((t) => t.name === 'vanisec_create_secret')!
  assert.equal(create.inputSchema.properties.pairingCode.type, 'boolean')
  assert.ok(
    !create.inputSchema.required.includes('pairingCode'),
    'pairing is a convenience and must not become a required argument'
  )
})

test('a create with pairingCode returns a typeable code and where to type it', async () => {
  const result = await callCreate({ text: 'x', password: 'pw', pairingCode: true })
  assert.ok(!result.isError)
  assert.match(result.content[0].text, /Pairing code: [0-9A-Z]{4}-[0-9A-Z]{4}/)
  assert.match(result.content[0].text, /5 minutes/)
  assert.match(result.content[0].text, /\/c\b/)
})

test('a create without pairingCode says nothing about pairing', async () => {
  const result = await callCreate({ text: 'x', password: 'pw' })
  assert.ok(!/pairing code/i.test(result.content[0].text))
})

test('the pairing code from a create actually redeems to that secret', async () => {
  const result = await callCreate({ text: 'x', password: 'pw', pairingCode: true })
  const code = /Pairing code: ([0-9A-Z-]+)/.exec(result.content[0].text)![1]
  const url = /\/secret\/([0-9a-f-]+)/.exec(result.content[0].text)![1]

  const { redeemCode } = await import('@/lib/pairing')
  assert.equal(await redeemCode(code), url, 'the code shown must open the secret it was shown with')
})

test('a non-boolean pairingCode is rejected before anything is stored', async () => {
  const result = await callCreate({ text: 'x', password: 'pw', pairingCode: 'yes' })
  assert.ok(result.isError)
  assert.match(result.content[0].text, /pairingCode/)
  assert.equal((await getRedisClient().keys('secret:*')).length, 0)
})
