---
name: vanisec-share-secret
description: Use when someone needs to hand a secret to another person, or asks for a one-time link, a self-destructing link, or a safe way to send a password, API key, token, connection string, certificate or recovery code. Covers which of the two Vanisec MCP tools to call, how to keep the secret value and the link password out of the conversation transcript, choosing an expiry, and getting the link and the password to the recipient. Also covers what to do when the Vanisec MCP server is not connected.
license: MIT
---

# Sharing a secret with Vanisec

Vanisec turns a secret into a one-time link. Opening the link once destroys the
secret. Encryption happens on the machine running the MCP server, so Vanisec
only ever stores ciphertext, never the plaintext, the password or the key.

Two tools exist. Choosing the wrong one is the mistake this skill exists to
prevent.

## Choose the tool before anything else

**If the secret does not exist yet, call `vanisec_generate_secret`.** It creates
the value in process, shares it, and writes the link password to the system
clipboard. Neither the value nor the password is ever returned to you, so
neither one enters the conversation.

**Call `vanisec_create_secret` only when the secret already exists somewhere
else and the person asking already has it in hand.** Rotating a database
password they typed out, forwarding a key issued by a cloud console, passing on
a config value from a file: those are cases where the value already exists and
`vanisec_generate_secret` cannot produce it.

Never make up a value yourself and pass it to `vanisec_create_secret`. That is
the same as generating it, except the value is now permanently in the
transcript.

If the request is ambiguous ("send Priya a password for the staging box"), ask
whether the credential already exists. If nobody has issued it yet, generate.

## Why the choice matters

`vanisec_create_secret` takes `text` and `password` as arguments. Everything
passed to a tool is part of the conversation. It is in the transcript, in
whatever the client persists to disk or to a server, and in any context that is
later replayed. Deleting the message does not reliably remove it. Encrypting the
secret afterwards does not help, because the plaintext was already spoken.

`vanisec_generate_secret` never returns either value. The conversation ends up
holding only a URL, which is useless on its own.

| Tool | Secret value | Link password | Link |
|------|--------------|---------------|------|
| `vanisec_create_secret` | in conversation | in conversation | in conversation |
| `vanisec_generate_secret` | never | clipboard only | in conversation |

## `vanisec_generate_secret`

| Parameter | Required | Notes |
|-----------|----------|-------|
| `type` | yes | `password`, `token` or `hex` |
| `length` | no | see the table below |
| `expiresIn` | no | hours, one of 1, 6, 24, 72, 168, defaults to 24 |

| `type` | Default length | Allowed range |
|--------|----------------|---------------|
| `password` | 24 | 12 to 128 |
| `token` | 32 | 16 to 128 |
| `hex` | 64 | 16 to 256, even numbers only |

`password` mixes letters, digits and punctuation, so it suits anything a human
or a login form will accept. `token` is letters and digits only, which is
usually what you want for API keys, bearer tokens and anything that travels
through a URL or a shell. `hex` is lowercase hex digits, for signing keys,
encryption keys and other values a system expects as raw bytes. The defaults are
fine unless the receiving system imposes its own limit; do not shorten a
credential for convenience.

The tool writes the link password to the clipboard before it creates the link.
That ordering is deliberate: if there is no clipboard, the tool fails and no
live link is left behind. It uses `pbcopy` on macOS, `wl-copy` or `xclip` on
Linux, and `clip` on Windows.

**If it reports that no clipboard is available**, the machine is likely a
container or an SSH session with no display. Do not try to work around it. Tell
the user what happened and give them the two real options:

- run the MCP server somewhere with a clipboard, or
- accept `vanisec_create_secret` with a password they choose, understanding that
  the value and the password stay in the transcript.

A human operator can also set `VANISEC_ALLOW_INLINE_PASSWORD=1` in their client
configuration, which makes the tool return the password in the conversation
instead of using the clipboard. That is their decision to make in their own
config, not something to suggest as a quick fix, because it removes the
protection the tool exists to provide.

## `vanisec_create_secret`

| Parameter | Required | Notes |
|-----------|----------|-------|
| `text` | yes | the secret to share |
| `password` | yes | protects the link, sent to the recipient separately |
| `expiresIn` | no | hours, one of 1, 6, 24, 72, 168, defaults to 24 |

The password must be a real password, not a hint and not something guessable
from the surrounding conversation. Anyone who gets the link and guesses the
password gets the secret.

## Choosing `expiresIn`

Only 1, 6, 24, 72 and 168 hours are accepted. Any other number is rejected
before the request leaves the machine. Omitting it gives 24.

- `1` when the recipient is online now and waiting.
- `6` for the same working day.
- `24` (the default) when you do not know exactly when they will look.
- `72` across a weekend.
- `168` (seven days) when the recipient is away or in a distant timezone. This is
  the longest the service allows, so treat it as the exception.

Shorter is better. The link is destroyed on first open, so expiry only bounds
how long an unopened link stays live.

## Getting the link and the password to the recipient

The link and the password together grant access. Either one alone is useless.
Send them through **different channels**, so no single compromised inbox, chat
log or screen share yields both.

For example: link in the team chat, password by phone or SMS. Or link by email,
password through a voice call. Pasting both into the same thread wastes the
entire design.

Tell the recipient two things: the link opens once and is then destroyed, and
they should open it somewhere they can actually store the secret, not on a phone
in a taxi.

## There is no retrieval tool, on purpose

You cannot read a Vanisec secret from here, and no such tool will be added. A
retrieved secret would land in this conversation and in the transcript, so a
one-time secret would stop being one-time in any way that matters. It would also
burn the link, leaving the intended recipient with nothing.

Recipients open the link in a browser and enter the password there. If someone
asks you to fetch a secret for them, explain this and send them the link.

## When Vanisec MCP is not connected

If neither tool is available, do not paste the secret into the conversation as a
fallback. Point the user at one of these instead:

- The web UI at https://vanisec.clouddrove.com, where the secret is encrypted in
  the browser and never reaches the server in plaintext.
- Installing the local MCP server, which is what makes
  `vanisec_generate_secret` possible:
  `claude mcp add vanisec -- npx -y @clouddrove/vanisec-mcp` (Node 22 or newer).
- A hosted MCP endpoint exists at `POST https://vanisec.clouddrove.com/api/mcp`
  for clients that cannot run a local process. It offers `vanisec_create_secret`
  only, and it is not zero-knowledge: the secret and the password reach the
  server in the request body and are encrypted there. Prefer the local package
  wherever it can run.

## Limits worth knowing

- Secret creation is rate limited to 30 per 10 minutes per IP address. The
  hosted MCP endpoint is limited to 20 per 10 minutes per IP.
- A create is never retried automatically. A retry of a create that actually
  succeeded would leave two live one-time links for one secret, and the caller
  would only learn of one. If a call fails, treat the outcome as unknown before
  trying again.
