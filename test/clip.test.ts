// The clipboard drops the password, so the code has to carry the key. That
// makes one property load-bearing above all others: the server is handed an id
// derived from the code, and must not be able to walk back from the id to the
// code. Everything else here is ordinary storage behaviour.
//
// The derivation runs against real WebCrypto, which Node exposes globally, so
// these exercise the same PBKDF2 the browser performs.

import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import {
  generateClipCode,
  normalizeClipCode,
  formatClipCode,
  deriveClipMaterial,
  CLIP_CODE_LENGTH,
} from '@/lib/clipCode'
import { ALPHABET } from '@/lib/pairingCode'
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

function b64url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
function unb64url(s: string): Uint8Array {
  return new Uint8Array(Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64'))
}

async function seal(code: string, envelope: unknown) {
  const { id, key } = await deriveClipMaterial(code)
  const iv = new Uint8Array(12)
  crypto.getRandomValues(iv)
  const ct = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv as unknown as BufferSource },
      key,
      new TextEncoder().encode(JSON.stringify(envelope)) as unknown as BufferSource
    )
  )
  return { id, ciphertext: b64url(ct), iv: b64url(iv) }
}

// --- the code format ---

test('a clip code is ten characters from the shared alphabet', () => {
  for (let i = 0; i < 100; i += 1) {
    const code = generateClipCode()
    assert.equal(code.length, CLIP_CODE_LENGTH)
    for (const char of code) assert.ok(ALPHABET.includes(char))
  }
})

test('clip codes are longer than pairing codes, because this one is the key', () => {
  // A pairing code only locates a secret a password still guards. This one
  // derives the key, so it carries the whole burden: 2^50 rather than 2^40.
  assert.equal(CLIP_CODE_LENGTH, 10)
  assert.equal(Math.round(Math.log2(Math.pow(ALPHABET.length, CLIP_CODE_LENGTH))), 50)
})

test('normalizeClipCode folds what a person types', () => {
  const code = generateClipCode()
  const shown = formatClipCode(code)
  assert.equal(shown.length, CLIP_CODE_LENGTH + 1, 'displayed as XXXXX-XXXXX')
  assert.equal(normalizeClipCode(shown), code)
  assert.equal(normalizeClipCode(shown.toLowerCase()), code)
  assert.equal(normalizeClipCode(` ${shown} `), code)
})

test('normalizeClipCode folds the letters the alphabet omits', () => {
  assert.equal(normalizeClipCode('IL0OO-12345'), '11000-12345'.replace('-', ''))
})

test('normalizeClipCode rejects anything of the wrong shape', () => {
  for (const bad of ['', '4F2K9', '4F2K9-QX1B7X', '4F2K9-QX1B!', 'UUUUU-UUUUU']) {
    assert.equal(normalizeClipCode(bad), null, `should reject ${JSON.stringify(bad)}`)
  }
})

// --- derivation, the part that keeps this zero-knowledge ---

test('the same code always derives the same id', async () => {
  const code = generateClipCode()
  const a = await deriveClipMaterial(code)
  const b = await deriveClipMaterial(code)
  assert.equal(a.id, b.id, 'a recipient must land on the same id the sender used')
})

test('different codes derive different ids', async () => {
  const a = await deriveClipMaterial(generateClipCode())
  const b = await deriveClipMaterial(generateClipCode())
  assert.notEqual(a.id, b.id)
})

test('the id does not contain or reveal the code', async () => {
  const code = generateClipCode()
  const { id } = await deriveClipMaterial(code)

  // The server is given this id. If the code were recoverable from it, the
  // server could decrypt every clip and the whole design would be theatre.
  assert.ok(!id.includes(code), 'the code leaked into the id')
  assert.ok(!id.toUpperCase().includes(code), 'the code leaked into the id')
  assert.equal(id.length, 43, '32 bytes of base64url')
})

test('the derived key decrypts only what the same code sealed', async () => {
  const codeA = generateClipCode()
  const codeB = generateClipCode()
  const sealed = await seal(codeA, { text: 'hello', file: null })

  const { key: wrongKey } = await deriveClipMaterial(codeB)
  await assert.rejects(
    () =>
      crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: unb64url(sealed.iv) as unknown as BufferSource },
        wrongKey,
        unb64url(sealed.ciphertext) as unknown as BufferSource
      ),
    'a different code must not open the clip'
  )
})

// --- storage ---

test('a clip stores and opens exactly once', async () => {
  const code = generateClipCode()
  const sealed = await seal(code, { text: 'once only', file: null })

  assert.equal(await createClip({ ...sealed, expiresIn: 24 }), true)
  const first = await takeClip(sealed.id)
  assert.ok(first)
  assert.equal(first.ciphertext, sealed.ciphertext)
  assert.equal(await takeClip(sealed.id), null, 'a clip opens once')
})

test('storing refuses to overwrite an id already in use', async () => {
  const sealed = await seal(generateClipCode(), { text: 'first', file: null })
  assert.equal(await createClip({ ...sealed, expiresIn: 24 }), true)
  assert.equal(
    await createClip({ ...sealed, ciphertext: 'second', expiresIn: 24 }),
    false,
    'silently replacing would lose the first clip'
  )

  const got = await takeClip(sealed.id)
  assert.equal(got!.ciphertext, sealed.ciphertext)
})

// --- routes, end to end ---

test('a full clipboard round trip works through the routes', async () => {
  const code = generateClipCode()
  const sealed = await seal(code, { text: 'moved without a password', file: null })

  const saved = await createRoute(
    jsonRequest('/api/clip', { ...sealed, expiresIn: 24 }, freshIp())
  )
  assert.equal(saved.status, 200)

  // The recipient starts from the code alone and rederives everything.
  const { id, key } = await deriveClipMaterial(normalizeClipCode(formatClipCode(code))!)
  const opened = await openRoute(jsonRequest('/api/clip/open', { id }, freshIp()))
  assert.equal(opened.status, 200)

  const body = await jsonBody<{ ciphertext: string; iv: string }>(opened)
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: unb64url(body.iv) as unknown as BufferSource },
    key,
    unb64url(body.ciphertext) as unknown as BufferSource
  )
  assert.equal(JSON.parse(new TextDecoder().decode(plain)).text, 'moved without a password')
})

test('the server never stores the plaintext or anything that opens it', async () => {
  const code = generateClipCode()
  const sealed = await seal(code, { text: 'top secret value', file: null })
  await createRoute(jsonRequest('/api/clip', { ...sealed, expiresIn: 24 }, freshIp()))

  const stored = (await getRedisClient().get(`clip:${sealed.id}`)) as string
  assert.ok(!stored.includes('top secret value'), 'plaintext reached storage')
  assert.ok(!stored.includes(code), 'the code reached storage')
  assert.ok(!stored.toLowerCase().includes(code.toLowerCase()), 'the code reached storage')
})

test('opening twice answers the same as an unknown code', async () => {
  const sealed = await seal(generateClipCode(), { text: 'x', file: null })
  await createRoute(jsonRequest('/api/clip', { ...sealed, expiresIn: 24 }, freshIp()))

  const ip = freshIp()
  assert.equal((await openRoute(jsonRequest('/api/clip/open', { id: sealed.id }, ip))).status, 200)

  const second = await openRoute(jsonRequest('/api/clip/open', { id: sealed.id }, ip))
  const unknown = await openRoute(
    jsonRequest('/api/clip/open', { id: 'a'.repeat(43) }, ip)
  )
  assert.equal(second.status, 404)
  assert.equal(unknown.status, 404)
  assert.deepEqual(await jsonBody(second), await jsonBody(unknown))
})

test('the create route rejects malformed input before storing', async () => {
  const sealed = await seal(generateClipCode(), { text: 'x', file: null })

  for (const patch of [
    { id: '' },
    { id: 'x'.repeat(200) },
    { ciphertext: '' },
    { iv: '' },
    { expiresIn: 5 },
    { expiresIn: 'soon' },
  ]) {
    const r = await createRoute(
      jsonRequest('/api/clip', { ...sealed, expiresIn: 24, ...patch }, freshIp())
    )
    assert.equal(r.status, 400, `should have rejected ${JSON.stringify(patch)}`)
  }
  assert.equal((await getRedisClient().keys('clip:*')).length, 0)
})

test('a file survives the round trip alongside the text', async () => {
  const code = generateClipCode()
  const envelope = {
    text: 'see attached',
    file: { name: 'key.pem', type: 'application/x-pem-file', data: 'ZmFrZQ==' },
  }
  const sealed = await seal(code, envelope)
  await createRoute(jsonRequest('/api/clip', { ...sealed, expiresIn: 1 }, freshIp()))

  const { id, key } = await deriveClipMaterial(code)
  const opened = await openRoute(jsonRequest('/api/clip/open', { id }, freshIp()))
  const body = await jsonBody<{ ciphertext: string; iv: string }>(opened)
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: unb64url(body.iv) as unknown as BufferSource },
    key,
    unb64url(body.ciphertext) as unknown as BufferSource
  )
  assert.deepEqual(JSON.parse(new TextDecoder().decode(plain)), envelope)
})
