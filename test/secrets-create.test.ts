// POST /api/secrets is the only way a secret enters storage from the browser,
// and the only place the server gets to say no to a client it does not trust.
//
// The key-derivation floor is the reason this file exists. Everything about the
// password path assumes the ciphertext was produced with PBKDF2_ITERATIONS of
// work; a modified client could otherwise send iterations: 1, and the secret
// would still be accepted, stored and later decrypted with that work factor,
// because the retrieval path reads the stored value back. The check in the
// route is the whole defence and nothing proved it worked.
//
// Storage runs against the in-memory Redis stand-in installed by
// test/support/redisHooks.mjs, so no server and no Docker are involved.

import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { POST } from '@/app/api/secrets/route'
import { peekSecret } from '@/lib/secrets'
import { getRedisClient } from '@/lib/redis'
import { hashVerifier } from '@/lib/serverCrypto'
import { PBKDF2_ITERATIONS, LEGACY_PBKDF2_ITERATIONS } from '@/lib/kdfParams'
import { jsonRequest, jsonBody } from './support/http'

// The body shape the 2.0.0 rewrite settled on: ciphertext over the {text, file}
// envelope, one salt for the encryption key and another for the retrieval
// verifier, and the work factor stored alongside.
function validBody(overrides: Record<string, unknown> = {}) {
  return {
    ciphertext: 'Y2lwaGVydGV4dA',
    iv: 'aXYtYnl0ZXM',
    passwordProtected: true,
    encSalt: 'ZW5jLXNhbHQ',
    authSalt: 'YXV0aC1zYWx0',
    verifier: 'dmVyaWZpZXI',
    expiresIn: 24,
    iterations: PBKDF2_ITERATIONS,
    ...overrides,
  }
}

let ipCounter = 0

// A fresh IP per request keeps one test's creation budget out of another's.
async function create(body: Record<string, unknown>) {
  ipCounter += 1
  const response = await POST(
    jsonRequest('/api/secrets', body, { 'x-real-ip': `198.51.100.${ipCounter % 250}` })
  )
  return { status: response.status, body: await jsonBody<Record<string, unknown>>(response) }
}

beforeEach(async () => {
  await getRedisClient().flushall()
})

test('a well-formed body is accepted and returns an id', async () => {
  const { status, body } = await create(validBody())
  assert.equal(status, 200)
  assert.match(String(body.id), /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
})

test('the stored record keeps the work factor and only the hash of the verifier', async () => {
  const { body } = await create(validBody())
  const stored = await peekSecret(String(body.id))

  assert.ok(stored)
  assert.equal(stored.iterations, PBKDF2_ITERATIONS)
  assert.equal(stored.passwordProtected, true)
  assert.equal(stored.encSalt, 'ZW5jLXNhbHQ')
  assert.equal(stored.authSalt, 'YXV0aC1zYWx0')
  assert.equal(stored.verifierHash, hashVerifier('dmVyaWZpZXI'))
  assert.equal(
    JSON.stringify(stored).includes('dmVyaWZpZXI'),
    false,
    'a Redis leak must not hand an attacker a verifier it can replay against the API'
  )
})

test('expiresAt follows expiresIn hours from creation', async () => {
  const { body } = await create(validBody({ expiresIn: 6 }))
  const stored = await peekSecret(String(body.id))
  assert.ok(stored)
  assert.equal(stored.expiresAt - stored.createdAt, 6 * 60 * 60 * 1000)
})

// The key-derivation floor.

test('the current work factor is accepted', async () => {
  const { status } = await create(validBody({ iterations: PBKDF2_ITERATIONS }))
  assert.equal(status, 200)
})

test('a work factor above the floor is accepted', async () => {
  const { status } = await create(validBody({ iterations: PBKDF2_ITERATIONS * 2 }))
  assert.equal(status, 200)
})

test('one iteration below the floor is refused', async () => {
  const { status, body } = await create(validBody({ iterations: PBKDF2_ITERATIONS - 1 }))
  assert.equal(status, 400)
  assert.equal(body.error, 'Invalid key derivation parameters')
})

// The legacy factor is still honoured when reading secrets written before the
// factor was stored per-secret. It must not be a way to write new ones.
test('the legacy work factor cannot be used for a new secret', async () => {
  const { status } = await create(validBody({ iterations: LEGACY_PBKDF2_ITERATIONS }))
  assert.equal(status, 400)
})

test('a downgraded work factor is refused whatever shape it arrives in', async () => {
  const downgrades: unknown[] = [
    1,
    0,
    -1,
    1000,
    LEGACY_PBKDF2_ITERATIONS,
    PBKDF2_ITERATIONS - 1,
    PBKDF2_ITERATIONS + 0.5, // not an integer, so not a work factor at all
    String(PBKDF2_ITERATIONS), // a string compares as >= only after coercion
    Number.NaN,
    Number.POSITIVE_INFINITY,
    null,
    undefined,
    true,
    [PBKDF2_ITERATIONS],
  ]

  for (const iterations of downgrades) {
    const { status, body } = await create(validBody({ iterations }))
    assert.equal(status, 400, `iterations ${JSON.stringify(iterations)} should be refused`)
    assert.equal(body.error, 'Invalid key derivation parameters', JSON.stringify(iterations))
  }
})

test('no secret reaches storage when the work factor is refused', async () => {
  await create(validBody({ iterations: 1 }))
  const keys = await getRedisClient().keys('secret:*')
  assert.deepEqual(keys, [], 'a rejected request must not leave a weakly derived secret behind')
})

// The request body shape.

test('the envelope fields are all required', async () => {
  const missing: [string, Record<string, unknown>, string][] = [
    ['ciphertext', { ciphertext: undefined }, 'Invalid or oversized payload'],
    ['empty ciphertext', { ciphertext: '' }, 'Invalid or oversized payload'],
    ['ciphertext of the wrong type', { ciphertext: 123 }, 'Invalid or oversized payload'],
    ['iv', { iv: undefined }, 'Invalid iv'],
    ['encSalt', { encSalt: undefined }, 'Missing password protection parameters'],
    ['authSalt', { authSalt: undefined }, 'Missing password protection parameters'],
    ['verifier', { verifier: undefined }, 'Missing password protection parameters'],
  ]

  for (const [name, override, expected] of missing) {
    const { status, body } = await create(validBody(override))
    assert.equal(status, 400, name)
    assert.equal(body.error, expected, name)
  }
})

test('every secret must be password protected', async () => {
  for (const passwordProtected of [false, undefined, 'true', 1]) {
    const { status, body } = await create(validBody({ passwordProtected }))
    assert.equal(status, 400, String(passwordProtected))
    assert.equal(body.error, 'Password is required')
  }
})

test('expiry has to be one of the offered durations', async () => {
  for (const expiresIn of [1, 6, 24, 72, 168]) {
    assert.equal((await create(validBody({ expiresIn }))).status, 200, String(expiresIn))
  }
  for (const expiresIn of [0, 2, 169, -1, '24', undefined, 24.5]) {
    const { status, body } = await create(validBody({ expiresIn }))
    assert.equal(status, 400, String(expiresIn))
    assert.equal(body.error, 'Invalid expiration time')
  }
})

test('the small fixed-size fields are length capped', async () => {
  const long = 'a'.repeat(1_001)
  for (const field of ['iv', 'encSalt', 'authSalt', 'verifier']) {
    const { status } = await create(validBody({ [field]: long }))
    assert.equal(status, 400, field)
  }
})

test('ciphertext beyond the cap is refused', async () => {
  const { status, body } = await create(validBody({ ciphertext: 'a'.repeat(12_000_001) }))
  assert.equal(status, 400)
  assert.equal(body.error, 'Invalid or oversized payload')
})

test('an oversized declared body is refused before it is read', async () => {
  const response = await POST(
    jsonRequest('/api/secrets', validBody(), {
      'x-real-ip': '198.51.100.251',
      'content-length': String(16_000_001),
    })
  )
  assert.equal(response.status, 413)
})

// The creation budget is per IP, and an invalid request spends from it too, so
// a client cannot probe the validator for free.
test('creation is capped per IP and answers 429 with Retry-After', async () => {
  const ip = '203.0.113.7'
  for (let i = 0; i < 30; i++) {
    const response = await POST(jsonRequest('/api/secrets', validBody(), { 'x-real-ip': ip }))
    assert.equal(response.status, 200, `create ${i + 1} should still be inside the budget`)
  }

  const response = await POST(jsonRequest('/api/secrets', validBody(), { 'x-real-ip': ip }))
  assert.equal(response.status, 429)
  assert.ok(Number(response.headers.get('Retry-After')) > 0)
})

// X-Forwarded-For is appended to by every hop, so only the rightmost entries
// are ours. A client that prefixes the header must not get a fresh budget.
test('a forged X-Forwarded-For prefix does not buy a new creation budget', async () => {
  const spend = async (forwardedFor: string) =>
    (await POST(jsonRequest('/api/secrets', validBody(), { 'x-forwarded-for': forwardedFor })))
      .status

  for (let i = 0; i < 30; i++) {
    assert.equal(await spend('203.0.113.9'), 200, `create ${i + 1}`)
  }
  assert.equal(await spend('9.9.9.9, 203.0.113.9'), 429)
})
