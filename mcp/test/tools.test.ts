import { test } from 'node:test'
import assert from 'node:assert/strict'
import { handleCreate, handleGenerate } from '../src/index.js'

const ok = async () => ({ url: 'https://example.com/secret/id', expiresAt: '2026-01-01T00:00:00.000Z' })

test('create returns the url', async () => {
  const res = await handleCreate({ text: 'x', password: 'pw' }, { createSecret: ok })
  assert.match(res.content[0].text, /https:\/\/example\.com\/secret\/id/)
  assert.ok(!res.isError)
})

test('generate never puts the secret or the password in the result', async () => {
  let copied: string | undefined
  const res = await handleGenerate(
    { type: 'password' },
    { createSecret: ok, copyToClipboard: async (v: string) => void (copied = v) }
  )
  const text = JSON.stringify(res)
  if (!copied || copied.length < 12) {
    throw new Error('expected copyToClipboard to receive a generated password of at least 12 characters')
  }
  assert.ok(!text.includes(copied), 'link password leaked into the tool result')
  assert.match(text, /clipboard/i)
})

test('generate reports the failure when no clipboard exists', async () => {
  const res = await handleGenerate(
    { type: 'password' },
    {
      createSecret: ok,
      copyToClipboard: async () => {
        throw new (await import('../src/clipboard.js')).ClipboardUnavailableError()
      },
    }
  )
  assert.ok(res.isError)
  assert.match(res.content[0].text, /clipboard/i)
})

test('an API failure is reported as a tool error, not a success', async () => {
  const res = await handleCreate(
    { text: 'x', password: 'pw' },
    {
      createSecret: async () => {
        throw new Error('boom')
      },
    }
  )
  assert.ok(res.isError, 'a failure reported as success would be read as a share')
})
