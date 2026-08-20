// Prompt text, kept apart from the server so it can be tested without a
// transport, the same way handleCreate and handleGenerate are.
//
// Both prompts exist to push the caller toward vanisec_generate_secret. A tool
// description is read once the model has already decided to reach for a tool;
// a prompt is read before that decision, which is where the choice between
// generating and pasting an existing value actually gets made.

export interface PromptResult {
  description: string
  messages: { role: 'user'; content: { type: 'text'; text: string } }[]
  // GetPromptResult in the SDK carries a passthrough index signature. Without
  // one here the shape is structurally narrower and registerPrompt rejects it.
  [key: string]: unknown
}

function userMessage(description: string, text: string): PromptResult {
  return { description, messages: [{ role: 'user', content: { type: 'text', text } }] }
}

// Prompt arguments arrive as strings over the wire, so a yes/no argument has
// to be interpreted rather than trusted to be a boolean.
function saysYes(value: string | undefined): boolean {
  return /^(y|yes|true|1)$/i.test((value ?? '').trim())
}

export const SHARE_CREDENTIAL_ARGS = {
  what: 'What needs sharing, for example a database password or an API key.',
  alreadyExists:
    'Say yes if the credential already exists somewhere else and you have the value in hand. ' +
    'Leave it out if it still has to be created.',
} as const

export const ROTATE_AND_SHARE_ARGS = {
  credential:
    'The kind of credential being rotated, for example a Postgres password, an AWS access key or a webhook signing secret.',
  recipient: 'Who receives the new credential. Optional.',
} as const

export function sharePrompt(args: { what?: string; alreadyExists?: string }): PromptResult {
  const what = (args.what ?? '').trim()
  const subject = what || 'a credential'

  const situation =
    args.alreadyExists === undefined || args.alreadyExists.trim() === ''
      ? 'I have not said whether this credential already exists. Settle that first, because it decides which tool to use.'
      : saysYes(args.alreadyExists)
        ? 'This credential already exists somewhere else and I have the value in hand.'
        : 'This credential does not exist yet, so it can be created from scratch.'

  return userMessage(
    `Choose the right Vanisec tool for sharing ${subject}`,
    `Help me share ${subject} through Vanisec.

${situation}

Choose the tool this way:

- If the credential does not exist yet, use vanisec_generate_secret. It creates the value on this machine and puts the link password on the system clipboard, so neither the value nor the link password ever enters this conversation. This is the default.
- Use vanisec_create_secret only when the credential already exists elsewhere and I have the value in hand. It works, but the value and the link password are passed in as arguments, so both stay in this transcript for good.

Once the link exists, remind me of two things:

1. The link password goes to the recipient through a different channel than the link. Sending both through the same channel is the same as sending the secret in plain text, because either one alone is useless and the pair together is the secret.
2. Opening the link once destroys the secret. The recipient gets exactly one read, so tell them to open it when they are ready to store the value, not to check that the link works.`
  )
}

export function rotatePrompt(args: { credential: string; recipient?: string }): PromptResult {
  const credential = args.credential.trim() || 'credential'
  const named = (args.recipient ?? '').trim()
  const recipient = named || 'the recipient'

  return userMessage(
    `Rotate ${credential} and hand the new one over`,
    `Help me rotate the ${credential} and hand the new one to ${recipient}.

Use vanisec_generate_secret for the replacement. It generates the new ${credential} on this machine and puts the link password on the system clipboard, so the new value and the password stay out of this conversation. Reach for vanisec_create_secret only if the new value has to be issued by the system that owns it, such as a cloud provider minting a key, and I am pasting in what it gave me.

Follow this order and do not reorder it:

1. Generate the new ${credential} and create the one-time link.
2. Send the link to ${recipient}, and send the link password through a different channel than the link.
3. Wait for ${recipient} to confirm they have the new ${credential} and that it works. The link opens once and is then destroyed, so if it expired or was opened by the wrong person, go back to step 1.
4. Only after that confirmation, revoke or delete the old ${credential}.

Revoking first is the mistake worth avoiding. It locks out everything still using the old value, and if anything goes wrong in steps 2 and 3 there is no working credential left at all.

Before step 4, list anything I have to update myself: configuration files, CI variables, secret managers, running services that hold the old value.`
  )
}
