// Packs the package, installs the tarball into a scratch directory, and runs
// the installed bin the way a consumer does.
//
// Everything here passed when the server was run directly from the repo and
// still shipped a dead binary: npm installs the bin as a symlink, Node reports
// the resolved real path in import.meta.url, and the entry-point check compared
// that against the unresolved argv[1]. main() never ran, so the process started,
// printed nothing and exited 0. Since npx is the only way anyone runs this,
// that broke every install.
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const pkgRoot = new URL('../../', import.meta.url).pathname
let consumer: string

before(() => {
  execFileSync('npm', ['run', 'build'], { cwd: pkgRoot, stdio: 'ignore' })
  consumer = mkdtempSync(join(tmpdir(), 'vanisec-mcp-consumer-'))
  execFileSync('npm', ['pack', '--pack-destination', consumer], { cwd: pkgRoot, stdio: 'ignore' })
  const tarball = readdirSync(consumer).find((f) => f.endsWith('.tgz'))
  assert.ok(tarball, 'npm pack produced no tarball')
  execFileSync('npm', ['init', '-y'], { cwd: consumer, stdio: 'ignore' })
  execFileSync('npm', ['install', join(consumer, tarball)], { cwd: consumer, stdio: 'ignore' })
})

after(() => {
  if (consumer) rmSync(consumer, { recursive: true, force: true })
})

// One request per invocation. The bin is a short-lived stdio process, so
// there is no session to hold open between calls.
function rpc(method: string, params?: Record<string, unknown>): unknown {
  const out = execFileSync(bin(), {
    cwd: consumer,
    input: JSON.stringify({ jsonrpc: '2.0', id: 1, method, ...(params ? { params } : {}) }) + '\n',
    encoding: 'utf8',
  })
  for (const line of out.split('\n')) {
    if (!line.trim()) continue
    const parsed = JSON.parse(line) as { id?: number; result?: unknown; error?: { message: string } }
    if (parsed.id !== 1) continue
    if (parsed.error) throw new Error(`${method} failed: ${parsed.error.message}`)
    return parsed.result
  }
  throw new Error(`${method} produced no response`)
}

function bin(): string {
  return join(consumer, 'node_modules', '.bin', 'vanisec-mcp')
}

function listTools(): string[] {
  const res = rpc('tools/list') as { tools?: { name: string }[] }
  return (res.tools ?? []).map((t) => t.name)
}

function listPrompts(): { name: string; arguments?: { name: string; required?: boolean }[] }[] {
  const res = rpc('prompts/list') as {
    prompts?: { name: string; arguments?: { name: string; required?: boolean }[] }[]
  }
  return res.prompts ?? []
}

test('the installed bin responds when run through the npm symlink', () => {
  assert.deepEqual(listTools().sort(), ['vanisec_create_secret', 'vanisec_generate_secret'])
})

test('the installed bin advertises the prompts capability', () => {
  const res = rpc('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'package-test', version: '0.0.0' },
  }) as { capabilities?: Record<string, unknown> }
  assert.ok(
    res.capabilities?.prompts,
    'a package that ships the tools but drops the prompts would otherwise pass every check here'
  )
})

test('the installed bin serves both prompts with the right required flags', () => {
  const prompts = listPrompts()
  assert.deepEqual(prompts.map((p) => p.name).sort(), ['rotate-and-share', 'share-credential'])

  const argsOf = (name: string) =>
    (prompts.find((p) => p.name === name)?.arguments ?? []).map((a) => [a.name, a.required === true])

  assert.deepEqual(argsOf('share-credential'), [
    ['what', false],
    ['alreadyExists', false],
  ])
  assert.deepEqual(argsOf('rotate-and-share'), [
    ['credential', true],
    ['recipient', false],
  ])
})

test('the installed bin interpolates prompt arguments into the message', () => {
  const res = rpc('prompts/get', {
    name: 'rotate-and-share',
    arguments: { credential: 'Postgres password', recipient: 'Priya' },
  }) as { messages?: { content: { type: string; text: string } }[] }

  const text = res.messages?.[0]?.content.text ?? ''
  assert.match(text, /Postgres password/)
  assert.match(text, /Priya/)
  assert.match(text, /vanisec_generate_secret/, 'the prompt exists to steer toward the generating tool')
})

test('the tarball ships the built entry point, a README and a licence', () => {
  const installed = readdirSync(join(consumer, 'node_modules', '@clouddrove', 'vanisec-mcp'))
  for (const expected of ['dist', 'README.md', 'LICENSE', 'package.json']) {
    assert.ok(installed.includes(expected), `${expected} missing from the published package`)
  }
})
