import { spawnSync, spawn } from 'node:child_process'

export class ClipboardUnavailableError extends Error {
  constructor() {
    super(
      'No clipboard is available on this machine, which is normal over SSH or in a container. ' +
        'The link password would otherwise have to be returned in this conversation, so this tool ' +
        'stops here instead. Use vanisec_create_secret with a password you choose, so the password ' +
        'never needs to go through the clipboard.'
    )
    this.name = 'ClipboardUnavailableError'
  }
}

// A human operator can opt into the password appearing in the conversation
// by setting VANISEC_ALLOW_INLINE_PASSWORD=1. This is intentionally not
// mentioned in the error message above: naming it there would hand the
// model its own bypass for a fail-closed security control. See the /mcp
// page for the documented, human-facing description of this variable.

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
    // Without this, a child that dies between spawn and write raises an
    // unhandled EPIPE on the stdin stream and takes down the process.
    child.stdin.on('error', reject)
    child.stdin.end(value)
  })
}
