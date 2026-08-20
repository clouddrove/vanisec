import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync, spawn, type ChildProcess } from 'node:child_process'
import { createSecret } from '../../src/vanisec.js'
import { decryptWithPassword, computeVerifier } from '@lib/clientCrypto'

const PORT = 3994
const REDIS = 'vanisec-mcp-it-redis'
let app: ChildProcess

before(async () => {
  execFileSync('docker', ['run', '-d', '--rm', '--name', REDIS, '-p', '63801:6379', 'redis:8-alpine'])
  process.env.VANISEC_BASE_URL = `http://localhost:${PORT}`
  app = spawn('node', ['../.next/standalone/server.js'], {
    env: { ...process.env, PORT: String(PORT), REDIS_URL: 'redis://localhost:63801/3' },
    stdio: 'ignore',
  })
  for (let i = 0; i < 60; i++) {
    try {
      await fetch(`http://localhost:${PORT}/`)
      return
    } catch {
      await new Promise((r) => setTimeout(r, 1000))
    }
  }
  throw new Error('app did not start')
})

after(() => {
  app?.kill()
  execFileSync('docker', ['rm', '-f', REDIS])
})

test('a created secret is retrievable and decrypts to the original text', async () => {
  const { url } = await createSecret({ text: 'integration secret', password: 'pw', expiresIn: 1 })
  const id = url.split('/').pop()!

  const metaRes = await fetch(`http://localhost:${PORT}/api/secrets/${id}`)
  assert.equal(metaRes.status, 401)
  const meta = (await metaRes.json()) as { authSalt: string; iterations: number; encSalt?: string }
  assert.equal(meta.encSalt, undefined, 'encSalt must not be returned before the verifier is accepted')

  const verifier = await computeVerifier('pw', meta.authSalt, meta.iterations)
  const res = await fetch(`http://localhost:${PORT}/api/secrets/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ verifier }),
  })
  assert.equal(res.status, 200)
  const data = (await res.json()) as { ciphertext: string; iv: string; encSalt: string; iterations: number }

  const out = await decryptWithPassword(
    { ciphertext: data.ciphertext, iv: data.iv },
    'pw',
    data.encSalt,
    data.iterations
  )
  assert.deepEqual(JSON.parse(out), { text: 'integration secret', file: null })
})

test('the secret is gone after one retrieval', async () => {
  const { url } = await createSecret({ text: 'burn me', password: 'pw', expiresIn: 1 })
  const id = url.split('/').pop()!

  const meta = (await (await fetch(`http://localhost:${PORT}/api/secrets/${id}`)).json()) as {
    authSalt: string
    iterations: number
  }
  const verifier = await computeVerifier('pw', meta.authSalt, meta.iterations)
  const body = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ verifier }) }

  assert.equal((await fetch(`http://localhost:${PORT}/api/secrets/${id}`, body)).status, 200)
  const second = await fetch(`http://localhost:${PORT}/api/secrets/${id}`, body)
  assert.ok([404, 410].includes(second.status), `expected the link to be dead, got ${second.status}`)
})
