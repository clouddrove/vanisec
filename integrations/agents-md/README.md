# AGENTS.md

**Destination: `AGENTS.md`, at the root of your repository.**

The widest reach of anything here. Codex, Cursor, VS Code Copilot, the Copilot
cloud agent, Copilot code review, Copilot CLI, Windsurf and Devin, and Zed all
read it.

Plain Markdown. **No frontmatter**, in any tool. Nothing accepts it in this
file, so do not add any.

## If you already have one

Append the `# Sharing credentials` section to your existing file rather than
replacing it. Everything in ours is one section for that reason.

## Things worth knowing

- **Nesting.** Most clients read the nearest file up the directory tree, and the
  closest one wins. Codex concatenates from the repo root down to the working
  directory. VS Code reads the root file only unless you turn on
  `chat.useNestedAgentsMdFiles`, which is off by default.
- **Codex caps the file.** `project_doc_max_bytes` defaults to 32 KiB across all
  the AGENTS.md files it loads. Ours is well under a kilobyte, but a large
  existing file plus ours could hit it.
- **Codex checks `AGENTS.override.md` first** at every level, if you use one.
- **Zed reads this file only if nothing higher on its list exists.** See the Zed
  section in `../README.md`. If you also ship
  `.github/copilot-instructions.md`, Zed reads that one and skips this file
  entirely, which is why the two are byte identical here.
- **Not read at all** by Copilot in JetBrains, Visual Studio, Xcode, Eclipse, or
  github.com web chat. Those surfaces need
  `.github/copilot-instructions.md`.
