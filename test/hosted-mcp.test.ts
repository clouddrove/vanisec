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
import { jsonRequest, rawRequest, jsonBody } from './support/http'

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

  assert.equal(body.result.protocolVersion, '2024-11-05')
  // Declaring a capability the switch has no case for makes a client issue
  // requests that fall through to "Method not found".
  assert.deepEqual(body.result.capabilities, { tools: {}, prompts: {} })
  assert.equal(body.result.serverInfo.name, 'vanisec-hosted')
  assert.ok(body.result.instructions.trim().length > 0)
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

test('GET declines with 405 and points at the documentation', async () => {
  const response = await GET()
  assert.equal(response.status, 405)
  assert.equal(response.headers.get('Allow'), 'POST')

  const body = await jsonBody<{ documentation: string; preferred: string; iterations: number }>(
    response
  )
  assert.match(body.preferred, /@clouddrove\/vanisec-mcp/)
  assert.equal(body.iterations, 600_000)
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
