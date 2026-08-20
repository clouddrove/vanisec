// Runs the storage layer against a real Redis instead of the in-memory
// stand-in the default suite uses.
//
// It exists for the two things a stand-in cannot honestly demonstrate: that
// GETDEL is atomic on the server, which is the whole one-time guarantee, and
// that SETEX really drops the record when its lifetime runs out. Everything
// else about these routes is already covered without Redis.
//
// Needs Docker, so it is not part of `npm test`. Run it with
// `npm run test:integration`.

import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { connect } from 'node:net'
import { POST as createRoute } from '@/app/api/secrets/route'
import { GET as peekRoute, POST as claimRoute } from '@/app/api/secrets/[id]/route'
import { getRedisClient, closeRedisConnection } from '@/lib/redis'
import { takeSecret } from '@/lib/secrets'
import { hashVerifier } from '@/lib/serverCrypto'
import { PBKDF2_ITERATIONS } from '@/lib/kdfParams'
import { jsonRequest, getRequest, routeParams, jsonBody } from '../support/http'

const CONTAINER = 'vanisec-app-it-redis'
const PORT = 63802
const VERIFIER = 'dGhlLXJpZ2h0LXZlcmlmaWVy'

let ipCounter = 0
function nextIp(): string {
  ipCounter += 1
  return `198.51.100.${ipCounter % 250}`
}

async function createSecretOverHttp(expiresIn = 1): Promise<string> {
  const response = await createRoute(
    jsonRequest(
      '/api/secrets',
      {
        ciphertext: 'Y2lwaGVydGV4dA',
        iv: 'aXYtYnl0ZXM',
        passwordProtected: true,
        encSalt: 'ZW5jLXNhbHQ',
        authSalt: 'YXV0aC1zYWx0',
        verifier: VERIFIER,
        expiresIn,
        iterations: PBKDF2_ITERATIONS,
      },
      { 'x-real-ip': nextIp() }
    )
  )
  assert.equal(response.status, 200)
  return (await jsonBody<{ id: string }>(response)).id
}

// Resolves once the container is accepting connections. Waiting at the socket
// rather than through the client keeps ioredis from opening, failing and
// retrying, which would fill the output with connection errors.
function waitForPort(): Promise<void> {
  return new Promise((resolve, reject) => {
    let attempts = 0
    const attempt = () => {
      const socket = connect({ port: PORT, host: '127.0.0.1' })
      socket.once('connect', () => {
        socket.destroy()
        resolve()
      })
      socket.once('error', () => {
        socket.destroy()
        attempts += 1
        if (attempts >= 60) reject(new Error('Redis did not become reachable'))
        else setTimeout(attempt, 500)
      })
    }
    attempt()
  })
}

before(async () => {
  execFileSync('docker', ['rm', '-f', CONTAINER], { stdio: 'ignore' })
  execFileSync('docker', [
    'run', '-d', '--rm', '--name', CONTAINER, '-p', `${PORT}:6379`, 'redis:8-alpine',
  ])
  process.env.REDIS_URL = `redis://localhost:${PORT}/3`

  await waitForPort()
  await getRedisClient().flushall()
})

after(async () => {
  await closeRedisConnection()
  execFileSync('docker', ['rm', '-f', CONTAINER], { stdio: 'ignore' })
})

test('a secret survives the round trip through a real Redis', async () => {
  const id = await createSecretOverHttp()

  const meta = await jsonBody<Record<string, unknown>>(
    await peekRoute(getRequest(`/api/secrets/${id}`, { 'x-real-ip': nextIp() }), routeParams(id))
  )
  assert.equal(meta.authSalt, 'YXV0aC1zYWx0')
  assert.equal(meta.encSalt, undefined)

  const claimed = await claimRoute(
    jsonRequest(`/api/secrets/${id}`, { verifier: VERIFIER }, { 'x-real-ip': nextIp() }),
    routeParams(id)
  )
  assert.equal(claimed.status, 200)
  assert.equal((await jsonBody<{ encSalt: string }>(claimed)).encSalt, 'ZW5jLXNhbHQ')
})

// The claim this whole design rests on. GETDEL is one server-side operation, so
// however many callers race for the same link, one of them gets the ciphertext
// and the rest get nothing.
test('concurrent takes of one secret produce exactly one winner', async () => {
  const id = await createSecretOverHttp()

  const attempts = await Promise.all(Array.from({ length: 25 }, () => takeSecret(id)))
  assert.equal(attempts.filter((secret) => secret !== null).length, 1)
})

test('the stored record carries a lifetime, so an unread secret does not live forever', async () => {
  const id = await createSecretOverHttp(1)
  const ttl = await getRedisClient().ttl(`secret:${id}`)

  // One hour plus the 60 second buffer createSecret adds.
  assert.ok(ttl > 3_500 && ttl <= 3_660, `expected roughly an hour of lifetime, got ${ttl}`)
})

test('a record whose lifetime has run out is gone from Redis, not merely hidden', async () => {
  const redis = getRedisClient()
  const id = 'expiry-probe'
  await redis.setex(
    `secret:${id}`,
    1,
    JSON.stringify({
      id,
      ciphertext: 'Y2lwaGVydGV4dA',
      iv: 'aXYtYnl0ZXM',
      passwordProtected: true,
      verifierHash: hashVerifier(VERIFIER),
      createdAt: Date.now(),
      expiresAt: Date.now() + 1000,
    })
  )

  // Redis drops the key on its own schedule; poll rather than assume a delay.
  for (let i = 0; i < 40; i++) {
    if ((await redis.exists(`secret:${id}`)) === 0) {
      assert.equal(await takeSecret(id), null)
      return
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  assert.fail('the key outlived its TTL')
})
