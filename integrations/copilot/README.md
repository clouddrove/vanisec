# GitHub Copilot

Three files, three different jobs and three different sets of surfaces.

| Copy this | To here |
|-----------|---------|
| `copilot-instructions.md` | `.github/copilot-instructions.md` |
| `vanisec.instructions.md` | `.github/instructions/vanisec.instructions.md` |
| `share-credential.prompt.md` | `.github/prompts/share-credential.prompt.md` |

## Before anything works

For Copilot Business and Copilot Enterprise seats, the organisation or
enterprise policy **MCP servers in Copilot** is **disabled by default**. Until
an administrator enables it, the Vanisec tools do not exist and these
instructions describe tools nobody can call. The policy does not apply to Free,
Pro, Pro+ or Max seats.

## Which surface reads what

|  | `copilot-instructions.md` | `*.instructions.md` | `*.prompt.md` |
|--|--|--|--|
| github.com web chat | yes | no | no |
| Copilot cloud agent | yes | yes | no |
| Copilot code review | yes | yes | no |
| VS Code chat | yes | yes | yes |
| Visual Studio | yes | yes | yes |
| JetBrains | yes | yes | yes (preview) |
| Eclipse | yes | no | no |
| Xcode | yes | yes | no |
| Copilot CLI | yes | yes | no |

## `.github/copilot-instructions.md`

The only file every Copilot surface reads, github.com web chat included. Auto
detected at the workspace root, applied to every chat request, no frontmatter.
Governed by `github.copilot.chat.codeGeneration.useInstructionFiles`, which
defaults to true.

It is byte identical to `../agents-md/AGENTS.md` on purpose, because Zed reads
this file and skips `AGENTS.md`. Keep them in step. See `../README.md`.

If you already have one, append our section rather than replacing yours.

## `.github/instructions/vanisec.instructions.md`

Searched recursively, so subdirectories work. All four frontmatter fields are
optional:

| Field | Meaning |
|-------|---------|
| `name` | display name, defaults to the file name |
| `description` | shown on hover |
| `applyTo` | glob or globs, comma separated string, relative to the workspace root. `**` means all files |
| `excludeAgent` | `code-review` or `cloud-agent` |

**Omitting `applyTo` means the file is never applied automatically.** It is
optional in the sense that the file still parses, not in the sense that it still
works. We set `applyTo: '**'` because handling a credential is not tied to any
particular file. The quotes matter: bare `**` starts a YAML alias.

We leave `excludeAgent` unset. If you care about context budget on pull
requests, note that this file and `copilot-instructions.md` both reach the cloud
agent and code review, so `excludeAgent: code-review` trims one of them there.

Other locations Copilot searches for instruction files: `.claude/rules` in the
workspace, and `~/.copilot/instructions` or `~/.claude/rules` in your user
profile.

The old `github.copilot.chat.codeGeneration.instructions` setting is deprecated
as of VS Code 1.102. Do not use it.

## `.github/prompts/share-credential.prompt.md`

Invoked as `/share-credential` in chat. **Prompt files exist only in VS Code,
Visual Studio and JetBrains.** They do nothing in the cloud agent, in code
review, in Copilot CLI, in Eclipse, in Xcode or on github.com. Skip this file if
your team is not on one of those three.

The frontmatter key is `agent`. **`mode` no longer exists.** Any guide still
showing `mode: agent` predates the rename.

| Field | Meaning |
|-------|---------|
| `description` | optional |
| `name` | the `/` name, defaults to the file name |
| `argument-hint` | hint shown in the chat input |
| `agent` | `ask`, `agent`, `plan`, or a custom agent name. Defaults to `agent` when `tools` is set |
| `model` | defaults to the model picker |
| `tools` | tool or tool set names. `<server name>/*` includes a whole MCP server |

We set `agent: agent` and leave `tools` unset, because setting `tools` restricts
the run to that list. If you want to pin it to Vanisec only, add
`tools: vanisec/*`, using whatever name you gave the server in your MCP config.

`chat.promptFiles` is no longer documented. Prompt files are always on.
