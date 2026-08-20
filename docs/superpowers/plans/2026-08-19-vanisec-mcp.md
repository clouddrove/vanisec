# Vanisec MCP Server Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a local stdio MCP server that creates Vanisec one-time secrets from an AI client, plus a `/mcp` page documenting it.

**Architecture:** A standalone npm package under `mcp/` in this repo. It imports `lib/clientCrypto.ts` directly rather than reimplementing the key derivation, encrypts on the user's machine, and POSTs ciphertext to the existing `/api/secrets` endpoint. Two tools: one shares a secret the caller already has, one generates a credential locally and puts the link password on the system clipboard so neither the secret nor the password reaches the model.

**Tech Stack:** TypeScript, `@modelcontextprotocol/sdk` 1.30.0, `zod` 4.4.3, `tsup` 8.5.1 for bundling, `tsx` 4.23.12 with the built-in `node:test` runner. Node 22+.

**Spec:** kept outside the repository. The design rationale that the reviews depend on is restated in the Global Constraints below and in the tracking issues (#87 and its task issues).

## Global Constraints

- Node `>=22` (Web Crypto, `btoa`/`atob`, `TextEncoder` all required at runtime). 18 and 20 are past end of life; 22 is the oldest maintained LTS.
- PBKDF2 iterations must be at least `600000`. Import `PBKDF2_ITERATIONS` from `lib/kdfParams.ts`; never hardcode the number.
- `expiresIn` must be one of `1, 6, 24, 72, 168`. Anything else is rejected before a network call.
- Never reimplement encryption. Import from `lib/clientCrypto.ts`.
- `vanisec_generate_secret` must never return the generated value or the link password in its tool result.
- No retry on a failed create. A retry that already succeeded leaves two live one-time links for one secret.
- Writing style: no em dashes, no double hyphens in prose, no filler words (delve, leverage, robust, seamless, utilize, foster, elevate, unlock). Never use the word "scaffold".
- Commit messages carry no AI attribution and no `Co-Authored-By` trailer.
- Branch ships normally: push, open a PR linking the tracking issues, merge once CI is green.

---

## File Structure

| File | Responsibility |
|------|----------------|
| `mcp/package.json` | Package manifest, bin entry, scripts, deps |
| `mcp/tsconfig.json` | TS config with a path alias to the repo root `lib/` |
| `mcp/tsup.config.ts` | Bundle config, inlines `lib/` into the published output |
| `mcp/src/validate.ts` | Input validation shared by both tools |
| `mcp/src/generate.ts` | Local random credential generation |
| `mcp/src/clipboard.ts` | Clipboard detection and write, fail-closed |
| `mcp/src/vanisec.ts` | Encrypt, POST, build share URL, map errors |
| `mcp/src/index.ts` | MCP server, tool registration, dispatch |
| `mcp/test/*.test.ts` | Unit tests, one file per module |
| `mcp/test/integration.test.ts` | End to end against a local instance |
| `app/mcp/page.tsx` | The `/mcp` documentation page |
| `components/Features.tsx` | Add the sixth card |
| `components/Header.tsx` | Add nav link |
| `components/Footer.tsx` | Add footer link |
| `app/sitemap.ts` | Add route |
| `.dockerignore` | Exclude `mcp/` from the web image |

---

## Task 1: Package setup and the crypto bridge

Proves the central architectural bet before anything is built on it: that `lib/clientCrypto.ts` runs unmodified under Node.

**Files:**
- Create: `mcp/package.json`, `mcp/tsconfig.json`, `mcp/tsup.config.ts`
- Create: `mcp/test/crypto-bridge.test.ts`
- Modify: `.dockerignore`

**Interfaces:**
- Consumes: `lib/clientCrypto.ts` exports `encryptWithPassword`, `decryptWithPassword`, `computeVerifier`; `lib/kdfParams.ts` exports `PBKDF2_ITERATIONS`
- Produces: a buildable package; the `@lib/*` path alias used by every later task

- [ ] **Step 1: Create `mcp/package.json`**

```json
{
  "name": "@clouddrove/vanisec-mcp",
  "version": "0.1.0",
  "description": "MCP server for creating Vanisec one-time secrets. Encrypts locally; the server only ever receives ciphertext.",
  "license": "MIT",
  "type": "module",
  "bin": { "vanisec-mcp": "./dist/index.js" },
  "files": ["dist"],
  "engines": { "node": ">=18" },
  "scripts": {
    "build": "tsup",
    "test": "node --import tsx --test test/*.test.ts",
    "test:integration": "node --import tsx --test test/integration.test.ts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.30.0",
    "zod": "^4.4.3"
  },
  "devDependencies": {
    "tsup": "^8.5.1",
    "tsx": "^4.23.12",
    "typescript": "^5.2.2"
  }
}
```

- [ ] **Step 2: Create `mcp/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noEmit": true,
    "baseUrl": ".",
    "paths": { "@lib/*": ["../lib/*"] }
  },
  "include": ["src/**/*", "test/**/*", "tsup.config.ts"]
}
```

`lib` includes `DOM` because `lib/clientCrypto.ts` refers to `SubtleCrypto` and `BufferSource`.

- [ ] **Step 3: Create `mcp/tsup.config.ts`**

```ts
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node18',
  clean: true,
  // lib/ lives outside this package, so it must be inlined rather than
  // left as a bare import that npm consumers cannot resolve.
  noExternal: [/^@lib\//],
  banner: { js: '#!/usr/bin/env node' },
})
```

- [ ] **Step 4: Install dependencies**

Run: `cd mcp && npm install`
Expected: `node_modules` created, no peer warnings that mention `zod`.

- [ ] **Step 5: Write the failing crypto bridge test**

Create `mcp/test/crypto-bridge.test.ts`:

```ts
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
```

- [ ] **Step 6: Run the test**

Run: `cd mcp && npm test`
Expected: PASS. If the `@lib/*` alias fails to resolve, add `"tsx": { "tsconfig": "./tsconfig.json" }` handling by confirming `tsx` reads `tsconfig.json` paths from the package directory.

- [ ] **Step 7: Exclude `mcp/` from the container image**

In `.dockerignore`, below the `_infra` entry, add:

```
# MCP server (published to npm, not part of the web image)
mcp
```

- [ ] **Step 8: Verify the web image still builds and is unaffected**

Run: `docker build -q -t vanisec:mcp-excluded . && docker run --rm vanisec:mcp-excluded ls /app`
Expected: build succeeds; output lists `server.js`, `node_modules`, `package.json`, `public` and no `mcp`.

- [ ] **Step 9: Commit**

```bash
git add mcp/package.json mcp/tsconfig.json mcp/tsup.config.ts mcp/test/crypto-bridge.test.ts mcp/package-lock.json .dockerignore
git commit -m "feat(mcp): package setup and crypto bridge

Imports lib/clientCrypto.ts rather than reimplementing the key
derivation, so the MCP server and the website cannot drift apart. Tests
prove the module round-trips under Node unmodified.

Excludes mcp/ from the Docker image, which matters now that the
Dockerfile copies the whole tree."
```

---

## Task 2: Input validation

**Files:**
- Create: `mcp/src/validate.ts`
- Create: `mcp/test/validate.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks
- Produces: `ALLOWED_EXPIRY_HOURS: readonly number[]`, `DEFAULT_EXPIRY_HOURS: number`, `validateExpiry(hours: number | undefined): number`, `validateNonEmpty(value: string, field: string): string`, `ValidationError` class

- [ ] **Step 1: Write the failing tests**

Create `mcp/test/validate.test.ts`:

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validateExpiry, validateNonEmpty, ValidationError, DEFAULT_EXPIRY_HOURS } from '../src/validate.js'

test('accepts each allowed expiry value', () => {
  for (const h of [1, 6, 24, 72, 168]) assert.equal(validateExpiry(h), h)
})

test('defaults when expiry is omitted', () => {
  assert.equal(validateExpiry(undefined), DEFAULT_EXPIRY_HOURS)
})

test('rejects an expiry outside the allowed set', () => {
  assert.throws(() => validateExpiry(5), ValidationError)
  assert.throws(() => validateExpiry(0), ValidationError)
  assert.throws(() => validateExpiry(-24), ValidationError)
})

test('rejects a non-integer expiry', () => {
  assert.throws(() => validateExpiry(24.5), ValidationError)
})

test('validateNonEmpty returns the value and rejects blanks', () => {
  assert.equal(validateNonEmpty('x', 'text'), 'x')
  assert.throws(() => validateNonEmpty('', 'text'), ValidationError)
  assert.throws(() => validateNonEmpty('   ', 'text'), ValidationError)
})

test('the error message names the offending field', () => {
  assert.throws(() => validateNonEmpty('', 'password'), /password/)
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd mcp && npm test`
Expected: FAIL, cannot find module `../src/validate.js`.

- [ ] **Step 3: Implement `mcp/src/validate.ts`**

```ts
export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

// Mirrors ALLOWED_EXPIRY_HOURS in app/api/secrets/route.ts. Checked here so a
// bad value fails before a network round trip.
export const ALLOWED_EXPIRY_HOURS = [1, 6, 24, 72, 168] as const
export const DEFAULT_EXPIRY_HOURS = 24

export function validateExpiry(hours: number | undefined): number {
  if (hours === undefined) return DEFAULT_EXPIRY_HOURS
  if (!Number.isInteger(hours) || !ALLOWED_EXPIRY_HOURS.includes(hours as never)) {
    throw new ValidationError(
      `expiresIn must be one of ${ALLOWED_EXPIRY_HOURS.join(', ')} hours, got ${hours}`
    )
  }
  return hours
}

export function validateNonEmpty(value: string, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new ValidationError(`${field} must be a non-empty string`)
  }
  return value
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd mcp && npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add mcp/src/validate.ts mcp/test/validate.test.ts
git commit -m "feat(mcp): input validation

Rejects an out-of-range expiry locally so a bad value fails before a
network round trip rather than as a 400 the model has to interpret."
```

---

## Task 3: Local credential generation

**Files:**
- Create: `mcp/src/generate.ts`
- Create: `mcp/test/generate.test.ts`

**Interfaces:**
- Consumes: `ValidationError` from `../src/validate.js`
- Produces: `type SecretType = 'password' | 'token' | 'hex'`, `GENERATION_RULES: Record<SecretType, { alphabet: string; defaultLength: number; min: number; max: number }>`, `generateSecret(type: SecretType, length?: number): string`, `generatePassword(): string`

- [ ] **Step 1: Write the failing tests**

Create `mcp/test/generate.test.ts`:

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { generateSecret, generatePassword, GENERATION_RULES } from '../src/generate.js'
import { ValidationError } from '../src/validate.js'

test('produces the default length for each type', () => {
  for (const type of ['password', 'token', 'hex'] as const) {
    assert.equal(generateSecret(type).length, GENERATION_RULES[type].defaultLength)
  }
})

test('honours an explicit length', () => {
  assert.equal(generateSecret('token', 16).length, 16)
})

test('only emits characters from the declared alphabet', () => {
  for (const type of ['password', 'token', 'hex'] as const) {
    const out = generateSecret(type, GENERATION_RULES[type].min)
    for (const ch of out) assert.ok(GENERATION_RULES[type].alphabet.includes(ch), `${type}: ${ch}`)
  }
})

test('rejects lengths outside the allowed range', () => {
  assert.throws(() => generateSecret('password', 11), ValidationError)
  assert.throws(() => generateSecret('password', 129), ValidationError)
})

test('rejects an odd hex length so output maps to whole bytes', () => {
  assert.throws(() => generateSecret('hex', 17), ValidationError)
  assert.equal(generateSecret('hex', 18).length, 18)
})

test('rejects an unknown type', () => {
  assert.throws(() => generateSecret('rsa' as never), ValidationError)
})

test('successive values differ', () => {
  const seen = new Set(Array.from({ length: 50 }, () => generateSecret('token')))
  assert.equal(seen.size, 50)
})

test('generatePassword returns a default-length password', () => {
  assert.equal(generatePassword().length, GENERATION_RULES.password.defaultLength)
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd mcp && npm test`
Expected: FAIL, cannot find module `../src/generate.js`.

- [ ] **Step 3: Implement `mcp/src/generate.ts`**

```ts
import { ValidationError } from './validate.js'

export type SecretType = 'password' | 'token' | 'hex'

const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

export const GENERATION_RULES = {
  password: { alphabet: ALPHA + '!@#$%^&*()-_=+', defaultLength: 24, min: 12, max: 128 },
  token: { alphabet: ALPHA, defaultLength: 32, min: 16, max: 128 },
  hex: { alphabet: '0123456789abcdef', defaultLength: 64, min: 16, max: 256 },
} as const

// Rejection sampling. Taking a raw byte modulo the alphabet size would bias
// toward the first (256 % size) characters.
function pick(alphabet: string, count: number): string {
  const out: string[] = []
  const limit = Math.floor(256 / alphabet.length) * alphabet.length
  const buf = new Uint8Array(count * 2)
  while (out.length < count) {
    crypto.getRandomValues(buf)
    for (const byte of buf) {
      if (out.length === count) break
      if (byte < limit) out.push(alphabet[byte % alphabet.length])
    }
  }
  return out.join('')
}

export function generateSecret(type: SecretType, length?: number): string {
  const rule = GENERATION_RULES[type]
  if (!rule) throw new ValidationError(`type must be one of password, token, hex, got ${type}`)

  const len = length ?? rule.defaultLength
  if (!Number.isInteger(len) || len < rule.min || len > rule.max) {
    throw new ValidationError(`length for ${type} must be an integer between ${rule.min} and ${rule.max}`)
  }
  if (type === 'hex' && len % 2 !== 0) {
    throw new ValidationError('length for hex must be even so the output maps to whole bytes')
  }
  return pick(rule.alphabet, len)
}

export function generatePassword(): string {
  return generateSecret('password')
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd mcp && npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add mcp/src/generate.ts mcp/test/generate.test.ts
git commit -m "feat(mcp): local credential generation

Uses rejection sampling rather than a modulo of a raw byte, which would
bias output toward the first characters of the alphabet. Hex lengths are
restricted to even numbers so the value maps to whole bytes."
```

---

## Task 4: Clipboard, failing closed

**Files:**
- Create: `mcp/src/clipboard.ts`
- Create: `mcp/test/clipboard.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks
- Produces: `ClipboardUnavailableError` class, `detectClipboardCommand(platform: string, lookup: (cmd: string) => boolean): string[] | null`, `copyToClipboard(value: string): Promise<void>`, `inlinePasswordAllowed(): boolean`

- [ ] **Step 1: Write the failing tests**

Create `mcp/test/clipboard.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd mcp && npm test`
Expected: FAIL, cannot find module `../src/clipboard.js`.

- [ ] **Step 3: Implement `mcp/src/clipboard.ts`**

```ts
import { spawnSync, spawn } from 'node:child_process'

export class ClipboardUnavailableError extends Error {
  constructor() {
    super(
      'No clipboard is available on this machine, which is normal over SSH or in a container. ' +
        'The link password would otherwise have to be returned in this conversation, so this tool ' +
        'stops here instead. Use vanisec_create_secret with a password you choose, or set ' +
        'VANISEC_ALLOW_INLINE_PASSWORD=1 to accept the password appearing in the conversation.'
    )
    this.name = 'ClipboardUnavailableError'
  }
}

function commandExists(cmd: string): boolean {
  const probe = process.platform === 'win32' ? 'where' : 'which'
  return spawnSync(probe, [cmd], { stdio: 'ignore' }).status === 0
}

// Split out from copyToClipboard so the platform matrix is testable without
// touching the real system clipboard.
export function detectClipboardCommand(
  platform: string,
  lookup: (cmd: string) => boolean = commandExists
): string[] | null {
  if (platform === 'darwin' && lookup('pbcopy')) return ['pbcopy']
  if (platform === 'win32' && lookup('clip')) return ['clip']
  if (platform === 'linux') {
    if (lookup('wl-copy')) return ['wl-copy']
    if (lookup('xclip')) return ['xclip', '-selection', 'clipboard']
  }
  return null
}

export function inlinePasswordAllowed(): boolean {
  return process.env.VANISEC_ALLOW_INLINE_PASSWORD === '1'
}

export async function copyToClipboard(value: string): Promise<void> {
  const argv = detectClipboardCommand(process.platform)
  if (!argv) throw new ClipboardUnavailableError()

  const [cmd, ...args] = argv
  await new Promise<void>((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ['pipe', 'ignore', 'ignore'] })
    child.on('error', reject)
    child.on('close', (code) =>
      code === 0 ? resolve() : reject(new Error(`${cmd} exited with code ${code}`))
    )
    child.stdin.end(value)
  })
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd mcp && npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add mcp/src/clipboard.ts mcp/test/clipboard.test.ts
git commit -m "feat(mcp): clipboard delivery that fails closed

When no clipboard exists the tool stops rather than returning the
password in the response. A silent fallback would undo the only reason
the generate tool exists, at the moment nobody is watching for it.
VANISEC_ALLOW_INLINE_PASSWORD=1 makes the degraded mode a deliberate
choice visible in the client configuration."
```

---

## Task 5: Vanisec API client

**Files:**
- Create: `mcp/src/vanisec.ts`
- Create: `mcp/test/vanisec.test.ts`

**Interfaces:**
- Consumes: `validateExpiry`, `validateNonEmpty` from `./validate.js`; `encryptWithPassword` from `@lib/clientCrypto`
- Produces: `VanisecApiError` class, `baseUrl(): string`, `createSecret(opts: { text: string; password: string; expiresIn?: number; fetchImpl?: typeof fetch }): Promise<{ url: string; expiresAt: string }>`

- [ ] **Step 1: Write the failing tests**

Create `mcp/test/vanisec.test.ts`:

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createSecret, baseUrl, VanisecApiError } from '../src/vanisec.js'
import { decryptWithPassword } from '@lib/clientCrypto'

function stubFetch(status: number, body: unknown, capture?: { body?: any }) {
  return async (_url: string, init?: RequestInit) => {
    if (capture) capture.body = JSON.parse(String(init?.body))
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

test('sends ciphertext, never the plaintext or the password', async () => {
  const cap: { body?: any } = {}
  await createSecret({
    text: 'super secret value',
    password: 'pw',
    fetchImpl: stubFetch(200, { id: 'abc' }, cap) as never,
  })

  const sent = JSON.stringify(cap.body)
  assert.ok(!sent.includes('super secret value'), 'plaintext leaked to the wire')
  assert.ok(!sent.includes('"pw"'), 'password leaked to the wire')
  assert.ok(cap.body.ciphertext.length > 0)
  assert.equal(cap.body.passwordProtected, true)
  assert.ok(cap.body.iterations >= 600000)
})

test('the uploaded ciphertext decrypts back to the envelope', async () => {
  const cap: { body?: any } = {}
  await createSecret({ text: 'hello', password: 'pw', fetchImpl: stubFetch(200, { id: 'abc' }, cap) as never })

  const out = await decryptWithPassword(
    { ciphertext: cap.body.ciphertext, iv: cap.body.iv },
    'pw',
    cap.body.encSalt,
    cap.body.iterations
  )
  assert.deepEqual(JSON.parse(out), { text: 'hello', file: null })
})

test('builds the share URL from the returned id', async () => {
  const res = await createSecret({
    text: 'x',
    password: 'pw',
    fetchImpl: stubFetch(200, { id: 'the-id' }) as never,
  })
  assert.equal(res.url, `${baseUrl()}/secret/the-id`)
  assert.ok(!Number.isNaN(Date.parse(res.expiresAt)))
})

test('surfaces a rate limit as a readable error', async () => {
  await assert.rejects(
    () => createSecret({ text: 'x', password: 'pw', fetchImpl: stubFetch(429, { error: 'Too many' }) as never }),
    (e: Error) => e instanceof VanisecApiError && /rate limit/i.test(e.message)
  )
})

test('surfaces an oversized payload as a readable error', async () => {
  await assert.rejects(
    () => createSecret({ text: 'x', password: 'pw', fetchImpl: stubFetch(413, {}) as never }),
    (e: Error) => e instanceof VanisecApiError && /too large/i.test(e.message)
  )
})

test('does not retry a network failure', async () => {
  let calls = 0
  const failing = async () => {
    calls++
    throw new Error('ECONNREFUSED')
  }
  await assert.rejects(() => createSecret({ text: 'x', password: 'pw', fetchImpl: failing as never }))
  assert.equal(calls, 1, 'a retry could leave two live one-time links')
})

test('rejects an invalid expiry before making a request', async () => {
  let calls = 0
  const counting = async () => {
    calls++
    return new Response('{}', { status: 200 })
  }
  await assert.rejects(() =>
    createSecret({ text: 'x', password: 'pw', expiresIn: 5, fetchImpl: counting as never })
  )
  assert.equal(calls, 0)
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd mcp && npm test`
Expected: FAIL, cannot find module `../src/vanisec.js`.

- [ ] **Step 3: Implement `mcp/src/vanisec.ts`**

```ts
import { encryptWithPassword } from '@lib/clientCrypto'
import { validateExpiry, validateNonEmpty } from './validate.js'

export class VanisecApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'VanisecApiError'
  }
}

const DEFAULT_BASE_URL = 'https://vanisec.clouddrove.com'

export function baseUrl(): string {
  return (process.env.VANISEC_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '')
}

export interface CreateSecretOptions {
  text: string
  password: string
  expiresIn?: number
  fetchImpl?: typeof fetch
}

export async function createSecret(
  opts: CreateSecretOptions
): Promise<{ url: string; expiresAt: string }> {
  const text = validateNonEmpty(opts.text, 'text')
  const password = validateNonEmpty(opts.password, 'password')
  const expiresIn = validateExpiry(opts.expiresIn)
  const doFetch = opts.fetchImpl ?? fetch

  // The API expects the same {text, file} envelope the website encrypts.
  const envelope = JSON.stringify({ text, file: null })
  const enc = await encryptWithPassword(envelope, password)

  let res: Response
  try {
    // No retry. A retry of a create that actually succeeded would leave two
    // live one-time links for one secret, and the caller only learns of one.
    res = await doFetch(`${baseUrl()}/api/secrets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ciphertext: enc.ciphertext,
        iv: enc.iv,
        passwordProtected: true,
        encSalt: enc.encSalt,
        authSalt: enc.authSalt,
        verifier: enc.verifier,
        iterations: enc.iterations,
        expiresIn,
      }),
    })
  } catch (cause) {
    throw new VanisecApiError(
      `Could not reach ${baseUrl()}: ${(cause as Error).message}. The secret was not created.`
    )
  }

  if (res.status === 429) {
    const retryAfter = res.headers.get('Retry-After')
    throw new VanisecApiError(
      `Vanisec rate limit reached.${retryAfter ? ` Try again in ${retryAfter} seconds.` : ''}`
    )
  }
  if (res.status === 413) {
    throw new VanisecApiError('The secret is too large to store.')
  }
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}))
    throw new VanisecApiError(
      `Vanisec returned ${res.status}${(detail as { error?: string }).error ? `: ${(detail as { error?: string }).error}` : ''}`
    )
  }

  const { id } = (await res.json()) as { id?: string }
  if (!id) throw new VanisecApiError('Vanisec accepted the secret but returned no id.')

  return {
    url: `${baseUrl()}/secret/${id}`,
    expiresAt: new Date(Date.now() + expiresIn * 3600_000).toISOString(),
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd mcp && npm test`
Expected: PASS, including the two tests asserting no plaintext or password reaches the wire.

- [ ] **Step 5: Commit**

```bash
git add mcp/src/vanisec.ts mcp/test/vanisec.test.ts
git commit -m "feat(mcp): Vanisec API client

Encrypts locally and uploads ciphertext only, with tests asserting that
neither the plaintext nor the password appears in the request body.

A network failure is reported rather than retried. Retrying a create
that already succeeded would leave two live one-time links for one
secret while the caller only knows about one."
```

---

## Task 6: MCP server and tool registration

**Files:**
- Create: `mcp/src/index.ts`
- Create: `mcp/test/tools.test.ts`

**Interfaces:**
- Consumes: `createSecret`, `baseUrl` from `./vanisec.js`; `generateSecret`, `generatePassword`, `GENERATION_RULES` from `./generate.js`; `copyToClipboard`, `inlinePasswordAllowed`, `ClipboardUnavailableError` from `./clipboard.js`
- Produces: `buildServer(deps): McpServer` and a `main()` that connects stdio. `deps` is injected so tools are testable without a transport.

- [ ] **Step 1: Write the failing tests**

Create `mcp/test/tools.test.ts`:

```ts
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
    { createSecret: ok, copyToClipboard: async (v: string) => void (copied = v), clipboardAvailable: true }
  )
  const text = JSON.stringify(res)
  assert.ok(copied && copied.length >= 12)
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
      clipboardAvailable: false,
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd mcp && npm test`
Expected: FAIL, cannot find module `../src/index.js`.

- [ ] **Step 3: Implement `mcp/src/index.ts`**

```ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { createSecret as realCreateSecret, baseUrl } from './vanisec.js'
import { generateSecret, generatePassword, GENERATION_RULES, type SecretType } from './generate.js'
import { copyToClipboard as realCopy, inlinePasswordAllowed } from './clipboard.js'

type ToolResult = { content: { type: 'text'; text: string }[]; isError?: boolean }

const text = (t: string, isError = false): ToolResult => ({
  content: [{ type: 'text', text: t }],
  ...(isError ? { isError: true } : {}),
})

export async function handleCreate(
  args: { text: string; password: string; expiresIn?: number },
  deps: { createSecret?: typeof realCreateSecret } = {}
): Promise<ToolResult> {
  const create = deps.createSecret ?? realCreateSecret
  try {
    const { url, expiresAt } = await create({
      text: args.text,
      password: args.password,
      expiresIn: args.expiresIn,
    })
    return text(
      `One-time link created.\n\n${url}\n\nExpires ${expiresAt}. Opening it once destroys the secret. ` +
        `The recipient needs the password you chose; send it through a different channel.`
    )
  } catch (e) {
    return text(`Could not create the secret: ${(e as Error).message}`, true)
  }
}

export async function handleGenerate(
  args: { type: SecretType; length?: number; expiresIn?: number },
  deps: {
    createSecret?: typeof realCreateSecret
    copyToClipboard?: (v: string) => Promise<void>
    clipboardAvailable?: boolean
  } = {}
): Promise<ToolResult> {
  const create = deps.createSecret ?? realCreateSecret
  const copy = deps.copyToClipboard ?? realCopy
  try {
    const value = generateSecret(args.type, args.length)
    const password = generatePassword()

    // Put the password on the clipboard before creating the secret. If the
    // clipboard is unavailable there is then no orphaned live link.
    if (!inlinePasswordAllowed()) await copy(password)

    const { url, expiresAt } = await create({ text: value, password, expiresIn: args.expiresIn })

    const tail = inlinePasswordAllowed()
      ? `\n\nPassword: ${password}\n(VANISEC_ALLOW_INLINE_PASSWORD is set, so it appears here.)`
      : `\n\nThe link password is on your clipboard. It is not shown here and is not in this conversation.`

    return text(
      `Generated a ${args.type} and shared it as a one-time link.\n\n${url}\n\nExpires ${expiresAt}.` +
        tail
    )
  } catch (e) {
    return text(`Could not generate and share the secret: ${(e as Error).message}`, true)
  }
}

export function buildServer(): McpServer {
  const server = new McpServer({ name: 'vanisec', version: '0.1.0' })

  server.registerTool(
    'vanisec_create_secret',
    {
      title: 'Share a secret as a one-time link',
      description:
        'Encrypts a secret you already have and returns a one-time Vanisec link. Encryption happens on this machine; ' +
        'Vanisec only ever receives ciphertext. Note that the secret and password you pass in remain in this ' +
        'conversation. If you do not already have the secret, prefer vanisec_generate_secret, which keeps both out of it.',
      inputSchema: {
        text: z.string().min(1).describe('The secret to share'),
        password: z.string().min(1).describe('Password protecting the link. Send it to the recipient separately.'),
        expiresIn: z
          .number()
          .optional()
          .describe('Hours until expiry. One of 1, 6, 24, 72, 168. Defaults to 24.'),
      },
    },
    (args) => handleCreate(args)
  )

  server.registerTool(
    'vanisec_generate_secret',
    {
      title: 'Generate a credential and share it',
      description:
        'Generates a password, token or hex string on this machine, shares it as a one-time Vanisec link, and puts ' +
        'the link password on the system clipboard. Neither the generated value nor the password appears in this ' +
        'conversation, so prefer this over vanisec_create_secret whenever the secret does not already exist. ' +
        'Requires a clipboard; it fails rather than revealing the password if none is available.',
      inputSchema: {
        type: z.enum(['password', 'token', 'hex']).describe('What kind of credential to generate'),
        length: z
          .number()
          .optional()
          .describe(
            `Characters. password ${GENERATION_RULES.password.min}-${GENERATION_RULES.password.max} (default ${GENERATION_RULES.password.defaultLength}), ` +
              `token ${GENERATION_RULES.token.min}-${GENERATION_RULES.token.max} (default ${GENERATION_RULES.token.defaultLength}), ` +
              `hex ${GENERATION_RULES.hex.min}-${GENERATION_RULES.hex.max} even only (default ${GENERATION_RULES.hex.defaultLength})`
          ),
        expiresIn: z
          .number()
          .optional()
          .describe('Hours until expiry. One of 1, 6, 24, 72, 168. Defaults to 24.'),
      },
    },
    (args) => handleGenerate(args)
  )

  return server
}

async function main() {
  const server = buildServer()
  // stdout carries the protocol, so diagnostics must go to stderr.
  console.error(`vanisec-mcp ready, targeting ${baseUrl()}`)
  await server.connect(new StdioServerTransport())
}

// Only run when executed directly, so tests can import the handlers.
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd mcp && npm test`
Expected: PASS, including the assertion that the generated password never appears in the tool result.

- [ ] **Step 5: Build and smoke test the binary**

Run:
```bash
cd mcp && npm run build
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node dist/index.js
```
Expected: a JSON-RPC response listing both tools; the readiness line appears on stderr, not stdout.

- [ ] **Step 6: Commit**

```bash
git add mcp/src/index.ts mcp/test/tools.test.ts
git commit -m "feat(mcp): server and tool registration

Tool descriptions state what reaches the conversation, since the model
uses them to choose between the two tools, and point at the generate
tool as the better default.

The password is copied before the secret is created, so a clipboard
failure cannot leave an orphaned live link whose password nobody has.
Failures return isError rather than a successful result containing an
error string, which the model would otherwise report as a share."
```

---

## Task 7: Integration test against a real instance

**Files:**
- Create: `mcp/test/integration.test.ts`

**Interfaces:**
- Consumes: `createSecret` from `../src/vanisec.js`; `decryptWithPassword`, `computeVerifier` from `@lib/clientCrypto`
- Produces: nothing consumed by later tasks

- [ ] **Step 1: Write the test**

Create `mcp/test/integration.test.ts`:

```ts
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync, spawn, type ChildProcess } from 'node:child_process'
import { createSecret } from '../src/vanisec.js'
import { decryptWithPassword, computeVerifier, fromBase64Url } from '@lib/clientCrypto'

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
```

Remove `fromBase64Url` from the import list if the linter flags it as unused; it is listed only if a later assertion needs it.

- [ ] **Step 2: Build the web app so the standalone server exists**

Run: `cd .. && npm run build && cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/`
Expected: `.next/standalone/server.js` exists.

- [ ] **Step 3: Run the integration test**

Run: `cd mcp && npm run test:integration`
Expected: both tests PASS.

- [ ] **Step 4: Commit**

```bash
git add mcp/test/integration.test.ts
git commit -m "test(mcp): end to end against a real instance

A create-only tool that silently produced undecryptable secrets would
look like it worked, so the test retrieves and decrypts through the API
rather than trusting a 200. Also asserts encSalt is withheld until the
verifier is accepted, and that the link dies after one retrieval."
```

---

## Task 8: The `/mcp` page

**Files:**
- Create: `app/mcp/page.tsx`

**Interfaces:**
- Consumes: nothing
- Produces: the `/mcp` route linked from Task 9

- [ ] **Step 1: Create `app/mcp/page.tsx`**

Follow the structure of `app/api/page.tsx`: a `Metadata` export, a centred header, then `<section>` blocks using the same Tailwind classes. Reuse the local `CARD`, `PRE`, `H2`, `H3` constants pattern from that file.

Sections, in order:

1. **Header.** Title "MCP Server", subtitle "Share secrets from Claude and other AI clients without pasting them into chat".
2. **What reaches the conversation.** Render this table, which is the reason someone would choose one tool over the other:

```
| Tool                    | Secret value     | Password         | Link            |
| vanisec_create_secret   | in conversation  | in conversation  | in conversation |
| vanisec_generate_secret | never            | clipboard only   | in conversation |
```

Follow it with: `create_secret` does not make anything worse, because the secret was already typed into the conversation, but the transcript keeps it. `generate_secret` produces the value locally and puts the link password on the clipboard, so the conversation holds only a URL, which is useless on its own.

3. **Install.** A `<pre>` per client. Claude Desktop, `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "vanisec": {
      "command": "npx",
      "args": ["-y", "@clouddrove/vanisec-mcp"]
    }
  }
}
```

Claude Code: `claude mcp add vanisec -- npx -y @clouddrove/vanisec-mcp`

4. **Tools.** One block per tool with parameters and an example prompt ("Generate a 32 character token and give me a one-time link").
5. **Self-hosting.** Set `VANISEC_BASE_URL` to point at your own instance, shown as an `env` block in the same config.
6. **Why there is no retrieval tool.** State that retrieval would place the decrypted secret in the model context and the transcript, which would stop a one-time secret from being one-time, and that this is deliberate.
7. **Clipboard requirement.** Over SSH or in a container there may be no clipboard, in which case `generate_secret` fails rather than revealing the password, and `VANISEC_ALLOW_INLINE_PASSWORD=1` opts into the degraded behaviour.

Escape braces in JSX as `&#123;` and `&#125;`, and apostrophes as `&apos;`, or `react/no-unescaped-entities` will fail the lint job.

- [ ] **Step 2: Verify it builds, lints and prerenders**

Run: `npm run lint && npm run build`
Expected: lint clean; build output lists `/mcp` with the `○` static marker.

- [ ] **Step 3: Check the rendered page for escaping artifacts**

Run:
```bash
python3 - <<'EOF'
import re, html
s = open('.next/server/app/mcp.html', encoding='utf8', errors='replace').read()
body = re.sub(r'<script.*?</script>', '', s, flags=re.S)
txt = html.unescape(re.sub(r'<[^>]+>', ' ', body))
for probe in ['&#123;', 'undefined', 'NaN', '[object']:
    print(probe, 'present:', probe in txt)
EOF
```
Expected: all four report `False`.

- [ ] **Step 4: Commit**

```bash
git add app/mcp/page.tsx
git commit -m "feat(web): /mcp page

Leads with what does and does not enter the conversation, because that
is the information someone needs to decide whether to install this and
which tool to use. States plainly that retrieval is deliberately absent
and why."
```

---

## Task 9: Homepage card, navigation and sitemap

**Files:**
- Modify: `components/Features.tsx`, `components/Header.tsx`, `components/Footer.tsx`, `app/sitemap.ts`

**Interfaces:**
- Consumes: the `/mcp` route from Task 8
- Produces: nothing consumed later

- [ ] **Step 1: Add the sixth feature card**

In `components/Features.tsx`, append to the array that currently ends with the `File Upload` entry, matching the existing object shape exactly (read the neighbouring entries for the `icon` field's format before writing):

```tsx
{
  title: 'Use it from Claude',
  description:
    'Share a secret straight from your AI client with the Vanisec MCP server. Generated credentials never enter the conversation.',
}
```

- [ ] **Step 2: Add the nav link**

In `components/Header.tsx`, add `{ href: '/mcp', ... }` between the `/api` and `/faq` entries, matching the label key the neighbouring entries use.

- [ ] **Step 3: Add the footer link**

In `components/Footer.tsx`, add `/mcp` to the same group that contains `/api`.

- [ ] **Step 4: Add the sitemap entry**

In `app/sitemap.ts`, add `/mcp` alongside the other routes, copying the `changeFrequency` and `priority` used by `/api`.

- [ ] **Step 5: Verify**

Run: `npm run lint && npm run build && grep -c '/mcp' .next/server/app/index.html`
Expected: lint clean, build succeeds, the grep returns at least 1.

- [ ] **Step 6: Confirm the sitemap contains the route**

Run: `npm run build && grep -o '/mcp' .next/server/app/sitemap.xml.body 2>/dev/null || echo "check sitemap output path"`
Expected: `/mcp` appears. If the file path differs in this Next version, start the app and run `curl -s localhost:3000/sitemap.xml | grep mcp`.

- [ ] **Step 7: Commit**

```bash
git add components/Features.tsx components/Header.tsx components/Footer.tsx app/sitemap.ts
git commit -m "feat(web): link the MCP server from the homepage and navigation

Adds a sixth Features card following the pattern used when File Upload
was added, plus nav, footer and sitemap entries so the page is
discoverable and indexable."
```

---

## Self-Review Notes

**Spec coverage.** Every section of the spec maps to a task: architecture and crypto import to Task 1, the tool definitions to Tasks 2, 3, 5 and 6, clipboard behaviour to Task 4, configuration to Task 5, error handling to Tasks 5 and 6, website changes to Tasks 8 and 9, testing to Tasks 1 through 7. Phase 2, the hosted `/api/mcp` endpoint, is explicitly out of scope for this plan and gets its own spec and plan.

**Deliberately deferred.** Publishing to npm is not a task here. The package is buildable and testable, but the first publish should be a decision made once the code has been reviewed, not a step an executor performs unprompted.

**Type consistency.** `createSecret` returns `{ url, expiresAt }` in Task 5 and is consumed with those names in Tasks 6 and 7. `GENERATION_RULES` keys `alphabet`, `defaultLength`, `min`, `max` are defined in Task 3 and read in Tasks 3 and 6. `ValidationError` is defined in Task 2 and thrown in Task 3. `ClipboardUnavailableError` is defined in Task 4 and referenced in Task 6.
