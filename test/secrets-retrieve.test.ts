// GET and POST /api/secrets/[id] are where the one-time guarantee and the
// password gate actually happen.
//
// Two properties matter enough to pin down. First, a wrong password must not
// destroy the secret, or anyone with the link could burn it; that is also why
// the guess budget exists, since without it the gate is an unlimited online
// oracle. Second, a correct password must destroy it exactly once.
//
// Storage runs against the in-memory Redis stand-in installed by
// test/support/redisHooks.mjs. The stand-in serves GETDEL from a single
// JavaScript thread, so it cannot demonstrate that the real command is atomic;
// test/integration/redis.test.ts does that against a real Redis.

import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { GET, POST } from '@/app/api/secrets/[id]/route'
import { createSecret, peekSecret } from '@/lib/secrets'
import { getRedisClient } from '@/lib/redis'
import { hashVerifier } from '@/lib/serverCrypto'
import { PBKDF2_ITERATIONS, LEGACY_PBKDF2_ITERATIONS } from '@/lib/kdfParams'
import { jsonRequest, getRequest, routeParams, jsonBody } from './support/http'

const VERIFIER = 'dGhlLXJpZ2h0LXZlcmlmaWVy'
const WRONG = 'dGhlLXdyb25nLXZlcmlmaWVy'

let ipCounter = 0
function nextIp(): string {
  ipCounter += 1
  return `198.51.100.${ipCounter % 250}`
}

async function seed(overrides: Record<string, unknown> = {}): Promise<string> {
  return createSecret({
    ciphertext: 'Y2lwaGVydGV4dA',
    iv: 'aXYtYnl0ZXM',
    passwordProtected: true,
    encSalt: 'ZW5jLXNhbHQ',
    authSalt: 'YXV0aC1zYWx0',
    verifierHash: hashVerifier(VERIFIER),
    iterations: PBKDF2_ITERATIONS,
    expiresIn: 24,
    ...overrides,
  })
}

// Writes a record straight into storage so its timestamps can be chosen. Going
// through createSecret would only ever produce a future expiry.
async function seedRaw(record: Record<string, unknown>): Promise<string> {
  const id = 'seeded-' + String(++ipCounter)
  await getRedisClient().setex(`secret:${id}`, 600, JSON.stringify({ id, ...record }))
  return id
}

function peek(id: string, ip = nextIp()) {
  return GET(getRequest(`/api/secrets/${id}`, { 'x-real-ip': ip }), routeParams(id))
}

function claim(id: string, verifier: unknown, ip = nextIp()) {
  return POST(jsonRequest(`/api/secrets/${id}`, { verifier }, { 'x-real-ip': ip }), routeParams(id))
}

beforeEach(async () => {
  await getRedisClient().flushall()
})

test('the metadata read hands back only what is needed to compute the verifier', async () => {
  const id = await seed()
  const response = await peek(id)

  assert.equal(response.status, 401)
  const body = await jsonBody<Record<string, unknown>>(response)
  assert.equal(body.requiresPassword, true)
  assert.equal(body.authSalt, 'YXV0aC1zYWx0')
  assert.equal(body.iterations, PBKDF2_ITERATIONS)
  assert.equal(
    body.encSalt,
    undefined,
    'the key-derivation salt must stay back until the verifier is accepted'
  )
  assert.equal(body.ciphertext, undefined)
})

test('the metadata read does not consume the secret', async () => {
  const id = await seed()
  await peek(id)
  await peek(id)
  assert.ok(await peekSecret(id), 'looking at a link must not spend it')
})

test('a secret written before the work factor was stored derives with the legacy value', async () => {
  const id = await seedRaw({
    ciphertext: 'Y2lwaGVydGV4dA',
    iv: 'aXYtYnl0ZXM',
    passwordProtected: true,
    encSalt: 'ZW5jLXNhbHQ',
    authSalt: 'YXV0aC1zYWx0',
    verifierHash: hashVerifier(VERIFIER),
    createdAt: 1,
    expiresAt: Date.now() + 3_600_000,
  })

  const body = await jsonBody<{ iterations: number }>(await peek(id))
  assert.equal(body.iterations, LEGACY_PBKDF2_ITERATIONS)
})

test('an unknown id is not found', async () => {
  const response = await peek('00000000-0000-4000-8000-000000000000')
  assert.equal(response.status, 404)
})

test('an expired secret is reported as expired and removed', async () => {
  const id = await seedRaw({
    ciphertext: 'Y2lwaGVydGV4dA',
    iv: 'aXYtYnl0ZXM',
    passwordProtected: true,
    authSalt: 'YXV0aC1zYWx0',
    verifierHash: hashVerifier(VERIFIER),
    iterations: PBKDF2_ITERATIONS,
    createdAt: 1,
    expiresAt: 2, // a fixed instant in 1970, so this never depends on the clock
  })

  const response = await peek(id)
  assert.equal(response.status, 410)
  assert.equal(await peekSecret(id), null, 'an expired record must not linger in storage')
})

test('a wrong password is refused without destroying the secret', async () => {
  const id = await seed()

  const response = await claim(id, WRONG)
  assert.equal(response.status, 401)
  const body = await jsonBody<{ error: string; attemptsRemaining: number }>(response)
  assert.equal(body.error, 'Invalid password')
  assert.ok(body.attemptsRemaining >= 0)

  assert.ok(await peekSecret(id), 'a guess must not burn the link for its rightful recipient')
  assert.equal((await claim(id, VERIFIER)).status, 200, 'the right password still works afterwards')
})

test('a verifier that is not a string is refused like any other wrong guess', async () => {
  const id = await seed()
  for (const verifier of [undefined, null, 42, { toString: () => VERIFIER }, [VERIFIER]]) {
    assert.equal((await claim(id, verifier)).status, 401, JSON.stringify(verifier))
  }
  assert.ok(await peekSecret(id))
})

test('the right password returns the ciphertext together with the key-derivation salt', async () => {
  const id = await seed()
  const response = await claim(id, VERIFIER)

  assert.equal(response.status, 200)
  const body = await jsonBody<Record<string, unknown>>(response)
  assert.equal(body.ciphertext, 'Y2lwaGVydGV4dA')
  assert.equal(body.iv, 'aXYtYnl0ZXM')
  assert.equal(body.encSalt, 'ZW5jLXNhbHQ')
  assert.equal(body.iterations, PBKDF2_ITERATIONS)
  assert.equal(body.verifierHash, undefined, 'the server-side gate value must never go out')
})

test('the link is dead after one successful retrieval', async () => {
  const id = await seed()
  assert.equal((await claim(id, VERIFIER)).status, 200)

  const second = await claim(id, VERIFIER)
  assert.ok([404, 410].includes(second.status), `expected the link to be dead, got ${second.status}`)
  assert.equal(await peekSecret(id), null)
})

test('two retrievals issued together yield exactly one ciphertext', async () => {
  const id = await seed()
  const results = await Promise.all([claim(id, VERIFIER), claim(id, VERIFIER)])
  const succeeded = results.filter((r) => r.status === 200)
  assert.equal(succeeded.length, 1, 'the take has to win exactly once')
})

test('a retrieval on an expired secret is refused and clears the record', async () => {
  const id = await seedRaw({
    ciphertext: 'Y2lwaGVydGV4dA',
    iv: 'aXYtYnl0ZXM',
    passwordProtected: true,
    authSalt: 'YXV0aC1zYWx0',
    verifierHash: hashVerifier(VERIFIER),
    iterations: PBKDF2_ITERATIONS,
    createdAt: 1,
    expiresAt: 2,
  })

  assert.equal((await claim(id, VERIFIER)).status, 410)
  assert.equal(await peekSecret(id), null)
})

// Without this cap the verifier gate is an offline-strength brute force run
// online, since a wrong guess costs the attacker nothing.
test('guesses against one secret are capped, whichever address they come from', async () => {
  const id = await seed()

  for (let i = 0; i < 10; i++) {
    assert.equal((await claim(id, WRONG)).status, 401, `guess ${i + 1}`)
  }

  const response = await claim(id, WRONG)
  assert.equal(response.status, 429)
  assert.ok(Number(response.headers.get('Retry-After')) > 0)
  assert.match((await jsonBody<{ error: string }>(response)).error, /this secret/)

  // Still capped for the right password, which is the cost of the defence.
  assert.equal((await claim(id, VERIFIER)).status, 429)
  assert.ok(await peekSecret(id), 'being rate limited must not destroy the secret either')
})

test('guesses from one address are capped across different secrets', async () => {
  const ip = '203.0.113.44'
  for (let i = 0; i < 60; i++) {
    const id = await seed()
    assert.equal((await claim(id, WRONG, ip)).status, 401, `guess ${i + 1}`)
  }

  const id = await seed()
  const response = await claim(id, WRONG, ip)
  assert.equal(response.status, 429)
  assert.match((await jsonBody<{ error: string }>(response)).error, /Too many attempts/)
})

test('metadata reads are capped per address', async () => {
  const ip = '203.0.113.55'
  const id = await seed()
  for (let i = 0; i < 120; i++) {
    assert.equal((await peek(id, ip)).status, 401, `peek ${i + 1}`)
  }
  assert.equal((await peek(id, ip)).status, 429)
})
