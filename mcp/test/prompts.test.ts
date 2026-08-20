import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sharePrompt, rotatePrompt } from '../src/prompts.js'

const body = (r: { messages: { content: { text: string } }[] }) => r.messages[0].content.text

test('share-credential steers to the generating tool', () => {
  const text = body(sharePrompt({}))
  assert.match(text, /vanisec_generate_secret/)
  assert.match(text, /vanisec_create_secret/)
  assert.ok(
    text.indexOf('vanisec_generate_secret') < text.indexOf('vanisec_create_secret'),
    'the generating tool must be presented first, since it is the default'
  )
})

test('share-credential states the two rules about the link', () => {
  const text = body(sharePrompt({}))
  assert.match(text, /different channel/i, 'the password must travel separately from the link')
  assert.match(text, /once destroys the secret/i, 'opening the link once must be called out')
})

test('share-credential interpolates what is being shared', () => {
  const res = sharePrompt({ what: 'the staging database password' })
  assert.match(body(res), /the staging database password/)
  assert.match(res.description, /the staging database password/)
})

test('share-credential falls back when nothing is named', () => {
  assert.match(body(sharePrompt({})), /share a credential through Vanisec/i)
})

test('share-credential reflects whether the secret already exists', () => {
  assert.match(body(sharePrompt({ alreadyExists: 'yes' })), /already exists somewhere else/)
  assert.match(body(sharePrompt({ alreadyExists: 'no' })), /does not exist yet/)
  assert.match(body(sharePrompt({})), /have not said whether/)
})

test('rotate-and-share interpolates the kind of credential', () => {
  const res = rotatePrompt({ credential: 'Postgres password' })
  const text = body(res)
  assert.match(text, /rotate the Postgres password/)
  assert.match(text, /revoke or delete the old Postgres password/)
  assert.match(res.description, /Postgres password/)
})

test('rotate-and-share uses the recipient when given and a fallback otherwise', () => {
  assert.match(body(rotatePrompt({ credential: 'API key', recipient: 'Priya' })), /to Priya/)
  assert.match(body(rotatePrompt({ credential: 'API key' })), /to the recipient/)
})

test('rotate-and-share steers to the generating tool', () => {
  const text = body(rotatePrompt({ credential: 'API key' }))
  assert.match(text, /Use vanisec_generate_secret for the replacement/)
})

test('rotate-and-share hands over before revoking', () => {
  const text = body(rotatePrompt({ credential: 'API key' }))
  const handOver = text.indexOf('Send the link to')
  const confirm = text.indexOf('confirm')
  const revoke = text.indexOf('revoke or delete the old')
  assert.ok(handOver > 0 && confirm > 0 && revoke > 0, 'all three steps must be present')
  assert.ok(handOver < confirm, 'the new credential goes out before confirmation is awaited')
  assert.ok(
    confirm < revoke,
    'revoking before the recipient confirms would leave nobody with a working credential'
  )
})
