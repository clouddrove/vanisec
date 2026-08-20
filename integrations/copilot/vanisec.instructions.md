---
name: Vanisec credential sharing
description: Which Vanisec tool to call, with its parameters and limits
applyTo: '**'
---

# Vanisec tool reference

`.github/copilot-instructions.md` carries the rules. This file is the detail
behind them: which tool, which arguments, and what the service accepts.

## Which tool

| Tool | Secret value | Link password | Link |
|------|--------------|---------------|------|
| `vanisec_generate_secret` | never in the conversation | clipboard only | in the conversation |
| `vanisec_create_secret` | in the conversation | in the conversation | in the conversation |

Prefer `vanisec_generate_secret`. Reach for `vanisec_create_secret` only when
the value was issued elsewhere, by a cloud console or a provider CLI, and the
person asking already holds it. Never invent a value and pass it in.

If the request is ambiguous, such as a request to send someone a password for a
staging box, ask whether the credential already exists. If nobody has issued it
yet, generate.

## `vanisec_generate_secret`

| Parameter | Required | Notes |
|-----------|----------|-------|
| `type` | yes | `password`, `token` or `hex` |
| `length` | no | `password` 24 by default (12 to 128), `token` 32 (16 to 128), `hex` 64 (16 to 256, even only) |
| `expiresIn` | no | hours, one of 1, 6, 24, 72, 168, defaults to 24 |

`password` mixes letters, digits and punctuation. `token` is letters and digits
only, which suits API keys and anything travelling through a URL or a shell.
`hex` is lowercase hex digits, for signing and encryption keys. Do not shorten a
credential for convenience.

The password goes to the clipboard before the link is created, so a machine with
no clipboard fails without leaving a live link behind. If that happens, say so
rather than working around it. The two real options are running the server
somewhere with a clipboard, or accepting `vanisec_create_secret` with a password
the user chooses.

## `vanisec_create_secret`

| Parameter | Required | Notes |
|-----------|----------|-------|
| `text` | yes | the secret to share |
| `password` | yes | protects the link, sent to the recipient separately |
| `expiresIn` | no | hours, one of 1, 6, 24, 72, 168, defaults to 24 |

The password has to be a real password, not a hint and not something guessable
from the surrounding conversation.

## Expiry

Only 1, 6, 24, 72 and 168 hours are accepted; anything else is rejected. Use 1
when the recipient is waiting, 6 for the same working day, 24 when you do not
know, 72 across a weekend, 168 only when they are away. Shorter is better. The
link is destroyed on first open, so expiry only bounds how long an unopened link
stays live.

## Limits

Secret creation is rate limited to 30 per 10 minutes per IP address. A create is
never retried automatically: a retry of a create that actually succeeded would
leave two live one-time links for one secret and you would only learn of one. If
a call fails, treat the outcome as unknown before trying again.
