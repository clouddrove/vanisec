# @clouddrove/vanisec-mcp

Create [Vanisec](https://vanisec.clouddrove.com) one-time secret links from Claude
or any other MCP client, without pasting the secret into a chat channel.

Encryption happens on your machine. Vanisec receives ciphertext and never sees
the plaintext, the password or the key.

## What reaches the conversation

This is the thing worth understanding before you install it.

| Tool | Secret value | Password | Link |
|------|--------------|----------|------|
| `vanisec_create_secret` | in conversation | in conversation | in conversation |
| `vanisec_generate_secret` | never | clipboard only | in conversation |

`vanisec_create_secret` does not make anything worse. You already typed the
secret into the conversation to call it. But the transcript keeps it.

`vanisec_generate_secret` is the safer path. It generates the credential in
process, encrypts it, and writes the link password to your system clipboard. The
conversation ends up holding only a URL, which is useless without the password.

A Vanisec URL and its password together grant access, which is why the clipboard
step matters and why it fails rather than falling back to printing the password.

## There is no retrieval tool

By design. A retrieved secret would land in the model's context and in the
conversation transcript, so a one-time secret would stop being one-time in any
useful sense. Open the link in a browser instead.

## Install

Claude Code:

```
claude mcp add vanisec -- npx -y @clouddrove/vanisec-mcp
```

Claude Desktop, in `claude_desktop_config.json`:

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

Requires Node 22 or newer.

## Tools

### `vanisec_create_secret`

| Parameter | Required | Notes |
|-----------|----------|-------|
| `text` | yes | The secret to share. |
| `password` | yes | Protects the link. Send it to the recipient separately. |
| `expiresIn` | no | Hours. One of 1, 6, 24, 72, 168. Defaults to 24. |

### `vanisec_generate_secret`

| Parameter | Required | Notes |
|-----------|----------|-------|
| `type` | yes | `password`, `token` or `hex`. |
| `length` | no | See the table below. |
| `expiresIn` | no | As above. |

| `type` | Default length | Allowed range |
|--------|----------------|---------------|
| `password` | 24 | 12 to 128 |
| `token` | 32 | 16 to 128 |
| `hex` | 64 | 16 to 256, even numbers only |

The link password is written to your clipboard and is not returned.

Try: "Generate a 32 character token and give me a one-time link."

## Prompts

Two prompts, for the cases where picking the wrong tool is the actual risk.

### `share-credential`

| Argument | Required | Notes |
|----------|----------|-------|
| `what` | no | What needs sharing, such as a database password or an API key. |
| `alreadyExists` | no | `yes` if the credential already exists somewhere else and you have the value in hand. Leave it out if it still has to be created. |

Points at `vanisec_generate_secret` when the credential does not exist yet, since
that keeps both the value and the link password out of the conversation, and
falls back to `vanisec_create_secret` only when the secret already exists
elsewhere. It also covers the two rules that are easy to forget: the link
password travels to the recipient through a different channel than the link, and
opening the link once destroys the secret.

### `rotate-and-share`

| Argument | Required | Notes |
|----------|----------|-------|
| `credential` | yes | The kind of credential being rotated, such as a Postgres password or an AWS access key. |
| `recipient` | no | Who receives the new credential. |

The same push toward `vanisec_generate_secret`, plus the ordering. Generate the
replacement and hand it over, wait for the recipient to confirm it works, and
revoke the old credential only after that. Revoking first locks out everything
still using the old value, and leaves nothing working if the handover fails.

The hosted endpoint at `https://vanisec.clouddrove.com/api/mcp` serves both
prompts as well, worded for that path, where `vanisec_generate_secret` cannot
run.

The same guidance is also packaged as Claude Agent Skills under `skills/` in the
repository, for clients that load skills rather than MCP prompts.

## Clipboard requirement

`vanisec_generate_secret` needs a clipboard: `pbcopy` on macOS, `wl-copy` or
`xclip` on Linux, `clip` on Windows. Over SSH or inside a container there may not
be one, and the tool then fails rather than revealing the password in the
conversation.

Set `VANISEC_ALLOW_INLINE_PASSWORD=1` to accept the password appearing in the
conversation instead. It is off by default deliberately, so choosing it is
visible in your client configuration.

## Self-hosting

Point at your own instance with `VANISEC_BASE_URL`:

```json
{
  "mcpServers": {
    "vanisec": {
      "command": "npx",
      "args": ["-y", "@clouddrove/vanisec-mcp"],
      "env": { "VANISEC_BASE_URL": "https://vanisec.example.com" }
    }
  }
}
```

## How the encryption works

Every secret is password protected. Two values are derived from the password
with PBKDF2-HMAC-SHA256 at 600000 iterations, each with its own random 16 byte
salt:

- an AES-256-GCM key, from `encSalt`, which never leaves your machine
- a verifier, from `authSalt`, sent to the server to gate retrieval

The server stores only the SHA-256 hash of the verifier and compares it in
constant time, so it cannot recover the verifier, the password or the key.
Because the salts differ, holding the verifier reveals nothing about the
encryption key. A wrong guess is rejected without consuming the secret.

This package imports the same crypto module the Vanisec website uses rather than
reimplementing it, so the two cannot drift apart.

## Links

- Website: https://vanisec.clouddrove.com
- Documentation: https://vanisec.clouddrove.com/mcp
- Source: https://github.com/clouddrove/vanisec

MIT licensed.
