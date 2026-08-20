// Server instructions are the only guidance surface that reaches most clients.
// Prompts are close to unreachable outside VS Code, so if these go missing the
// rules about the link and about preferring the local package reach nobody.
//
// These assertions once lived in mcp/test/instructions.test.ts next to the
// stdio ones. They had to come out: importing the hosted route pulls in
// next/server, ioredis and uuid, which belong to the root install and not to
// the published package, so the mcp suite only passed where the whole app
// happened to be installed alongside it. They live here instead, where those
// dependencies are the ones already in use, and the mcp package keeps building
// and testing on its own.
//
// The hosted wording deliberately differs from stdio: only vanisec_create_secret
// is reachable here, so the hosted copy names the generating tool as the better
// path and says how to install it, rather than telling the caller to invoke
// something this endpoint does not serve. That also means the stdio ordering
// assertion, which requires the generating tool to be introduced first, does
// not apply and is not repeated.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { POST } from '@/app/api/mcp/route'
import { jsonRequest, jsonBody } from './support/http'

// Codex keeps the first 512 characters of the instructions and warns that the
// remainder may be truncated, so that prefix has to stand on its own.
const BUDGET = 512

async function hostedInstructions(): Promise<string> {
  const response = await POST(
    jsonRequest('/api/mcp', { jsonrpc: '2.0', id: 1, method: 'initialize' })
  )
  const body = await jsonBody<{ result: { instructions?: string } }>(response)
  return body.result.instructions ?? ''
}

test('the hosted endpoint returns non-empty instructions at initialization', async () => {
  const instructions = await hostedInstructions()
  assert.ok(instructions.trim().length > 0, 'a client with no prompt surface gets nothing')
})

test(`the hosted endpoint names the generating tool inside the first ${BUDGET} characters`, async () => {
  const head = (await hostedInstructions()).slice(0, BUDGET)
  assert.match(
    head,
    /vanisec_generate_secret/,
    'the tool that keeps the secret out of the conversation must survive truncation'
  )
})

test(`the hosted endpoint states the two rules about the link inside the first ${BUDGET} characters`, async () => {
  const head = (await hostedInstructions()).slice(0, BUDGET)
  assert.match(head, /different channels/i, 'the password must travel separately from the link')
  assert.match(head, /once destroys the secret/i, 'the link being single-use must be called out')
})

// Outside the kept prefix on purpose: it is context rather than a rule to act
// on. It still has to be there, because it is the only place a caller is told
// that this endpoint sees the plaintext and the local package does not.
test('the not zero-knowledge caveat survives somewhere in the hosted instructions', async () => {
  const instructions = await hostedInstructions()
  assert.match(instructions, /not zero-knowledge/i)
  assert.match(
    instructions,
    /npx -y @clouddrove\/vanisec-mcp/,
    'naming the safer path is useless without saying how to install it'
  )
})
