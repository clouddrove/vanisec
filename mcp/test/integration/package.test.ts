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

function listTools(command: string): string[] {
  const out = execFileSync(command, {
    cwd: consumer,
    input: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }) + '\n',
    encoding: 'utf8',
  })
  const tools: string[] = []
  for (const line of out.split('\n')) {
    if (!line.trim()) continue
    const parsed = JSON.parse(line) as { result?: { tools?: { name: string }[] } }
    for (const t of parsed.result?.tools ?? []) tools.push(t.name)
  }
  return tools
}

test('the installed bin responds when run through the npm symlink', () => {
  const tools = listTools(join(consumer, 'node_modules', '.bin', 'vanisec-mcp'))
  assert.deepEqual(tools.sort(), ['vanisec_create_secret', 'vanisec_generate_secret'])
})

test('the tarball ships the built entry point, a README and a licence', () => {
  const installed = readdirSync(join(consumer, 'node_modules', '@clouddrove', 'vanisec-mcp'))
  for (const expected of ['dist', 'README.md', 'LICENSE', 'package.json']) {
    assert.ok(installed.includes(expected), `${expected} missing from the published package`)
  }
})
