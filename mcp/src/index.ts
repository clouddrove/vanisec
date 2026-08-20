import { pathToFileURL } from 'node:url'
import { realpathSync } from 'node:fs'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { createSecret as realCreateSecret, baseUrl } from './vanisec.js'
import { generateSecret, generatePassword, GENERATION_RULES, type SecretType } from './generate.js'
import { copyToClipboard as realCopy, inlinePasswordAllowed } from './clipboard.js'
import { validateExpiry } from './validate.js'

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
  } = {}
): Promise<ToolResult> {
  const create = deps.createSecret ?? realCreateSecret
  const copy = deps.copyToClipboard ?? realCopy
  try {
    validateExpiry(args.expiresIn)

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

// True when this file is the entry point, rather than imported by a test.
//
// Two traps here, both of which produced a server that started and exited
// silently. Comparing raw strings fails for any path needing percent-encoding
// and never matches on Windows, so compare file URLs. And npm installs the bin
// as a symlink, while Node reports the resolved real path in import.meta.url,
// so argv[1] must be resolved before comparing or every npx install is dead.
function isEntryPoint(): boolean {
  const invoked = process.argv[1]
  if (!invoked) return false
  try {
    return import.meta.url === pathToFileURL(realpathSync(invoked)).href
  } catch {
    return false
  }
}

if (isEntryPoint()) {
  main().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
