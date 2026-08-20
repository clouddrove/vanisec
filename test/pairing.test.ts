// Pairing codes trade entropy for something a person can type: 2^40 where the
// secret id has 2^122. What buys that back is a short life, single use, and a
// redeem budget, so those three are what this file is mostly about.
//
// The normalisation tests matter for a different reason. A code is read off one
// screen and typed into another, and every fold below (case, dashes, spaces,
// I/L to 1, O to 0) is a shape a real person produces from a correct reading.
// If one of them stops folding, the user sees "that code has expired" while
// holding a code that has not.
//
// Storage runs against the in-memory Redis stand-in installed by
// test/support/redisHooks.mjs, so no server and no Docker are involved.

import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { ALPHABET, CODE_LENGTH, generateCode, normalizeCode, formatCode } from '@/lib/pairingCode'
import { mintCode, redeemCode, CODE_TTL_SECONDS } from '@/lib/pairing'
import { createSecret } from '@/lib/secrets'
import { getRedisClient } from '@/lib/redis'
import { POST as mintRoute } from '@/app/api/pair/route'
import { POST as redeemRoute } from '@/app/api/pair/redeem/route'
import { jsonRequest, jsonBody } from './support/http'

beforeEach(async () => {
  await getRedisClient().flushall()
})

async function makeSecret(expiresIn = 24): Promise<string> {
  return createSecret({
    ciphertext: 'Y2lwaGVydGV4dA',
    iv: 'aXYtYnl0ZXM',
    passwordProtected: true,
    encSalt: 'ZW5jLXNhbHQ',
    authSalt: 'YXV0aC1zYWx0',
    verifierHash: 'a'.repeat(64),
    iterations: 600_000,
    expiresIn,
  })
}

let ipCounter = 0

// A fresh IP per request keeps one test's budget out of another's.
function freshIp(): Record<string, string> {
  ipCounter += 1
  return { 'x-forwarded-for': `203.0.113.${ipCounter % 250}` }
}

// --- format ---

test('the alphabet omits the characters that misread when typed by hand', () => {
  assert.equal(ALPHABET.length, 32)
  for (const excluded of ['I', 'L', 'O', 'U']) {
    assert.ok(!ALPHABET.includes(excluded), `alphabet should not contain ${excluded}`)
  }
  // A byte modulo the alphabet length is only unbiased while 256 divides evenly.
  assert.equal(256 % ALPHABET.length, 0)
})

test('generated codes are the right length and drawn from the alphabet', () => {
  for (let i = 0; i < 200; i += 1) {
    const code = generateCode()
    assert.equal(code.length, CODE_LENGTH)
    for (const char of code) assert.ok(ALPHABET.includes(char), `${char} not in alphabet`)
  }
})

test('generated codes are not all the same', () => {
  const seen = new Set<string>()
  for (let i = 0; i < 200; i += 1) seen.add(generateCode())
  assert.ok(seen.size > 190, `expected near-unique codes, got ${seen.size} of 200`)
})

test('normalizeCode folds the shapes a person actually types', () => {
  const canonical = '4F2K9QX1'
  for (const typed of ['4F2K9QX1', '4f2k9qx1', '4F2K-9QX1', '4f2k 9qx1', '  4F2K-9QX1  ']) {
    assert.equal(normalizeCode(typed), canonical, `failed to normalize ${JSON.stringify(typed)}`)
  }
})

test('normalizeCode folds the excluded letters onto the digits they misread as', () => {
  // I, L and O are not in the alphabet, so in a code they can only ever be a
  // misread 1, 1 and 0.
  assert.equal(normalizeCode('4F2KIQX1'), '4F2K1QX1')
  assert.equal(normalizeCode('4F2KLQX1'), '4F2K1QX1')
  assert.equal(normalizeCode('4F2KOQX1'), '4F2K0QX1')
  assert.equal(normalizeCode('4f2kioql'), '4F2K10Q1')
})

test('normalizeCode rejects anything that is not a well-formed code', () => {
  for (const bad of ['', '4F2K', '4F2K9QX12', '4F2K9QX!', '4F2K9QXU', '········']) {
    assert.equal(normalizeCode(bad), null, `should have rejected ${JSON.stringify(bad)}`)
  }
})

test('formatCode groups for legibility and round-trips through normalizeCode', () => {
  assert.equal(formatCode('4F2K9QX1'), '4F2K-9QX1')
  for (let i = 0; i < 50; i += 1) {
    const code = generateCode()
    assert.equal(normalizeCode(formatCode(code)), code)
  }
})

// --- mint and redeem ---

test('a minted code redeems to the secret it was minted for', async () => {
  const id = await makeSecret()
  const minted = await mintCode(id)
  assert.ok(minted)
  assert.equal(await redeemCode(minted.code), id)
})

test('a code redeems exactly once', async () => {
  const id = await makeSecret()
  const minted = await mintCode(id)
  assert.ok(minted)

  assert.equal(await redeemCode(minted.code), id)
  // The second read is the one that must fail. Without it a code left on a
  // screen would keep working for whoever walked past.
  assert.equal(await redeemCode(minted.code), null)
})

test('a code redeems through the same folds normalizeCode accepts', async () => {
  const id = await makeSecret()
  const minted = await mintCode(id)
  assert.ok(minted)
  assert.equal(await redeemCode(formatCode(minted.code).toLowerCase()), id)
})

test('an unknown or malformed code redeems to nothing', async () => {
  assert.equal(await redeemCode('4F2K-9QX1'), null)
  assert.equal(await redeemCode('nonsense'), null)
  assert.equal(await redeemCode(''), null)
})

test('a code never outlives the secret it points at', async () => {
  const redis = getRedisClient()

  // A secret with hours left gets the full code TTL.
  const longLived = await mintCode(await makeSecret(24))
  assert.ok(longLived)
  assert.equal(longLived.expiresIn, CODE_TTL_SECONDS)

  // One with less time left than the code TTL clamps to the secret. Reached by
  // rewriting the stored expiry, which is what a secret paired near the end of
  // its life looks like.
  const id = await makeSecret(1)
  const raw = JSON.parse((await redis.get(`secret:${id}`)) as string)
  raw.expiresAt = Date.now() + 90_000
  await redis.setex(`secret:${id}`, 200, JSON.stringify(raw))

  const clamped = await mintCode(id)
  assert.ok(clamped)
  assert.ok(
    clamped.expiresIn <= 90 && clamped.expiresIn > 80,
    `expected the code to clamp to ~90s, got ${clamped.expiresIn}`
  )
})

test('minting fails for a secret that is missing or already expired', async () => {
  assert.equal(await mintCode('00000000-0000-4000-8000-000000000000'), null)

  const redis = getRedisClient()
  const id = await makeSecret(1)
  const raw = JSON.parse((await redis.get(`secret:${id}`)) as string)
  raw.expiresAt = Date.now() - 1000
  await redis.setex(`secret:${id}`, 200, JSON.stringify(raw))

  assert.equal(await mintCode(id), null, 'an expired secret must not yield a code')
})

test('redeeming does not touch the secret itself', async () => {
  const id = await makeSecret()
  const minted = await mintCode(id)
  assert.ok(minted)
  await redeemCode(minted.code)

  // The code carries the id and nothing more; burning the secret stays the job
  // of the password-gated retrieval route.
  assert.ok(await getRedisClient().get(`secret:${id}`))
})

// --- routes ---

test('POST /api/pair returns a formatted code for a live secret', async () => {
  const id = await makeSecret()
  const response = await mintRoute(jsonRequest('/api/pair', { id }, freshIp()))
  assert.equal(response.status, 200)

  const body = await jsonBody<{ code: string; expiresIn: number }>(response)
  assert.match(body.code, /^[0-9A-Z]{4}-[0-9A-Z]{4}$/)
  assert.equal(body.expiresIn, CODE_TTL_SECONDS)
})

test('POST /api/pair answers 404 for an id that does not exist', async () => {
  const response = await mintRoute(
    jsonRequest('/api/pair', { id: '00000000-0000-4000-8000-000000000000' }, freshIp())
  )
  assert.equal(response.status, 404)
})

test('POST /api/pair rejects a malformed id without reaching storage', async () => {
  for (const id of ['', 'x'.repeat(200), 42, null]) {
    const response = await mintRoute(jsonRequest('/api/pair', { id }, freshIp()))
    assert.equal(response.status, 400, `should have rejected ${JSON.stringify(id)}`)
  }
})

test('POST /api/pair/redeem exchanges a code for its id, once', async () => {
  const id = await makeSecret()
  const minted = await jsonBody<{ code: string }>(
    await mintRoute(jsonRequest('/api/pair', { id }, freshIp()))
  )

  const ip = freshIp()
  const first = await redeemRoute(jsonRequest('/api/pair/redeem', { code: minted.code }, ip))
  assert.equal(first.status, 200)
  assert.equal((await jsonBody<{ id: string }>(first)).id, id)

  const second = await redeemRoute(jsonRequest('/api/pair/redeem', { code: minted.code }, ip))
  assert.equal(second.status, 404)
})

test('POST /api/pair/redeem answers the same way for every kind of bad code', async () => {
  // Unknown, expired and already-redeemed must be indistinguishable. Anything
  // that told them apart would help someone working through the space.
  const ip = freshIp()
  const unknown = await redeemRoute(jsonRequest('/api/pair/redeem', { code: '4F2K-9QX1' }, ip))
  assert.equal(unknown.status, 404)

  const id = await makeSecret()
  const minted = await mintCode(id)
  assert.ok(minted)
  await redeemCode(minted.code)
  const used = await redeemRoute(
    jsonRequest('/api/pair/redeem', { code: formatCode(minted.code) }, ip)
  )
  assert.equal(used.status, 404)

  assert.deepEqual(await jsonBody(unknown), await jsonBody(used))
})

test('POST /api/pair/redeem rate limits guessing well before the code space matters', async () => {
  const ip = freshIp()
  let sawLimit = false
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const response = await redeemRoute(
      jsonRequest('/api/pair/redeem', { code: '4F2K-9QX1' }, ip)
    )
    if (response.status === 429) {
      assert.ok(response.headers.get('Retry-After'), '429 must tell the caller when to return')
      sawLimit = true
      break
    }
  }
  assert.ok(sawLimit, 'redeeming should be rate limited')
})

test('POST /api/pair rate limits how many live codes one client can park', async () => {
  const id = await makeSecret()
  const ip = freshIp()
  let sawLimit = false
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const response = await mintRoute(jsonRequest('/api/pair', { id }, ip))
    if (response.status === 429) {
      sawLimit = true
      break
    }
  }
  assert.ok(sawLimit, 'minting should be rate limited')
})
