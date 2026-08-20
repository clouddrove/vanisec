# Agent skill

**Destination: `.agents/skills/vanisec-share-secret/SKILL.md`.**

`SKILL.md` here is a **symlink** to `skills/vanisec-share-secret/SKILL.md` in
this repository. There is no copy to keep in step, so this file cannot drift.
Copy it with something that follows symlinks, such as `cp -RL`. If you are
fetching raw files from GitHub rather than cloning, fetch
`skills/vanisec-share-secret/SKILL.md` directly instead; a raw fetch of a
symlink returns the path, not the contents.

## The format is a shared standard

This is the open agent skills standard from agentskills.io: a directory named
after the skill, holding a `SKILL.md` with `name` and `description` in the
frontmatter. Claude Code, Codex and Cursor all load it. Unlike the always-on
instruction files, a skill loads only when it is needed, which is why it can
carry the full detail.

## Where each client looks

**Codex** searches, in order: `$CWD/.agents/skills`, `$CWD/../.agents/skills`,
`$REPO_ROOT/.agents/skills`, `$HOME/.agents/skills`, `/etc/codex/skills`. Invoke
with `$vanisec-share-secret` or browse with `/skills`. Codex will also pull a
skill in on its own when the description matches. The initial listing of all
skills is capped at 2 percent of the context or 8000 characters, so keep
descriptions tight.

Codex custom prompts in `~/.codex/prompts/` are deprecated in favour of skills,
so this file is the Codex answer to a slash command, not the prompt file in
`../copilot/`.

**Cursor** reads `.cursor/skills/` and `.agents/skills/` in the project,
`~/.cursor/skills/` and `~/.agents/skills/` for the user, and additionally
`.claude/skills/` and `.codex/skills/` for compatibility. `.agents/skills/` is
the one path Codex and Cursor share, so put it there.

**Claude Code** reads `.claude/skills/`. Cursor reads that path too, so a team
on Claude Code and Cursor only can drop it there instead.

Cursor's skill frontmatter requires both `name` and `description`, and also
accepts `paths`, `disable-model-invocation`, `icon`, `color` and `metadata`.
`paths` takes a list. Do not confuse it with the `globs` field in Cursor
*rules*, which is a comma separated string. Different mechanisms, different
schemas.

## Auto wiring the MCP server on Codex, and why we do not

A skill directory can carry an optional `agents/openai.yaml` declaring an MCP
dependency, which makes Codex wire the server up when the skill is installed:

```yaml
dependencies:
  tools:
    - type: "mcp"
      value: "vanisec"
      transport: "streamable_http"
      url: "https://vanisec.clouddrove.com/api/mcp"
```

We deliberately do not ship that file, because the only transport it can declare
here points at the hosted endpoint, and the hosted endpoint is the weaker of the
two paths:

- It is **not zero-knowledge**. The secret and the password arrive in the
  request body in plaintext and are encrypted on the server, so for the duration
  of the request the server holds material it otherwise never sees.
- It offers `vanisec_create_secret` only. `vanisec_generate_secret` is
  deliberately absent, because its whole purpose is writing the link password to
  *your* clipboard, and over HTTP that clipboard would be the server's.

The skill's central rule is to prefer `vanisec_generate_secret`. Auto wiring a
server that cannot offer it would contradict the guidance it ships with, so we
would rather you install the local package:

```
npx -y @clouddrove/vanisec-mcp
```

It encrypts on your own machine and has both tools. Add the `openai.yaml` above
yourself if you accept the tradeoff, for example on a machine that cannot run a
local process at all.
