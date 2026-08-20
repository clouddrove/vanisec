// Server instructions are the only guidance surface that reaches most clients.
// Prompts are close to unreachable outside VS Code, so if these ever go missing
// the rule about choosing between the two tools reaches nobody, and nothing
// else in the suite would notice.
//
// The stdio side is asserted through a real SDK client rather than by reading
// the exported constant, because the constant being right is worthless if it
// never makes it into the initialize response.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { NextRequest } from 'next/server'
import { buildServer } from '../src/index.js'
import { POST } from '@/app/api/mcp/route'

// Codex keeps the first 512 characters of the instructions and warns that the
// remainder may be truncated, so that prefix has to stand on its own.
const BUDGET = 512

async function stdioInstructions(): Promise<string | undefined> {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
  const client = new Client({ name: 'instructions-test', version: '0.0.0' })
  await Promise.all([buildServer().connect(serverTransport), client.connect(clientTransport)])
  try {
    return client.getInstructions()
  } finally {
    await client.close()
  }
}

async function hostedInstructions(): Promise<string | undefined> {
  const request = new NextRequest('https://vanisec.example/api/mcp', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'instructions-test', version: '0.0.0' },
      },
    }),
  })
  const body = (await (await POST(request)).json()) as { result?: { instructions?: string } }
  return body.result?.instructions
}

for (const [transport, load] of [
  ['stdio', stdioInstructions],
  ['hosted', hostedInstructions],
] as const) {
  test(`${transport} returns non-empty instructions at initialization`, async () => {
    const instructions = await load()
    assert.equal(typeof instructions, 'string')
    assert.ok((instructions ?? '').trim().length > 0, 'a client with no prompt surface gets nothing')
  })

  test(`${transport} names the generating tool inside the first ${BUDGET} characters`, async () => {
    const head = (await load())!.slice(0, BUDGET)
    assert.match(
      head,
      /vanisec_generate_secret/,
      'the tool that keeps the secret out of the conversation must survive truncation'
    )
  })

  test(`${transport} states the two rules about the link inside the first ${BUDGET} characters`, async () => {
    const head = (await load())!.slice(0, BUDGET)
    assert.match(head, /different channels/i, 'the password must travel separately from the link')
    assert.match(head, /once destroys the secret/i, 'the link being single-use must be called out')
  })
}

test('stdio puts the tool-choice rule ahead of the tool it steers away from', async () => {
  const instructions = (await stdioInstructions())!
  assert.ok(
    instructions.indexOf('vanisec_generate_secret') < instructions.indexOf('vanisec_create_secret'),
    'the generating tool is the default and must be presented first'
  )
  assert.ok(
    instructions.indexOf('vanisec_create_secret') < BUDGET,
    'the caveat about the pasting tool is useless if it falls outside the kept prefix'
  )
})

test('hosted instructions keep the caveat that this path is not zero-knowledge', async () => {
  const instructions = (await hostedInstructions())!
  assert.match(instructions, /not zero-knowledge/i)
  assert.match(instructions, /@clouddrove\/vanisec-mcp/, 'the local package is how to avoid this path')
})
