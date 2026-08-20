// Passwordless handoff. The property that replaces the password is that the
// receiving browser holds a private key nobody else has, so most of this file
// is about what the server is and is not able to do with what it stores.
//
// The ECDH round trip runs against the same WebCrypto the browser uses, since
// Node exposes it globally. A test that only exercised the Redis layer would
// prove the plumbing and miss whether anything actually decrypts.

import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import {
  createBeam,
  beamPublicKey,
  deliver,
  claim,
  cancelBeam,
  BEAM_TTL_SECONDS,
} from '@/lib/beam'
import { generateEphemeralKeyPair, sealTo, openSealed } from '@/lib/ecdh'
import { getRedisClient } from '@/lib/redis'
import { POST as createRoute } from '@/app/api/beam/route'
import { POST as peekRoute } from '@/app/api/beam/peek/route'
import { POST as sendRoute } from '@/app/api/beam/send/route'
import { POST as pollRoute } from '@/app/api/beam/poll/route'
import { jsonRequest, jsonBody } from './support/http'

beforeEach(async () => {
  await getRedisClient().flushall()
})

let ipCounter = 0
function freshIp(): Record<string, string> {
  ipCounter += 1
  return { 'x-forwarded-for': `198.51.100.${ipCounter % 250}` }
}

const PAYLOAD = { ciphertext: 'Y3Q', iv: 'aXY', senderPublicKey: 'cGs' }

// --- crypto ---

test('a sealed payload round-trips back to the plaintext', async () => {
  const receiver = await generateEphemeralKeyPair()
  const sealed = await sealTo(receiver.publicKeyB64, 'hello from the laptop')
  assert.equal(await openSealed(receiver.privateKey, sealed), 'hello from the laptop')
})

test('a payload sealed to one device cannot be opened by another', async () => {
  const intended = await generateEphemeralKeyPair()
  const interloper = await generateEphemeralKeyPair()
  const sealed = await sealTo(intended.publicKeyB64, 'not for you')

  // This is the whole security claim of the passwordless path: guessing a code
  // gets you ciphertext, and ciphertext is useless without the private key that
  // never left the receiving browser.
  await assert.rejects(() => openSealed(interloper.privateKey, sealed))
})

test('tampering with the ciphertext is detected rather than yielding garbage', async () => {
  const receiver = await generateEphemeralKeyPair()
  const sealed = await sealTo(receiver.publicKeyB64, 'authentic')
  const flipped = {
    ...sealed,
    ciphertext: sealed.ciphertext.slice(0, -2) + (sealed.ciphertext.endsWith('A') ? 'BB' : 'AA'),
  }
  await assert.rejects(() => openSealed(receiver.privateKey, flipped))
})

test('two handoffs of the same text produce different ciphertext', async () => {
  const receiver = await generateEphemeralKeyPair()
  const a = await sealTo(receiver.publicKeyB64, 'same text')
  const b = await sealTo(receiver.publicKeyB64, 'same text')
  assert.notEqual(a.ciphertext, b.ciphertext, 'a fresh ephemeral key and iv per send')
  assert.notEqual(a.senderPublicKey, b.senderPublicKey)
})

// --- storage ---

test('a beam hands out its public key but never its token', async () => {
  const beam = await createBeam('the-public-key')
  assert.ok(beam)
  assert.equal(await beamPublicKey(beam.code), 'the-public-key')
  assert.equal(beam.expiresIn, BEAM_TTL_SECONDS)

  // The token is the receiver's claim on its own delivery. Nothing that answers
  // a code lookup may include it.
  const stored = await getRedisClient().get(`beam:${beam.code}`)
  assert.ok(stored!.includes(beam.token), 'the token is stored')
  assert.notEqual(await beamPublicKey(beam.code), beam.token)
})

test('a public key lookup does not consume the beam', async () => {
  const beam = await createBeam('pk')
  assert.ok(beam)
  assert.equal(await beamPublicKey(beam.code), 'pk')
  assert.equal(await beamPublicKey(beam.code), 'pk', 'peeking must stay non-destructive')
})

test('a code redeems through the same folds a person types', async () => {
  const beam = await createBeam('pk')
  assert.ok(beam)
  assert.equal(await beamPublicKey(beam.code.toLowerCase()), 'pk')
})

test('delivery then claim returns the payload exactly once', async () => {
  const beam = await createBeam('pk')
  assert.ok(beam)

  assert.equal(await deliver(beam.code, PAYLOAD), 'delivered')
  const first = await claim(beam.code, beam.token)
  assert.equal(first.status, 'ready')
  assert.deepEqual(first.status === 'ready' ? first.payload : null, PAYLOAD)

  const second = await claim(beam.code, beam.token)
  assert.equal(second.status, 'not-found', 'the beam dies with its delivery')
})

test('claiming before anything arrives reports waiting, not failure', async () => {
  const beam = await createBeam('pk')
  assert.ok(beam)
  assert.equal((await claim(beam.code, beam.token)).status, 'waiting')
})

test('a wrong token is answered as not-found, so polling cannot probe for live codes', async () => {
  const beam = await createBeam('pk')
  assert.ok(beam)
  await deliver(beam.code, PAYLOAD)

  assert.equal((await claim(beam.code, 'wrong-token')).status, 'not-found')
  // And the real receiver is unaffected by the failed attempt.
  assert.equal((await claim(beam.code, beam.token)).status, 'ready')
})

test('a second delivery is refused rather than replacing the first', async () => {
  const beam = await createBeam('pk')
  assert.ok(beam)
  assert.equal(await deliver(beam.code, PAYLOAD), 'delivered')

  const other = { ciphertext: 'evil', iv: 'iv2', senderPublicKey: 'pk2' }
  assert.equal(await deliver(beam.code, other), 'occupied')

  const got = await claim(beam.code, beam.token)
  assert.deepEqual(got.status === 'ready' ? got.payload : null, PAYLOAD)
})

test('delivery does not restart the beam clock', async () => {
  const redis = getRedisClient()
  const beam = await createBeam('pk')
  assert.ok(beam)

  await redis.expire(`beam:${beam.code}`, 42)
  assert.equal(await deliver(beam.code, PAYLOAD), 'delivered')
  const ttl = await redis.ttl(`beam:${beam.code}`)
  assert.ok(ttl <= 42 && ttl > 30, `expected the remaining life to be kept, got ${ttl}`)
})

test('delivering to an unknown or malformed code fails without creating one', async () => {
  assert.equal(await deliver('4F2K-9QX1', PAYLOAD), 'not-found')
  assert.equal(await deliver('nonsense', PAYLOAD), 'not-found')
  assert.equal((await getRedisClient().keys('beam:*')).length, 0)
})

test('cancel drops the beam, and only for the holder of the token', async () => {
  const beam = await createBeam('pk')
  assert.ok(beam)

  await cancelBeam(beam.code, 'wrong-token')
  assert.equal(await beamPublicKey(beam.code), 'pk', 'a stranger cannot cancel someone else beam')

  await cancelBeam(beam.code, beam.token)
  assert.equal(await beamPublicKey(beam.code), null)
})

// --- routes, end to end ---

test('a full passwordless handoff works through the routes', async () => {
  const receiver = await generateEphemeralKeyPair()

  const created = await jsonBody<{ code: string; token: string }>(
    await createRoute(jsonRequest('/api/beam', { publicKey: receiver.publicKeyB64 }, freshIp()))
  )
  assert.match(created.code, /^[0-9A-Z]{4}-[0-9A-Z]{4}$/)

  // The sender only ever learns a public key.
  const peeked = await jsonBody<{ publicKey: string }>(
    await peekRoute(jsonRequest('/api/beam/peek', { code: created.code.toLowerCase() }, freshIp()))
  )
  assert.equal(peeked.publicKey, receiver.publicKeyB64)

  const sealed = await sealTo(peeked.publicKey, JSON.stringify({ text: 'moved without a password' }))
  const sent = await sendRoute(
    jsonRequest('/api/beam/send', { code: created.code, ...sealed }, freshIp())
  )
  assert.equal(sent.status, 200)

  const polled = await pollRoute(
    jsonRequest('/api/beam/poll', { code: created.code, token: created.token }, freshIp())
  )
  assert.equal(polled.status, 200)
  const payload = await jsonBody<typeof sealed>(polled)
  const plain = await openSealed(receiver.privateKey, payload)
  assert.equal(JSON.parse(plain).text, 'moved without a password')
})

test('the server never holds anything that decrypts the payload', async () => {
  const receiver = await generateEphemeralKeyPair()
  const created = await jsonBody<{ code: string; token: string }>(
    await createRoute(jsonRequest('/api/beam', { publicKey: receiver.publicKeyB64 }, freshIp()))
  )
  const sealed = await sealTo(receiver.publicKeyB64, JSON.stringify({ text: 'top secret' }))
  await sendRoute(jsonRequest('/api/beam/send', { code: created.code, ...sealed }, freshIp()))

  const stored = (await getRedisClient().get(
    `beam:${created.code.replace('-', '')}`
  )) as string
  assert.ok(!stored.includes('top secret'), 'plaintext reached storage')
  // Two public keys and a blob is the entire picture the server has.
  assert.ok(stored.includes(receiver.publicKeyB64))
  assert.ok(stored.includes(sealed.senderPublicKey))
})

test('polling with a wrong token answers 404, the same as an unknown code', async () => {
  const receiver = await generateEphemeralKeyPair()
  const created = await jsonBody<{ code: string; token: string }>(
    await createRoute(jsonRequest('/api/beam', { publicKey: receiver.publicKeyB64 }, freshIp()))
  )

  const wrong = await pollRoute(
    jsonRequest('/api/beam/poll', { code: created.code, token: 'a'.repeat(64) }, freshIp())
  )
  const unknown = await pollRoute(
    jsonRequest('/api/beam/poll', { code: '4F2K-9QX1', token: 'a'.repeat(64) }, freshIp())
  )
  assert.equal(wrong.status, 404)
  assert.equal(unknown.status, 404)
  assert.deepEqual(await jsonBody(wrong), await jsonBody(unknown))
})

test('a second send to the same code is refused with 409', async () => {
  const receiver = await generateEphemeralKeyPair()
  const created = await jsonBody<{ code: string }>(
    await createRoute(jsonRequest('/api/beam', { publicKey: receiver.publicKeyB64 }, freshIp()))
  )
  const sealed = await sealTo(receiver.publicKeyB64, 'first')
  await sendRoute(jsonRequest('/api/beam/send', { code: created.code, ...sealed }, freshIp()))

  const again = await sendRoute(
    jsonRequest('/api/beam/send', { code: created.code, ...sealed }, freshIp())
  )
  assert.equal(again.status, 409)
})

test('the routes reject malformed input before touching storage', async () => {
  for (const publicKey of ['', 'x'.repeat(300), 42, null]) {
    const r = await createRoute(jsonRequest('/api/beam', { publicKey }, freshIp()))
    assert.equal(r.status, 400, `should have rejected key ${JSON.stringify(publicKey)}`)
  }
  const peek = await peekRoute(jsonRequest('/api/beam/peek', { code: 'x'.repeat(64) }, freshIp()))
  assert.equal(peek.status, 400)
  assert.equal((await getRedisClient().keys('beam:*')).length, 0)
})

test('a cancel through the poll route drops the beam', async () => {
  const receiver = await generateEphemeralKeyPair()
  const created = await jsonBody<{ code: string; token: string }>(
    await createRoute(jsonRequest('/api/beam', { publicKey: receiver.publicKeyB64 }, freshIp()))
  )

  const cancelled = await pollRoute(
    jsonRequest(
      '/api/beam/poll',
      { code: created.code, token: created.token, cancel: true },
      freshIp()
    )
  )
  assert.equal(cancelled.status, 200)

  const peek = await peekRoute(jsonRequest('/api/beam/peek', { code: created.code }, freshIp()))
  assert.equal(peek.status, 404, 'a receiver leaving must not leave a live address behind')
})
