# Integrations

Instruction files that teach an AI coding client how to hand credentials to
people with Vanisec, instead of pasting them into a chat window.

**These files are for your repository, not this one.** Nothing here is active
where it sits. Every file is parked under `integrations/<client>/` so it cannot
be picked up by accident, and every one is already named as its real target
filename, so you copy it into place without renaming.

Pick the files for the clients your team actually uses. You do not need all of
them, and shipping all of them costs context on every request.

## What to copy where

| Copy this | To here | Read by |
|-----------|---------|---------|
| `agents-md/AGENTS.md` | `AGENTS.md` (repo root) | Codex, Cursor, VS Code Copilot, Copilot cloud agent, Copilot code review, Copilot CLI, Windsurf and Devin, Zed |
| `cursor/vanisec.mdc` | `.cursor/rules/vanisec.mdc` | Cursor Agent |
| `copilot/copilot-instructions.md` | `.github/copilot-instructions.md` | every Copilot surface, including github.com web chat |
| `copilot/vanisec.instructions.md` | `.github/instructions/vanisec.instructions.md` | VS Code, Visual Studio, JetBrains, Xcode, Copilot cloud agent, Copilot code review, Copilot CLI |
| `copilot/share-credential.prompt.md` | `.github/prompts/share-credential.prompt.md` | VS Code, Visual Studio, JetBrains only |
| `agent-skills/vanisec-share-secret/SKILL.md` | `.agents/skills/vanisec-share-secret/SKILL.md` | Codex, Cursor. Also `.claude/skills/` for Claude Code and Cursor |

Each subdirectory has its own README with the details for that client, including
the frontmatter fields and what they mean.

`AGENTS.md` and `.github/copilot-instructions.md` here are byte identical on
purpose. Read the Zed section below before you change one of them.

## The Zed trap: only one file wins

Zed does not merge instruction files. It reads the **first match** from this
ordered list and ignores everything after it:

```
.rules
.cursorrules
.windsurfrules
.clinerules
.github/copilot-instructions.md
AGENT.md
AGENTS.md
CLAUDE.md
GEMINI.md
```

Two consequences.

**A repo with both `.github/copilot-instructions.md` and `AGENTS.md` gives Zed
only the Copilot file.** That is why the two files we ship carry the same rules.
If you edit one, edit the other, or Zed users quietly get whichever you neglected.

**A stray legacy `.cursorrules` beats both of them.** It sits higher in the list,
so Zed reads it and nothing else, including nothing we ship. Cursor's own
documentation now calls `.cursorrules` legacy. If your repo still has one,
migrate its contents to `.cursor/rules/*.mdc` and delete it. The same applies to
`.rules`, `.windsurfrules` and `.clinerules` if you have them.

## Merging with what you already have

If your repo already has an `AGENTS.md` or a `.github/copilot-instructions.md`,
append the section from our file rather than overwriting yours. Both files are a
single `# Sharing credentials` section for exactly this reason.

## These files are checked in, not generated

They are written by hand and reviewed like any other file. There is no generator
and no CI job that rebuilds them, so nothing here runs on your repo or on ours.

The tradeoff is that they can drift from `skills/` in this repository, which is
the canonical wording. When a rule in `skills/vanisec-share-secret/SKILL.md` or
`skills/vanisec-rotate-credential/SKILL.md` changes, update:

- `agents-md/AGENTS.md` **and** `copilot/copilot-instructions.md`, keeping them
  byte identical
- `cursor/vanisec.mdc`
- `copilot/vanisec.instructions.md` if a tool parameter or a limit changed
- `copilot/share-credential.prompt.md` if the ordering of the steps changed

`agent-skills/vanisec-share-secret/SKILL.md` is a symlink to
`skills/vanisec-share-secret/SKILL.md` and never needs updating.

## Installing the tools

The instruction files assume the Vanisec MCP server is connected. Install it as
`npx -y @clouddrove/vanisec-mcp` (Node 22 or newer). The top level `README.md`
and `mcp/README.md` in this repository cover the configuration for each client,
because the config key differs: `mcpServers` for Cursor and Copilot CLI,
`servers` for VS Code, `context_servers` for Zed, `[mcp_servers.<name>]` for
Codex.
