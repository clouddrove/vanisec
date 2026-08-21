// Server instructions are the only guidance surface that reaches most clients.
// Prompts are close to unreachable outside VS Code, so if these ever go missing
// the rule about choosing between the two tools reaches nobody, and nothing
// else in the suite would notice.
//
// Asserted through a real SDK client rather than by reading the exported
// constant, because the constant being right is worthless if it never makes it
// into the initialize response.
//
// The hosted route sets its own instructions and is deliberately not covered
// here. Importing it pulls in next/server, ioredis and uuid, which live in the
// root install rather than this package's, so this suite would only pass where
// the whole app happens to be installed alongside it. This package has to build
// and test on its own. The hosted half lives in the root suite instead, in
// test/hosted-instructions.test.ts.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { buildServer } from '../src/index.js'

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

test('stdio returns non-empty instructions at initialization', async () => {
  const instructions = await stdioInstructions()
  assert.equal(typeof instructions, 'string')
  assert.ok((instructions ?? '').trim().length > 0, 'a client with no prompt surface gets nothing')
})

test(`stdio names the generating tool inside the first ${BUDGET} characters`, async () => {
  const head = (await stdioInstructions())!.slice(0, BUDGET)
  assert.match(
    head,
    /vanisec_generate_secret/,
    'the tool that keeps the secret out of the conversation must survive truncation'
  )
})

test(`stdio states the two rules about the link inside the first ${BUDGET} characters`, async () => {
  const head = (await stdioInstructions())!.slice(0, BUDGET)
  assert.match(head, /different channels/i, 'the password must travel separately from the link')
  assert.match(head, /once destroys the secret/i, 'the link being single-use must be called out')
})

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

test('stdio explains pairing codes, outside the kept prefix', async () => {
  const instructions = (await stdioInstructions())!
  assert.match(instructions, /pairingCode/, 'the option is invisible unless the instructions name it')
  assert.ok(
    instructions.indexOf('pairingCode') > BUDGET,
    'pairing is a convenience and must not crowd out the rules that change what a model does'
  )
})

test('stdio explains the clip tool, outside the kept prefix', async () => {
  const instructions = (await stdioInstructions())!
  assert.match(instructions, /vanisec_create_clip/)
  assert.ok(
    instructions.indexOf('vanisec_create_clip') > BUDGET,
    'the clip tool is a convenience and must not crowd out the rules that change what a model does'
  )
})
