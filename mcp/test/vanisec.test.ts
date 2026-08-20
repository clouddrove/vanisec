import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createSecret, baseUrl, VanisecApiError } from '../src/vanisec.js'
import { decryptWithPassword } from '@lib/clientCrypto'

function stubFetch(status: number, body: unknown, capture?: { body?: any }) {
  return async (_url: string, init?: RequestInit) => {
    if (capture) capture.body = JSON.parse(String(init?.body))
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

test('sends ciphertext, never the plaintext or the password', async () => {
  const cap: { body?: any } = {}
  await createSecret({
    text: 'super secret value',
    password: 'pw',
    fetchImpl: stubFetch(200, { id: 'abc' }, cap) as never,
  })

  const sent = JSON.stringify(cap.body)
  assert.ok(!sent.includes('super secret value'), 'plaintext leaked to the wire')
  assert.ok(!sent.includes('"pw"'), 'password leaked to the wire')
  assert.ok(cap.body.ciphertext.length > 0)
  assert.equal(cap.body.passwordProtected, true)
  assert.ok(cap.body.iterations >= 600000)
})

test('the uploaded ciphertext decrypts back to the envelope', async () => {
  const cap: { body?: any } = {}
  await createSecret({ text: 'hello', password: 'pw', fetchImpl: stubFetch(200, { id: 'abc' }, cap) as never })

  const out = await decryptWithPassword(
    { ciphertext: cap.body.ciphertext, iv: cap.body.iv },
    'pw',
    cap.body.encSalt,
    cap.body.iterations
  )
  assert.deepEqual(JSON.parse(out), { text: 'hello', file: null })
})

test('builds the share URL from the returned id', async () => {
  const res = await createSecret({
    text: 'x',
    password: 'pw',
    fetchImpl: stubFetch(200, { id: 'the-id' }) as never,
  })
  assert.equal(res.url, `${baseUrl()}/secret/the-id`)
  assert.ok(!Number.isNaN(Date.parse(res.expiresAt)))
})

test('surfaces a rate limit as a readable error', async () => {
  await assert.rejects(
    () => createSecret({ text: 'x', password: 'pw', fetchImpl: stubFetch(429, { error: 'Too many' }) as never }),
    (e: Error) => e instanceof VanisecApiError && /rate limit/i.test(e.message)
  )
})

test('surfaces an oversized payload as a readable error', async () => {
  await assert.rejects(
    () => createSecret({ text: 'x', password: 'pw', fetchImpl: stubFetch(413, {}) as never }),
    (e: Error) => e instanceof VanisecApiError && /too large/i.test(e.message)
  )
})

test('does not retry a network failure', async () => {
  let calls = 0
  const failing = async () => {
    calls++
    throw new Error('ECONNREFUSED')
  }
  await assert.rejects(() => createSecret({ text: 'x', password: 'pw', fetchImpl: failing as never }))
  assert.equal(calls, 1, 'a retry could leave two live one-time links')
})

test('rejects an invalid expiry before making a request', async () => {
  let calls = 0
  const counting = async () => {
    calls++
    return new Response('{}', { status: 200 })
  }
  await assert.rejects(() =>
    createSecret({ text: 'x', password: 'pw', expiresIn: 5, fetchImpl: counting as never })
  )
  assert.equal(calls, 0)
})
