import { test } from 'node:test'
import assert from 'node:assert/strict'
import { detectClipboardCommand, inlinePasswordAllowed } from '../src/clipboard.js'

const has = (...available: string[]) => (cmd: string) => available.includes(cmd)

test('picks pbcopy on macOS', () => {
  assert.deepEqual(detectClipboardCommand('darwin', has('pbcopy')), ['pbcopy'])
})

test('prefers wl-copy over xclip on Linux', () => {
  assert.deepEqual(detectClipboardCommand('linux', has('wl-copy', 'xclip')), ['wl-copy'])
})

test('falls back to xclip on Linux', () => {
  assert.deepEqual(detectClipboardCommand('linux', has('xclip')), ['xclip', '-selection', 'clipboard'])
})

test('uses clip on Windows', () => {
  assert.deepEqual(detectClipboardCommand('win32', has('clip')), ['clip'])
})

test('returns null when nothing is available', () => {
  assert.equal(detectClipboardCommand('linux', has()), null)
})

test('inline password is disallowed unless explicitly opted in', () => {
  delete process.env.VANISEC_ALLOW_INLINE_PASSWORD
  assert.equal(inlinePasswordAllowed(), false)
  process.env.VANISEC_ALLOW_INLINE_PASSWORD = '1'
  assert.equal(inlinePasswordAllowed(), true)
  delete process.env.VANISEC_ALLOW_INLINE_PASSWORD
})

test('a value other than 1 does not enable the opt-in', () => {
  process.env.VANISEC_ALLOW_INLINE_PASSWORD = 'maybe'
  assert.equal(inlinePasswordAllowed(), false)
  delete process.env.VANISEC_ALLOW_INLINE_PASSWORD
})
