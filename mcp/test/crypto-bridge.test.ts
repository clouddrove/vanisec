import { test } from 'node:test'
import assert from 'node:assert/strict'
import { encryptWithPassword, decryptWithPassword, computeVerifier } from '@lib/clientCrypto'
import { PBKDF2_ITERATIONS } from '@lib/kdfParams'

test('browser crypto module round-trips under Node', async () => {
  const plaintext = JSON.stringify({ text: 'hello', file: null })
  const enc = await encryptWithPassword(plaintext, 'pw')

  assert.equal(enc.iterations, PBKDF2_ITERATIONS)

  const out = await decryptWithPassword(
    { ciphertext: enc.ciphertext, iv: enc.iv },
    'pw',
    enc.encSalt,
    enc.iterations
  )
  assert.equal(JSON.parse(out).text, 'hello')
})

test('verifier is reproducible from the password and authSalt', async () => {
  const enc = await encryptWithPassword('{}', 'pw')
  const again = await computeVerifier('pw', enc.authSalt, enc.iterations)
  assert.equal(again, enc.verifier)
})

test('a wrong password fails to decrypt', async () => {
  const enc = await encryptWithPassword('{}', 'right')
  await assert.rejects(() =>
    decryptWithPassword({ ciphertext: enc.ciphertext, iv: enc.iv }, 'wrong', enc.encSalt, enc.iterations)
  )
})
