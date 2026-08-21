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

// --- pairing codes in the tool output ---

const okPaired = async (opts: { pairingCode?: boolean }) => ({
  url: 'https://example.com/secret/id',
  expiresAt: '2026-01-01T00:00:00.000Z',
  ...(opts.pairingCode ? { pairingCode: '4F2K-9QX1', pairingCodeExpiresIn: 300 } : {}),
})

test('create passes the pairing request through and shows the code it gets back', async () => {
  const res = await handleCreate(
    { text: 'x', password: 'pw', pairingCode: true },
    { createSecret: okPaired }
  )
  assert.match(res.content[0].text, /4F2K-9QX1/)
  assert.match(res.content[0].text, /5 minutes/)
  assert.match(res.content[0].text, /\/c\b/, 'the code is useless without the page to type it into')
})

test('create says nothing about pairing when no code was asked for', async () => {
  const res = await handleCreate({ text: 'x', password: 'pw' }, { createSecret: okPaired })
  assert.ok(!/pairing code/i.test(res.content[0].text))
})

test('generate shows the pairing code without ever showing the link password', async () => {
  let copied = ''
  const res = await handleGenerate(
    { type: 'password', pairingCode: true },
    { createSecret: okPaired, copyToClipboard: async (v: string) => void (copied = v) }
  )
  const text = JSON.stringify(res)
  assert.match(res.content[0].text, /4F2K-9QX1/)
  // The pairing code is only half of what is needed, and the other half is
  // still on the clipboard rather than in the transcript.
  assert.ok(copied.length >= 12)
  assert.ok(!text.includes(copied), 'link password leaked alongside the pairing code')
})

test('a mint that quietly failed leaves the link intact and mentions no code', async () => {
  // What createSecret returns when /api/pair was unreachable: url, no code.
  const res = await handleCreate(
    { text: 'x', password: 'pw', pairingCode: true },
    { createSecret: async () => ({ url: 'https://example.com/secret/id', expiresAt: 'x' }) }
  )
  assert.ok(!res.isError, 'a missing convenience must not be reported as a failed share')
  assert.match(res.content[0].text, /https:\/\/example\.com\/secret\/id/)
  assert.ok(!/pairing code/i.test(res.content[0].text))
})

// --- the clip tool ---

test('the clip tool shows the code and states what it does not protect', async () => {
  const { handleClip } = await import('../src/index.js')
  const res = await handleClip(
    { text: 'x' },
    {
      createClip: async () => ({
        code: '4242',
        url: 'https://example.com/clipboard',
        expiresInSeconds: 300,
      }),
    }
  )
  assert.ok(!res.isError)
  assert.match(res.content[0].text, /4242/)
  assert.match(res.content[0].text, /\/clipboard/)
  assert.match(res.content[0].text, /5 minutes/)
  // A model reading this has to come away knowing the clipboard is not the
  // place for a credential, so the output says it rather than implying it.
  assert.match(res.content[0].text, /guessable|can read/i)
  assert.match(res.content[0].text, /vanisec_generate_secret/)
})

test('a clip failure is reported as a tool error, not a success', async () => {
  const { handleClip } = await import('../src/index.js')
  const res = await handleClip(
    { text: 'x' },
    {
      createClip: async () => {
        throw new Error('nope')
      },
    }
  )
  assert.ok(res.isError)
})
