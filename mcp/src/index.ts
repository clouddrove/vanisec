import { pathToFileURL } from 'node:url'
import { realpathSync } from 'node:fs'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { createSecret as realCreateSecret, baseUrl } from './vanisec.js'
import { generateSecret, generatePassword, GENERATION_RULES, type SecretType } from './generate.js'
import { copyToClipboard as realCopy, inlinePasswordAllowed } from './clipboard.js'
import { validateExpiry } from './validate.js'
import {
  sharePrompt,
  rotatePrompt,
  SHARE_CREDENTIAL_ARGS,
  ROTATE_AND_SHARE_ARGS,
} from './prompts.js'

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
      `Generated a ${args.type} and shared it as a one-time link.\n\n${url}\n\nExpires ${expiresAt}. ` +
        `Opening it once destroys the secret. Send the link and its password through different channels; ` +
        `together they grant access.` +
        tail
    )
  } catch (e) {
    return text(`Could not generate and share the secret: ${(e as Error).message}`, true)
  }
}

// Server-wide guidance, returned at initialization and treated by clients such
// as Codex as standing instructions for the whole session.
//
// This carries the same rule as the prompts, because prompts turn out to be
// close to unreachable in practice: only VS Code with Copilot exposes a way to
// invoke one, the Copilot cloud agents state outright that they support tools
// only, and the Codex docs never mention the primitive. Instructions and tool
// descriptions are the surfaces that actually reach a model.
//
// Codex advises that the first 512 characters be self-contained, since that is
// what a client is guaranteed to keep. The first four entries below are 505
// characters together and hold every rule that changes what the model does; the
// rest is detail that can be truncated without making the guidance wrong.
const INSTRUCTIONS = [
  'If the secret does not exist yet, use vanisec_generate_secret. It creates the value locally and puts the link password on the system clipboard, so neither enters the conversation.',
  'Use vanisec_create_secret only when the secret already exists and you have it. Anything passed to it stays in the transcript for good.',
  'Send the link and its password to the recipient through different channels; together they grant access.',
  'Opening the link once destroys the secret. There is deliberately no retrieval tool.',
  // Everything below this point is outside the 512-character budget.
  'Expiry is 1, 6, 24, 72 or 168 hours and defaults to 24. Encryption happens on this machine, so Vanisec only ever receives ciphertext.',
  'vanisec_generate_secret needs a working clipboard. Without one it fails rather than printing the password.',
  'Do not read a generated value or a link password back to the user, and do not ask for a secret to be pasted in when it can be generated instead.',
].join('\n\n')

export const VERSION = '0.2.0'

export function buildServer(): McpServer {
  // instructions is a server option, not part of the implementation object.
  // Kept in step with mcp/package.json by a test, because a stale version here
  // is invisible: the server still works and only misreports itself to clients.
  const server = new McpServer({ name: 'vanisec', version: VERSION }, { instructions: INSTRUCTIONS })

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
        'Requires a clipboard; it fails rather than revealing the password if none is available. The link and ' +
        'the clipboard password must reach the recipient through different channels.',
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

  // Prompt arguments are strings on the wire, so every schema here is a string
  // schema rather than the richer types the tool inputSchemas use.
  server.registerPrompt(
    'share-credential',
    {
      title: 'Share a credential',
      description:
        'Works out which Vanisec tool fits the situation, and what to do with the link and its password afterwards.',
      argsSchema: {
        what: z.string().optional().describe(SHARE_CREDENTIAL_ARGS.what),
        alreadyExists: z.string().optional().describe(SHARE_CREDENTIAL_ARGS.alreadyExists),
      },
    },
    (args) => sharePrompt(args)
  )

  server.registerPrompt(
    'rotate-and-share',
    {
      title: 'Rotate a credential and hand the new one over',
      description:
        'Replaces an existing credential and gets the new one to its recipient, in an order that never leaves the recipient without a working credential.',
      argsSchema: {
        credential: z.string().min(1).describe(ROTATE_AND_SHARE_ARGS.credential),
        recipient: z.string().optional().describe(ROTATE_AND_SHARE_ARGS.recipient),
      },
    },
    (args) => rotatePrompt(args)
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
