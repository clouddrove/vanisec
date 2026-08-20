# Vanisec MCP Server (create-only)

Status: approved design, not yet implemented
Date: 2026-08-19

## Purpose

Let people share a secret from inside an AI client (Claude Desktop, Claude Code,
or any MCP-capable client) without pasting it into a chat channel, a ticket, or
an email.

The server creates secrets only. It cannot retrieve or decrypt one. That
restriction is deliberate and is the central design decision: a retrieved secret
would land in the model's context and in the transcript, so a one-time secret
would stop being one-time in any meaningful sense. Retrieval belongs in a CLI,
not in MCP.

## Background

Vanisec is zero-knowledge. The browser encrypts, and the server stores only
ciphertext, salts and a hashed verifier. It never sees plaintext, passwords or
keys. Any MCP integration has to preserve that, which rules out a hosted server
that receives plaintext and encrypts on the user's behalf.

Running the server locally over stdio keeps encryption on the user's machine, so
Vanisec learns nothing it does not already learn from the website.

## What enters the conversation

This is the property the design is organised around, so it is stated up front.

| Path | Secret value | Password | URL |
|------|--------------|----------|-----|
| `vanisec_create_secret` | in transcript | in transcript | in transcript |
| `vanisec_generate_secret` | never | never (clipboard) | in transcript |

`create_secret` does not make anything worse: the caller already typed the
secret into the conversation, and the tool's job is to get it out of there and
into a one-time link. It is still worth being explicit that the transcript
retains it.

`generate_secret` is strictly better than what people do today. The value is
generated in process, encrypted, and never returned. The password goes to the
system clipboard. The model receives a URL, which is useless on its own.

A URL plus its password together grant access, so returning both to the model
would make hiding the generated value pointless. That is why the clipboard step
is load-bearing rather than a convenience.

## Architecture

```
mcp/
  src/index.ts        MCP server over stdio, tool registration and dispatch
  src/vanisec.ts      encrypt, POST /api/secrets, build share URL
  src/generate.ts     local random value generation (password, token, hex)
  src/clipboard.ts    OS clipboard write, capability detection
  src/validate.ts     input validation shared by both tools
  package.json        @clouddrove/vanisec-mcp, bin vanisec-mcp
  tsconfig.json
```

### Crypto is imported, not reimplemented

`mcp/src/vanisec.ts` imports `lib/clientCrypto.ts` and `lib/kdfParams.ts` from
the repo root through a tsconfig path mapping, bundled at publish time.

`lib/clientCrypto.ts` depends only on Web Crypto, `btoa`/`atob` and
`TextEncoder`, all of which Node 18+ provides. This was verified: bundling the
module for Node and exercising it produced a correct encrypt, decrypt and
verifier round trip at 600000 iterations with no source changes.

Reimplementing the KDF in the MCP package would let the two drift. A change to
the iteration floor or the envelope shape would break published clients with
nothing failing in CI. Importing removes that class of bug, and is the reason
the package lives in this repo.

### Exclusion from the container image

`mcp/` goes in `.dockerignore`. It is an npm artifact and has no place in the
web image. This matters because the Dockerfile now copies the whole tree.

## Tools

### `vanisec_create_secret`

Share a secret the caller already has.

| Parameter | Type | Required | Notes |
|-----------|------|----------|-------|
| `text` | string | yes | The secret. Non-empty. |
| `password` | string | yes | Protects the link. Non-empty. |
| `expiresIn` | number | no | Hours. One of 1, 6, 24, 72, 168. Default 24. |

Returns `{ url, expiresAt }`.

### `vanisec_generate_secret`

Generate a credential locally and share it without either the value or the
password entering the conversation.

| Parameter | Type | Required | Notes |
|-----------|------|----------|-------|
| `type` | enum | yes | `password`, `token`, or `hex`. |
| `length` | number | no | See table below. Values outside the range are rejected locally. |
| `expiresIn` | number | no | As above. |

| `type` | Alphabet | Default length | Allowed range |
|--------|----------|----------------|---------------|
| `password` | A-Z a-z 0-9 and `!@#$%^&*()-_=+` | 24 | 12 to 128 |
| `token` | A-Z a-z 0-9 (URL safe) | 32 | 16 to 128 |
| `hex` | 0-9 a-f | 64 | 16 to 256, even numbers only |

Lengths count characters, not bytes. `hex` is restricted to even lengths so the
output maps to whole bytes.

Returns `{ url, expiresAt, passwordLocation: "clipboard" }`.

Both the generated value and the link password are produced with
`crypto.getRandomValues`. The value is encrypted and uploaded; the password is
written to the clipboard; neither is returned.

### Tool descriptions

The MCP tool descriptions state what reaches the transcript, because the model
uses them to choose between the two tools. `generate_secret` is described as the
preferred option when the caller does not already have the secret in hand.

## Clipboard behaviour

Detection order by platform: `pbcopy` on macOS, `wl-copy` then `xclip` on Linux,
`clip` on Windows.

When no clipboard is available, which is normal over SSH and in containers,
`generate_secret` fails with an error explaining the situation and pointing at
`create_secret` as the alternative.

It does not fall back to returning the password in the response. A silent
fallback would undo the tool's only reason to exist, at the exact moment nobody
is watching for it. Setting `VANISEC_ALLOW_INLINE_PASSWORD=1` enables the
degraded mode for headless use, so choosing it is deliberate and visible in the
client configuration rather than accidental.

## Configuration

| Variable | Default | Purpose |
|----------|---------|---------|
| `VANISEC_BASE_URL` | `https://vanisec.clouddrove.com` | Point at a self-hosted instance. |
| `VANISEC_ALLOW_INLINE_PASSWORD` | unset | Permit the degraded no-clipboard path. |

No authentication. The Vanisec API requires none.

## Error handling

Errors are returned as readable MCP tool errors, never as a successful result
with an error string inside it, so the model does not report a failure as a
share.

| Condition | Behaviour |
|-----------|-----------|
| Invalid `expiresIn` | Rejected locally before any network call. |
| Empty `text` or `password` | Rejected locally. |
| HTTP 429 | Surface the rate limit and the `Retry-After` value. |
| HTTP 413 | Report that the secret is too large. |
| Network failure | Report plainly. No retry, since a retry could create a second live secret. |
| No clipboard | As described above. |

The no-retry rule matters. A retried create that actually succeeded the first
time leaves two live one-time links for the same secret, and the user only knows
about one.

## Website changes

- **New page `/mcp`.** What it is, install configuration per client, the two
  tools, and a direct statement of what does and does not enter the
  conversation. It carries the same table as the section above, because a user
  deciding whether to install this needs exactly that information.
- **Homepage.** A sixth card in `components/Features.tsx`, "Use it from Claude",
  linking to `/mcp`. Follows the pattern used when File Upload was added.
- **Navigation.** `/mcp` in the header nav between API and FAQ, and in the
  footer.
- **`app/sitemap.ts`.** A new entry.
- **Metadata.** Title, description and canonical, matching the existing pages.

The page is a normal prerendered route, so it keeps the static CSP. It has no
client-side behaviour.

## Testing

- Unit: envelope construction, expiry and input validation, generated value
  shape per type, clipboard detection including the fail-closed path and the
  opt-in override.
- Integration: run each tool against a local instance backed by a throwaway
  Redis, then retrieve and decrypt through the API to prove the secret is real
  and correct. Assert `generate_secret` returns no secret material.
- Regression: assert `lib/clientCrypto.ts` still imports and round-trips under
  Node, so a future browser-only change to it fails loudly here rather than in a
  published client.

The integration test matters more than usual. A create-only tool that silently
produces undecryptable secrets would look like it worked.

## Phasing

**Phase 1, this design.** stdio server, npm package, `/mcp` page, homepage card,
navigation and sitemap.

**Phase 2, separate work.** Hosted endpoint at `/api/mcp` for clients that
cannot run a local process. The page must say plainly that the hosted variant
sends plaintext to the Vanisec server and therefore gives up the zero-knowledge
guarantee. It is a convenience option, not the recommended one, and the wording
should not soften that.

`/mcp` is the documentation page and `/api/mcp` is the future endpoint, so the
two never collide.

## Risks

| Risk | Response |
|------|----------|
| Users assume MCP retrieval exists | The page and the tool descriptions state that retrieval is deliberately absent, with the reason. |
| Clipboard silently unavailable | Fail closed, with an explicit opt-in for the degraded path. |
| Crypto drift between server and API | Import the module rather than reimplement it. Covered by the regression test. |
| Transcript retains `create_secret` input | Documented rather than hidden. `generate_secret` is presented as the better path. |
| Published package breaks on an API change | Integration test runs against a real instance. |

## Out of scope

- Retrieving or decrypting secrets through MCP.
- File attachments. The envelope supports them; the tools do not expose them in
  phase 1.
- Authentication or per-user quotas.
- Any change to the Vanisec API. This is purely a client.
