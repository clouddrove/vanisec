// The server reports its version to every client at initialization, and a stale
// value is invisible: nothing breaks, the server just lies about what it is.
// package.json is the one that gets bumped at release time, so it wins.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { VERSION } from '../src/index.js'

test('the advertised version matches package.json', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
    version: string
  }
  assert.equal(
    VERSION,
    pkg.version,
    'bump the constant in src/index.ts to match package.json, or clients see the wrong version'
  )
})
