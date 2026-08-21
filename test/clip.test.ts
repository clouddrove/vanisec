// Clipboard clips, keyed by a four digit code.
//
// This file exists mostly to hold the line on the two things that make a code
// that short survivable at all: a clip lives five minutes, and it opens exactly
// once. Lengthen the first or lose the second and 10,000 codes stops being a
// bounded risk and becomes an open harvest.
//
// The clipboard is deliberately NOT zero-knowledge. The key is stored beside
// the ciphertext, so these tests assert that plaintext stays out of storage,
// which is a real property, and make no claim that the ciphertext is beyond the
// server, which would be false.

import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import {
  generateClipCode,
  normalizeClipCode,
  sealClip,
  openClip,
  CLIP_CODE_LENGTH,
  CLIP_TTL_SECONDS,
} from '@/lib/clipCode'
import { createClip, takeClip } from '@/lib/clip'
import { getRedisClient } from '@/lib/redis'
import { POST as createRoute } from '@/app/api/clip/route'
import { POST as openRoute } from '@/app/api/clip/open/route'
import { jsonRequest, jsonBody } from './support/http'

beforeEach(async () => {
  await getRedisClient().flushall()
})

let ipCounter = 0
function freshIp(): Record<string, string> {
  ipCounter += 1
  return { 'x-forwarded-for': `192.0.2.${ipCounter % 250}` }
}

// --- the code ---

test('a clip code is four digits', () => {
  for (let i = 0; i < 300; i += 1) {
    const code = generateClipCode()
    assert.equal(code.length, CLIP_CODE_LENGTH)
    assert.match(code, /^[0-9]{4}$/)
  }
})

test('codes are spread across the space rather than clustered', () => {
  // Rejection sampling exists so the lowest 967 codes are not favoured. A
  // biased generator would still pass the shape check above.
  const seen = new Set<string>()
  let low = 0
  for (let i = 0; i < 2000; i += 1) {
    const code = generateClipCode()
    seen.add(code)
    if (Number(code) < 1000) low += 1
  }
  assert.ok(seen.size > 1500, `expected spread, saw ${seen.size} distinct in 2000`)
  // A tenth of the space is below 1000, so roughly 200 of 2000. Generous
  // bounds; this is catching a broken generator, not testing randomness.
  assert.ok(low > 100 && low < 320, `distribution looks skewed: ${low} of 2000 below 1000`)
})

test('normalizeClipCode accepts what a person types', () => {
  assert.equal(normalizeClipCode('1234'), '1234')
  assert.equal(normalizeClipCode('12 34'), '1234')
  assert.equal(normalizeClipCode(' 1234 '), '1234')
  assert.equal(normalizeClipCode('12-34'), '1234')
  assert.equal(normalizeClipCode('0007'), '0007')
})

test('normalizeClipCode rejects anything that is not four digits', () => {
  for (const bad of ['', '123', '12345', 'abcd', '12a4', '  ']) {
    assert.equal(normalizeClipCode(bad), null, `should reject ${JSON.stringify(bad)}`)
  }
})

// --- sealing ---

test('a sealed clip round-trips', async () => {
  const sealed = await sealClip(JSON.stringify({ text: 'hello', file: null }))
  assert.deepEqual(JSON.parse(await openClip(sealed)), { text: 'hello', file: null })
})

test('each clip gets its own key and iv', async () => {
  const a = await sealClip('same text')
  const b = await sealClip('same text')
  assert.notEqual(a.ciphertext, b.ciphertext)
  assert.notEqual(a.key, b.key)
  assert.notEqual(a.iv, b.iv)
})

test('a clip does not open with a different key', async () => {
  const sealed = await sealClip('secret')
  const other = await sealClip('other')
  await assert.rejects(() => openClip({ ...sealed, key: other.key }))
})

// --- storage ---

test('a clip is stored under a four digit code and opens once', async () => {
  const sealed = await sealClip(JSON.stringify({ text: 'once only', file: null }))
  const created = await createClip(sealed)
  assert.ok(created)
  assert.match(created.code, /^[0-9]{4}$/)
  assert.equal(created.expiresIn, CLIP_TTL_SECONDS)

  const first = await takeClip(created.code)
  assert.ok(first)
  assert.equal(first.ciphertext, sealed.ciphertext)

  // The single use is load-bearing. Without it an enumerating attacker could
  // read a clip and leave it in place, and nobody would ever know.
  assert.equal(await takeClip(created.code), null)
})

test('a clip expires in five minutes and the lifetime is not configurable', async () => {
  const created = await createClip(await sealClip('x'))
  assert.ok(created)
  const ttl = await getRedisClient().ttl(`clip:${created.code}`)
  assert.ok(ttl > 0 && ttl <= CLIP_TTL_SECONDS, `unexpected ttl ${ttl}`)
  assert.equal(CLIP_TTL_SECONDS, 300)
})

test('minting does not overwrite a live clip', async () => {
  // Every code is taken, so a new clip must fail rather than evict one.
  const redis = getRedisClient()
  for (let n = 0; n < 10000; n += 1) {
    await redis.set(`clip:${String(n).padStart(4, '0')}`, '{}', 'EX', 300, 'NX')
  }
  assert.equal(await createClip(await sealClip('x')), null)
})

// --- routes ---

test('a full round trip works through the routes', async () => {
  const sealed = await sealClip(JSON.stringify({ text: 'moved fast', file: null }))
  const saved = await createRoute(jsonRequest('/api/clip', sealed, freshIp()))
  assert.equal(saved.status, 200)

  const { code } = await jsonBody<{ code: string }>(saved)
  assert.match(code, /^[0-9]{4}$/)

  const opened = await openRoute(jsonRequest('/api/clip/open', { code }, freshIp()))
  assert.equal(opened.status, 200)
  const payload = await jsonBody<typeof sealed>(opened)
  assert.equal(JSON.parse(await openClip(payload)).text, 'moved fast')
})

test('the typed code is normalized on the way in', async () => {
  const saved = await createRoute(jsonRequest('/api/clip', await sealClip('x'), freshIp()))
  const { code } = await jsonBody<{ code: string }>(saved)

  const spaced = `${code.slice(0, 2)} ${code.slice(2)}`
  const opened = await openRoute(jsonRequest('/api/clip/open', { code: spaced }, freshIp()))
  assert.equal(opened.status, 200)
})

test('plaintext never reaches storage', async () => {
  const sealed = await sealClip(JSON.stringify({ text: 'top secret value', file: null }))
  const saved = await createRoute(jsonRequest('/api/clip', sealed, freshIp()))
  const { code } = await jsonBody<{ code: string }>(saved)

  const stored = (await getRedisClient().get(`clip:${code}`)) as string
  assert.ok(!stored.includes('top secret value'), 'plaintext reached storage')
  // The key is stored alongside on purpose, and that is exactly why the
  // clipboard must never be described as zero-knowledge.
  assert.ok(stored.includes(sealed.key))
})

test('opening twice answers the same as an unknown code', async () => {
  const saved = await createRoute(jsonRequest('/api/clip', await sealClip('x'), freshIp()))
  const { code } = await jsonBody<{ code: string }>(saved)

  const ip = freshIp()
  assert.equal((await openRoute(jsonRequest('/api/clip/open', { code }, ip))).status, 200)

  const second = await openRoute(jsonRequest('/api/clip/open', { code }, ip))
  const unknown = await openRoute(jsonRequest('/api/clip/open', { code: '0000' }, ip))
  assert.equal(second.status, 404)
  assert.equal(unknown.status, 404)
  assert.deepEqual(await jsonBody(second), await jsonBody(unknown))
})

test('guessing is rate limited well below what walking the space needs', async () => {
  // Not a complete defence, and not claimed to be: enough addresses defeat any
  // per-address limit. It exists so a single client cannot stroll through
  // 10,000 codes, and the five minute life does the rest.
  const ip = freshIp()
  let limited = false
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const r = await openRoute(jsonRequest('/api/clip/open', { code: '4242' }, ip))
    if (r.status === 429) {
      assert.ok(r.headers.get('Retry-After'))
      limited = true
      break
    }
  }
  assert.ok(limited, 'open must be rate limited')
})

test('the create route rejects malformed payloads before storing', async () => {
  const sealed = await sealClip('x')
  for (const patch of [{ ciphertext: '' }, { iv: '' }, { key: '' }, { key: 'x'.repeat(2000) }]) {
    const r = await createRoute(jsonRequest('/api/clip', { ...sealed, ...patch }, freshIp()))
    assert.equal(r.status, 400, `should have rejected ${JSON.stringify(Object.keys(patch))}`)
  }
  assert.equal((await getRedisClient().keys('clip:*')).length, 0)
})

test('the open route rejects a malformed code without touching storage', async () => {
  for (const code of ['', '123', 'abcd', 'x'.repeat(64), 42, null]) {
    const r = await openRoute(jsonRequest('/api/clip/open', { code }, freshIp()))
    assert.equal(r.status, 400, `should have rejected ${JSON.stringify(code)}`)
  }
})

test('a file survives the round trip alongside the text', async () => {
  const envelope = {
    text: 'see attached',
    file: { name: 'key.pem', type: 'application/x-pem-file', data: 'ZmFrZQ==' },
  }
  const saved = await createRoute(
    jsonRequest('/api/clip', await sealClip(JSON.stringify(envelope)), freshIp())
  )
  const { code } = await jsonBody<{ code: string }>(saved)

  const opened = await openRoute(jsonRequest('/api/clip/open', { code }, freshIp()))
  const payload = await jsonBody<Awaited<ReturnType<typeof sealClip>>>(opened)
  assert.deepEqual(JSON.parse(await openClip(payload)), envelope)
})
