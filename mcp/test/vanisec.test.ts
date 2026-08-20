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

// --- pairing codes ---
//
// The rule that matters here is what happens when minting fails. By that point
// the secret exists and is single-use, so anything that loses the url loses the
// secret outright: it sits in Redis with nobody holding the link. Every failure
// path below therefore has to end with the caller still getting the url.

// Routes by path so both hops in a paired create can be answered separately.
function routedFetch(
  handlers: { create?: () => Response; pair?: () => Response },
  log?: string[]
) {
  return async (url: string) => {
    log?.push(String(url))
    if (String(url).includes('/api/pair')) {
      return handlers.pair?.() ?? new Response('{}', { status: 404 })
    }
    return handlers.create?.() ?? new Response(JSON.stringify({ id: 'the-id' }), { status: 200 })
  }
}

function ok(body: unknown): () => Response {
  return () =>
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
}

test('asks for a pairing code only when one was requested', async () => {
  const calls: string[] = []
  await createSecret({ text: 'x', password: 'pw', fetchImpl: routedFetch({}, calls) as never })
  assert.equal(calls.length, 1, 'an unrequested code should cost no extra round trip')
  assert.ok(!calls[0].includes('/api/pair'))
})

test('returns the pairing code alongside the link when requested', async () => {
  const calls: string[] = []
  const res = await createSecret({
    text: 'x',
    password: 'pw',
    pairingCode: true,
    fetchImpl: routedFetch({ pair: ok({ code: '4F2K-9QX1', expiresIn: 300 }) }, calls) as never,
  })

  assert.equal(calls.length, 2)
  assert.ok(calls[1].endsWith('/api/pair'))
  assert.equal(res.url, `${baseUrl()}/secret/the-id`)
  assert.equal(res.pairingCode, '4F2K-9QX1')
  assert.equal(res.pairingCodeExpiresIn, 300)
})

test('still returns the link when the pairing mint is refused', async () => {
  const res = await createSecret({
    text: 'x',
    password: 'pw',
    pairingCode: true,
    fetchImpl: routedFetch({
      pair: () => new Response(JSON.stringify({ error: 'nope' }), { status: 404 }),
    }) as never,
  })

  assert.equal(res.url, `${baseUrl()}/secret/the-id`)
  assert.equal(res.pairingCode, undefined, 'a failed mint must not invent a code')
})

test('still returns the link when the pairing mint throws', async () => {
  const res = await createSecret({
    text: 'x',
    password: 'pw',
    pairingCode: true,
    fetchImpl: (async (url: string) => {
      if (String(url).includes('/api/pair')) throw new Error('ECONNRESET')
      return new Response(JSON.stringify({ id: 'the-id' }), { status: 200 })
    }) as never,
  })

  assert.equal(res.url, `${baseUrl()}/secret/the-id`, 'the secret is already live; losing the url loses it')
  assert.equal(res.pairingCode, undefined)
})

test('still returns the link when the pairing response is malformed', async () => {
  const res = await createSecret({
    text: 'x',
    password: 'pw',
    pairingCode: true,
    fetchImpl: routedFetch({ pair: ok({ code: '4F2K-9QX1' }) }) as never,
  })
  assert.equal(res.url, `${baseUrl()}/secret/the-id`)
  assert.equal(res.pairingCode, undefined, 'a code with no expiry cannot be shown with a countdown')
})
