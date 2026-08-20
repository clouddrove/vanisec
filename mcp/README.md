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

## Releasing

Publishing runs in CI, triggered by a tag. There is no manual `npm publish`.

1. Bump `version` in `mcp/package.json`. A test holds the version the server
   reports at initialization equal to this value, so `npm test` fails if only
   one of them moves.
2. Land that on `master`.
3. Tag the commit and push the tag:

```
git tag v0.2.0
git push origin v0.2.0
```

The same tag also builds the container image, so one tag releases whatever is
ready. The site and this package carry separate version numbers, so a tag only
publishes the package when it matches `mcp/package.json`. A site release tagged
`v2.1.0` runs the workflow, finds no match, and stops before publishing rather
than failing.

The workflow also refuses a version that already exists on the registry, since
npm versions are immutable.
It typechecks, tests and builds before publishing, and attaches a provenance
attestation so the registry records which workflow and commit produced the
tarball.

`workflow_dispatch` runs the same checks and packs the tarball without
publishing, which is the way to see exactly what would ship.

## Install

Two ways to run this, and they are not equivalent.

**stdio** runs `npx -y @clouddrove/vanisec-mcp` on your own machine. You get both
tools, and encryption happens locally, so Vanisec only ever receives ciphertext.
Requires Node 22 or newer.

**Hosted** points a client at `https://vanisec.clouddrove.com/api/mcp`. Use it
only when the client cannot run a local process, and read the next section
before you do.

### The hosted endpoint is not zero-knowledge

It receives the secret and the password in plaintext and encrypts them server
side. For the duration of that request Vanisec holds material it otherwise never
sees. That is the opposite of how the rest of this product works, and it is the
whole reason the local package exists. The local package encrypts on your machine
and sends neither value.

It also serves `vanisec_create_secret` only. `vanisec_generate_secret` is
deliberately absent: its entire purpose is writing the link password to your
system clipboard, and over HTTP that clipboard would be the server's, so the
password would have to travel back in the response and land in the conversation.
The safer of the two tools is stdio only.

So the two forms are not interchangeable. Prefer stdio wherever it can run. Pick
the hosted endpoint only for a client that has no local process at all, such as
Copilot's cloud agent, and pick it knowing you are giving up the property Vanisec
is built on.

The remote form is also newer and less exercised than stdio. The endpoint
negotiates the protocol revision instead of pinning one: ask for `2025-11-25`,
`2025-06-18`, `2025-03-26` or `2024-11-05` and you get that same revision back,
and anything else is answered with `2025-11-25`. It does not speak `2026-07-28`,
the current revision, which replaced the initialize handshake with per-request
metadata and a mandatory `server/discover`. It runs the Streamable HTTP JSON
mode, so a `GET` for an SSE stream is declined with `405`, which that transport
allows. Each remote block below follows the shape its vendor documents. We have
not tested every client against the endpoint.

### One server, four different top-level keys

This is the trap worth reading before you copy anything. Getting the key wrong is
a silent no-op: the client starts, the server never loads, and nothing tells you
why. Each block below leads with its key.

| Client | Config file | Top-level key |
|--------|-------------|---------------|
| Claude Code | written by `claude mcp add` | not edited by hand |
| Claude Desktop | `claude_desktop_config.json` | `mcpServers` |
| Cursor | `.cursor/mcp.json`, `~/.cursor/mcp.json` | `mcpServers` |
| VS Code with Copilot | `.vscode/mcp.json` | `servers` |
| Copilot Agent Host | `.mcp.json`, `~/.copilot/mcp-config.json` | `mcpServers` |
| Copilot CLI | `~/.copilot/mcp-config.json`, `.mcp.json`, `.github/mcp.json` | `mcpServers` |
| Copilot cloud agent, code review | repository settings, not a file | `mcpServers` |
| Copilot JetBrains, Visual Studio, Xcode, Eclipse | not documented, add through the UI | `servers` |
| Codex | `~/.codex/config.toml`, `.codex/config.toml` | `[mcp_servers.vanisec]` |
| Windsurf Cascade | `~/.codeium/windsurf/mcp_config.json` | `mcpServers` |
| Windsurf plugin for VS Code and JetBrains | `~/.codeium/mcp_config.json` | `mcpServers` |
| Devin Local | `~/.config/devin/mcp_config.json`, `.devin/mcp_config.json` | `mcpServers` |
| Zed | `~/.config/zed/settings.json` | `context_servers` |

### Claude Code

```
claude mcp add vanisec -- npx -y @clouddrove/vanisec-mcp
```

Docs: https://docs.claude.com/en/docs/claude-code/mcp

### Claude Desktop

Settings, Developer, Edit Config opens `claude_desktop_config.json`. It lives at
`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS and
`%APPDATA%\Claude\claude_desktop_config.json` on Windows. Key `mcpServers`.

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

Docs: https://modelcontextprotocol.io/docs/develop/connect-local-servers

### Cursor

`.cursor/mcp.json` for one project, `~/.cursor/mcp.json` for every project.
Project config wins over global. Key `mcpServers`. Turn the server on from
Customize in the sidebar.

```json
{
  "mcpServers": {
    "vanisec": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@clouddrove/vanisec-mcp"]
    }
  }
}
```

Cursor's field table marks `type` as required for stdio while none of its
examples include it. Including it is harmless.

Hosted, which is server side encryption and `vanisec_create_secret` only. Leave
`type` out here, because Cursor documents no allowed values for it on a remote
server:

```json
{
  "mcpServers": {
    "vanisec": {
      "url": "https://vanisec.clouddrove.com/api/mcp"
    }
  }
}
```

Docs: https://cursor.com/docs/context/mcp

### VS Code with GitHub Copilot

The key is `servers`. `mcpServers` is not accepted in `.vscode/mcp.json`. If you
are on a Copilot Business or Enterprise seat, read the org policy note under
GitHub Copilot below first, because nothing here works until an admin acts.

`.vscode/mcp.json` covers the workspace. For a user level file, run
`MCP: Open User Configuration` from the command palette; VS Code does not publish
a path for it. `settings.json` is no longer the mechanism, and there is no `mcp`
wrapper key.

```json
{
  "servers": {
    "vanisec": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@clouddrove/vanisec-mcp"]
    }
  }
}
```

Hosted, which is server side encryption and `vanisec_create_secret` only. Use
`type: "http"`; `sse` is legacy:

```json
{
  "servers": {
    "vanisec": {
      "type": "http",
      "url": "https://vanisec.clouddrove.com/api/mcp"
    }
  }
}
```

Same thing from a terminal, where a `name` key appears that does not exist inside
`mcp.json`:

```
code --add-mcp "{\"name\":\"vanisec\",\"command\":\"npx\",\"args\":[\"-y\",\"@clouddrove/vanisec-mcp\"]}"
```

Agent Host does not read `.vscode/mcp.json`. Its portable config is a workspace
`.mcp.json` or `~/.copilot/mcp-config.json`, both keyed `mcpServers`.

Docs: https://code.visualstudio.com/docs/agents/reference/mcp-configuration

### GitHub Copilot, other surfaces

**Start here.** The organization and enterprise policy `MCP servers in Copilot`
is disabled by default for Copilot Business and Enterprise seats. Until an admin
enables it, nothing below works in any Copilot surface, including VS Code, and
the failure does not explain itself. It does not apply to Free, Pro, Pro+ or Max.

Policy docs: https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-organization/manage-policies

#### Cloud agent and code review

Configured in the repository under Settings, Copilot, MCP servers, not in a file.
Key `mcpServers`. Both `tools` and `type` are required per server.

There is no local process here, so it is the hosted endpoint or nothing. That
means server side encryption and `vanisec_create_secret` only, and the cloud
agent is a place where the secrets being handled are rarely trivial. Decide that
tradeoff deliberately rather than by copying the block.

The cloud agent also runs MCP tools without approval prompts, which is the
opposite of every interactive client. So allowlist the specific tools rather than
`"*"`. Our hosted endpoint exposes exactly one tool, and that tool creates a link
from a secret you supply, so naming it costs nothing and keeps the allowlist from
silently widening if we add tools later:

```json
{
  "mcpServers": {
    "vanisec": {
      "type": "http",
      "url": "https://vanisec.clouddrove.com/api/mcp",
      "tools": ["vanisec_create_secret"]
    }
  }
}
```

Three more constraints. Tools only: GitHub states the cloud agent does not
currently support resources or prompts. OAuth remote servers are not supported,
so use a static header if you ever need auth. Secrets must be Agents secrets
named with a `COPILOT_MCP_` prefix, and `$VAR`, `${VAR}` and `${VAR:-default}`
substitution works in every string field except `tools` and `type`.

Docs: https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/extend-coding-agent-with-mcp

#### Copilot CLI

Key `mcpServers`. `~/.copilot/mcp-config.json` for you, `.mcp.json` for a project
locally, `.github/mcp.json` for a project shared with the team. It does not read
`.vscode/mcp.json` and reports an unsupported top-level key `servers` if you
point it there. GitHub's own migration:

```
jq '{mcpServers: .servers}' .vscode/mcp.json > .mcp.json
```

Or add it directly:

```
copilot mcp add vanisec -- npx -y @clouddrove/vanisec-mcp
copilot mcp add --transport http vanisec https://vanisec.clouddrove.com/api/mcp
```

The second command is the hosted endpoint: server side encryption,
`vanisec_create_secret` only. Every MCP tool call here needs explicit permission,
even read-only ones, which is the opposite of the cloud agent.

Docs: https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-mcp-servers

#### JetBrains, Visual Studio, Xcode, Eclipse

All supported, all keyed `servers`. GitHub never publishes a path for these
files, saying only that it varies by IDE, so add the server through the UI rather
than by editing a file. In JetBrains: Copilot icon, Open Chat, Agent mode, tools
icon, Add MCP Tools.

Minimum versions: JetBrains plugin 1.5.53 or newer for remote servers, Visual
Studio 2022 17.14, Xcode 0.41.0, Eclipse plug-in 0.10.0.

```json
{
  "servers": {
    "vanisec": {
      "url": "https://vanisec.clouddrove.com/api/mcp"
    }
  }
}
```

That is the hosted endpoint, so server side encryption and
`vanisec_create_secret` only, with `vanisec_generate_secret` unavailable. Install
the package with stdio instead if the IDE can run a local process.

If you ever need to send a header on the remote path, JetBrains, Xcode and
Eclipse nest it under `requestInit`, not a top level `headers` key:

```json
{
  "servers": {
    "vanisec": {
      "url": "https://vanisec.clouddrove.com/api/mcp",
      "requestInit": {
        "headers": { "Authorization": "Bearer TOKEN" }
      }
    }
  }
}
```

Visual Studio uses a plain `url` with OAuth instead.

Docs: https://docs.github.com/en/copilot/how-tos/context/use-mcp/extend-copilot-chat-with-mcp

#### github.com web chat and Copilot Spaces

Not supported. Both use a preconfigured GitHub MCP server that cannot be changed.
Copilot Extensions, the older GitHub App mechanism, was fully sunset on
2025-11-10 and MCP replaced it.

### Codex

`~/.codex/config.toml` for you, `.codex/config.toml` for a project, and the
project file is read only when the project is trusted. The table name is
`[mcp_servers.vanisec]`, snake_case, not `mcpServers`. The IDE extension reads the
same file.

Set `startup_timeout_sec = 30`. The default is 10 seconds and an `npx -y` cold
start routinely exceeds it. The symptom is the server failing to start with no
useful explanation, and this is the single most common way this install goes
wrong.

```toml
[mcp_servers.vanisec]
command = "npx"
args = ["-y", "@clouddrove/vanisec-mcp"]
startup_timeout_sec = 30
```

Hosted, which is server side encryption and `vanisec_create_secret` only:

```toml
[mcp_servers.vanisec]
url = "https://vanisec.clouddrove.com/api/mcp"
startup_timeout_sec = 30
```

Or from a terminal:

```
codex mcp add vanisec -- npx -y @clouddrove/vanisec-mcp
codex mcp add vanisec-remote --url https://vanisec.clouddrove.com/api/mcp
```

Two keys from older guides are gone. Inline `bearer_token` is replaced by
`bearer_token_env_var`, and `experimental_use_rmcp_client` is unnecessary now that
streamable HTTP is first-class.

Docs: https://learn.chatgpt.com/docs/codex/cli

### Windsurf and Devin

The Devin rebrand split the config in two, so which file you need depends on
which surface you are running. All four use `mcpServers`.

| Surface | File |
|---------|------|
| Legacy Cascade | `~/.codeium/windsurf/mcp_config.json` |
| Windsurf plugin for VS Code and JetBrains | `~/.codeium/mcp_config.json` |
| Devin Local, user | `~/.config/devin/mcp_config.json` |
| Devin Local, project | `.devin/mcp_config.json` |

stdio is the same in all of them:

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

The remote form differs, and both are the hosted endpoint: server side
encryption, `vanisec_create_secret` only. Cascade uses `serverUrl` and takes no
transport key:

```json
{
  "mcpServers": {
    "vanisec": {
      "serverUrl": "https://vanisec.clouddrove.com/api/mcp"
    }
  }
}
```

Devin Local uses `url` with an optional `transport`, which defaults to `http`:

```json
{
  "mcpServers": {
    "vanisec": {
      "url": "https://vanisec.clouddrove.com/api/mcp",
      "transport": "http"
    }
  }
}
```

Cascade caps out at 100 tools across all servers.

Docs: https://docs.devin.ai/work-with-devin/mcp

### Zed

`~/.config/zed/settings.json`, key `context_servers`. Add it from Settings, AI,
MCP Servers, Add Server. The old `"source": "custom"` discriminator is gone. A
project level `.zed/settings.json` for context servers is not documented, so use
the user file.

```json
{
  "context_servers": {
    "vanisec": {
      "command": "npx",
      "args": ["-y", "@clouddrove/vanisec-mcp"],
      "env": {}
    }
  }
}
```

Hosted, which is server side encryption and `vanisec_create_secret` only. Zed
accepts only `url` and `headers` on a remote server:

```json
{
  "context_servers": {
    "vanisec": {
      "url": "https://vanisec.clouddrove.com/api/mcp"
    }
  }
}
```

Tool permissions are keyed `mcp:vanisec:<tool_name>`.

Docs: https://zed.dev/docs/ai/mcp

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
run and encryption happens server side.

### Which clients can reach these prompts

Mostly none of them. Several vendors declare prompt support in a capability table
and then document no way for a user to invoke one. Rows below come from each
vendor's own docs, checked 2026-08-20, and cover the clients in the install
matrix above.

| Client | Prompts | How you reach them |
|--------|---------|--------------------|
| VS Code with Copilot | yes | `/mcp.vanisec.share-credential`, `/mcp.vanisec.rotate-and-share` |
| Cursor | declared supported | no documented surface |
| Windsurf, Devin | declared supported | no documented surface |
| Zed | declared supported | no documented surface |
| Copilot cloud agent, code review | no | GitHub documents tools only, explicitly not prompts |
| Copilot JetBrains, Visual Studio, Xcode, Eclipse, CLI | not documented | |
| Codex | not documented | reads the server `instructions` field instead |

VS Code is the only client with a documented, user-reachable prompt surface.
Declared supported means the vendor lists prompts as a supported MCP feature but
publishes no invocation surface, so treat those three as unreachable until they
document one.

That is why the two tool descriptions repeat the guidance the prompts give:
it is the only channel every client reads. Tracking issue
[#112](https://github.com/clouddrove/vanisec/issues/112).

The same guidance is also packaged as Claude Agent Skills under `skills/` in the
repository, for clients that load skills rather than MCP prompts. Cursor and
Codex read that format too. For clients that read something else, `integrations/`
carries the same rules as Cursor rules, GitHub Copilot instructions and prompt
files, and `AGENTS.md`. All of it is rendered at
[vanisec.clouddrove.com/integrations](https://vanisec.clouddrove.com/integrations).

Since #112 the server also returns these rules in the MCP `instructions` field
at initialization, which reaches clients that ignore prompts entirely.

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
