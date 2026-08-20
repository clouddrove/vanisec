# Cursor rule

**Destination: `.cursor/rules/vanisec.mdc`.**

## The `.mdc` extension is mandatory

A plain `.md` file in `.cursor/rules/` is ignored by the rules system, silently,
because it has no frontmatter. Do not rename this file. If you would rather work
in plain Markdown, use `AGENTS.md` instead, which Cursor also reads.

Subfolders inside `.cursor/rules/` work. A `.cursor/rules` directory inside a
project subdirectory is not documented, so keep this one at the top.

## Frontmatter is exactly three fields

`alwaysApply`, `description`, `globs`. There is no `name`, no `priority`, no
`type`, no `paths` and no `attachmentType`. Adding any of those does nothing.

`globs` is a **comma separated unquoted string**, not a YAML list:

```
globs: app/**/*.ts, lib/**/*.ts
```

A YAML list there will not match anything. Note that Cursor *skills* use a
`paths` field which does take a list. The two schemas are different; do not
carry one across to the other.

## Why this rule is Always Apply

The four rule types come from the combination of fields:

| Frontmatter | Behaviour |
|-------------|-----------|
| `alwaysApply: true` | always included; `globs` and `description` are ignored |
| `alwaysApply: false` plus `globs` | attached when a matching file is in context |
| `alwaysApply: false` plus `description`, no `globs` | the agent pulls it in when the description looks relevant |
| `alwaysApply: false`, neither | only on `@vanisec` |

We ship `alwaysApply: true`. Handling a credential is not tied to any file, so
globs are the wrong shape, and the moment the rule matters most is the moment
the model has not recognised that a credential is in play, which is exactly what
"Apply Intelligently" depends on. The rule is short enough that carrying it on
every request is cheap.

`description` is kept even though Always Apply ignores it, because it is what
names the rule for humans. `globs` is omitted rather than set to a value that
would be ignored.

If you would rather have it load on demand, set `alwaysApply: false` and keep
the description. The rule then loads when the agent judges it relevant, and you
can always pull it in yourself with `@vanisec`.

## Scope limit

Rules apply to Agent (Chat) only. They do not apply to Tab completion, Inline
Edit, or Bugbot PR reviews.

## Do not ship `.cursorrules`

It is legacy and has been removed from Cursor's reference. Worse, it sits above
`.github/copilot-instructions.md` and `AGENTS.md` in Zed's first match list, so
leaving one in the repo means Zed reads it and ignores everything else. Migrate
it here and delete it.
