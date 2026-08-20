import fs from 'node:fs'
import path from 'node:path'
import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'

// Everything on this page is read from the repository at build time: the skills
// in skills/, the instruction files in integrations/, and the plugin manifests
// in .claude-plugin/. Nothing is copied into this file, so editing a SKILL.md
// or an integrations README updates the page on the next build.
export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Integrations',
  description:
    'The same rules for handling secrets, in the format each AI client reads: Claude Code skills, Cursor rules, Copilot instructions and prompt files, AGENTS.md, and the agent skills standard.',
  alternates: { canonical: '/integrations' },
}

const CARD = 'bg-white rounded-2xl p-8 border-2 border-clouddrove-light/30'
const PRE = 'bg-clouddrove-light/10 rounded-lg p-4 overflow-x-auto text-xs md:text-sm'
const H2 = 'text-2xl md:text-3xl font-bold text-clouddrove-dark mb-4'
const H3 = 'text-lg font-semibold text-clouddrove-dark mb-2'
const SUMMARY =
  'cursor-pointer text-sm font-semibold text-clouddrove-dark hover:text-clouddrove-light transition-colors'
const LINK = 'text-clouddrove-dark underline underline-offset-2 hover:text-clouddrove-light transition-colors'

const REPO_ROOT = process.cwd()
const GITHUB_BLOB = 'https://github.com/clouddrove/vanisec/blob/master'

// Reading

// A missing or empty source file has to stop the build. Rendering an empty page
// would ship a broken install guide that nobody notices.
function readRepoFile(relativePath: string): string {
  if (relativePath.split('/').indexOf('..') !== -1) {
    throw new Error(`/integrations: refusing to read "${relativePath}", which escapes the repository`)
  }
  // turbopackIgnore keeps this read out of the output file trace. The page is
  // prerendered, so nothing here runs at request time and the standalone build
  // does not need the repository on disk.
  const absolute = path.join(/* turbopackIgnore: true */ REPO_ROOT, relativePath)
  let raw: string
  try {
    // readFileSync resolves symlinks, which is how
    // integrations/agent-skills/vanisec-share-secret/SKILL.md is read.
    raw = fs.readFileSync(absolute, 'utf8')
  } catch (cause) {
    throw new Error(`/integrations: cannot read ${relativePath} (looked in ${absolute})`, { cause })
  }
  if (!raw.trim()) {
    throw new Error(`/integrations: ${relativePath} is empty`)
  }
  return raw
}

// Frontmatter

type Frontmatter = { [key: string]: string }

// Deliberately small. The frontmatter in this repository is flat string keys
// with occasional folded values, so a full YAML parser would be a dependency
// bought for nothing. Anything it cannot handle throws.
function splitFrontmatter(raw: string, source: string): { data: Frontmatter; body: string } {
  const normalised = raw.replace(/\r\n/g, '\n')
  const lines = normalised.split('\n')
  if (lines[0].trim() !== '---') {
    throw new Error(`/integrations: ${source} does not start with a --- frontmatter block`)
  }
  let end = -1
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      end = i
      break
    }
  }
  if (end === -1) {
    throw new Error(`/integrations: ${source} has an unterminated frontmatter block`)
  }

  const data: Frontmatter = {}
  let currentKey = ''
  for (let i = 1; i < end; i++) {
    const line = lines[i]
    if (!line.trim()) continue
    const match = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line)
    if (match) {
      currentKey = match[1]
      data[currentKey] = unquote(match[2].trim())
      continue
    }
    if (/^\s+/.test(line) && currentKey) {
      // Folded continuation of the previous value.
      data[currentKey] = `${data[currentKey]} ${line.trim()}`.trim()
      continue
    }
    throw new Error(`/integrations: cannot parse frontmatter line ${i + 1} of ${source}: ${line}`)
  }

  return { data, body: lines.slice(end + 1).join('\n').trim() }
}

function unquote(value: string): string {
  if (value.length >= 2 && ((value[0] === '"' && value.slice(-1) === '"') || (value[0] === "'" && value.slice(-1) === "'"))) {
    return value.slice(1, -1)
  }
  return value
}

function requireField(data: Frontmatter, key: string, source: string): string {
  const value = data[key]
  if (!value) {
    throw new Error(`/integrations: ${source} has no "${key}" in its frontmatter`)
  }
  return value
}

// Markdown

const MD_P = 'text-clouddrove-light leading-relaxed mb-4'
const MD_UL = 'list-disc list-outside pl-5 space-y-2 text-clouddrove-light mb-4'
const MD_OL = 'list-decimal list-outside pl-5 space-y-2 text-clouddrove-light mb-4'
const MD_CODE = 'font-mono text-[0.9em] text-clouddrove-dark'
const MD_HEADING = [
  'text-xl font-bold text-clouddrove-dark mt-6 mb-3',
  'text-lg font-semibold text-clouddrove-dark mt-6 mb-2',
  'text-base font-semibold text-clouddrove-dark mt-5 mb-2',
  'text-sm font-semibold text-clouddrove-dark mt-4 mb-2',
]

const INLINE_PATTERN = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*\s][^*]*\*)|(https?:\/\/[^\s`<>]*[^\s`<>.,;:!?)])/g

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = []
  const pattern = new RegExp(INLINE_PATTERN.source, 'g')
  let last = 0
  let index = 0
  let match: RegExpExecArray | null = pattern.exec(text)
  while (match !== null) {
    if (match.index > last) out.push(text.slice(last, match.index))
    const token = match[0]
    const key = `${keyPrefix}-inline-${index++}`
    if (match[1]) {
      out.push(
        <code key={key} className={MD_CODE}>
          {token.slice(1, -1)}
        </code>
      )
    } else if (match[2]) {
      // Bold and italic can wrap code spans, so their contents go round again.
      out.push(
        <strong key={key} className="font-semibold text-clouddrove-dark">
          {renderInline(token.slice(2, -2), key)}
        </strong>
      )
    } else if (match[3]) {
      out.push(<em key={key}>{renderInline(token.slice(1, -1), key)}</em>)
    } else {
      out.push(
        <a key={key} href={token} className={LINK} target="_blank" rel="noopener noreferrer">
          {token}
        </a>
      )
    }
    last = match.index + token.length
    match = pattern.exec(text)
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

function isHeading(line: string): boolean {
  return /^#{1,6}\s+/.test(line)
}

function isFence(line: string): boolean {
  return /^\s*```/.test(line)
}

function isListItem(line: string): boolean {
  return /^\s*([-*]|\d+\.)\s+/.test(line)
}

function isTableSeparator(line: string): boolean {
  return /^\s*\|[\s:|-]+\|\s*$/.test(line)
}

function startsBlock(line: string): boolean {
  return !line.trim() || isHeading(line) || isFence(line) || isListItem(line) || line.trim().indexOf('|') === 0
}

// A deliberately small subset: headings, paragraphs, fenced code, pipe tables,
// and lists. That is everything the files in skills/ and integrations/ use. A
// Markdown stack would be a large dependency for four block types.
function renderMarkdown(markdown: string, keyPrefix: string, headingOffset = 0): ReactNode[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const out: ReactNode[] = []
  let i = 0
  let block = 0

  while (i < lines.length) {
    const line = lines[i]
    const key = `${keyPrefix}-b${block++}`

    if (!line.trim()) {
      i++
      continue
    }

    if (isFence(line)) {
      const start = i + 1
      let end = start
      while (end < lines.length && !isFence(lines[end])) end++
      out.push(
        <pre key={key} className={`${PRE} mb-4`}>
          <code>{lines.slice(start, end).join('\n')}</code>
        </pre>
      )
      i = end + 1
      continue
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(line)
    if (heading) {
      const level = Math.min(heading[1].length + headingOffset, 6)
      const className = MD_HEADING[Math.min(MD_HEADING.length - 1, Math.max(0, level - 3))]
      const content = renderInline(heading[2].trim(), key)
      if (level <= 3) out.push(<h3 key={key} className={className}>{content}</h3>)
      else if (level === 4) out.push(<h4 key={key} className={className}>{content}</h4>)
      else if (level === 5) out.push(<h5 key={key} className={className}>{content}</h5>)
      else out.push(<h6 key={key} className={className}>{content}</h6>)
      i++
      continue
    }

    if (line.trim().indexOf('|') === 0 && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const header = splitRow(line)
      let end = i + 2
      const rows: string[][] = []
      while (end < lines.length && lines[end].trim().indexOf('|') === 0) {
        rows.push(splitRow(lines[end]))
        end++
      }
      out.push(
        <div key={key} className="overflow-x-auto mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-clouddrove-light/30 text-left">
                {header.map((cell, c) => (
                  <th key={`${key}-h${c}`} className="py-2 pr-4 font-semibold text-clouddrove-dark align-top">
                    {renderInline(cell, `${key}-h${c}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-clouddrove-light">
              {rows.map((row, r) => (
                <tr key={`${key}-r${r}`} className="border-b border-clouddrove-light/20 align-top">
                  {row.map((cell, c) => (
                    <td key={`${key}-r${r}c${c}`} className="py-2 pr-4">
                      {renderInline(cell, `${key}-r${r}c${c}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
      i = end
      continue
    }

    if (isListItem(line)) {
      const ordered = /^\s*\d+\.\s+/.test(line)
      const items: string[] = []
      while (i < lines.length) {
        const current = lines[i]
        if (isListItem(current)) {
          items.push(current.replace(/^\s*([-*]|\d+\.)\s+/, ''))
          i++
          continue
        }
        // An indented, non-blank line continues the item above it.
        if (current.trim() && /^\s/.test(current) && items.length > 0) {
          items[items.length - 1] = `${items[items.length - 1]} ${current.trim()}`
          i++
          continue
        }
        // A blank line inside a loose list is only a break if no item follows.
        if (!current.trim() && i + 1 < lines.length && isListItem(lines[i + 1])) {
          i++
          continue
        }
        break
      }
      const children = items.map((item, index) => (
        <li key={`${key}-li${index}`}>{renderInline(item, `${key}-li${index}`)}</li>
      ))
      out.push(
        ordered ? (
          <ol key={key} className={MD_OL}>
            {children}
          </ol>
        ) : (
          <ul key={key} className={MD_UL}>
            {children}
          </ul>
        )
      )
      continue
    }

    const paragraph: string[] = []
    while (i < lines.length && !startsBlock(lines[i])) {
      paragraph.push(lines[i].trim())
      i++
    }
    out.push(
      <p key={key} className={MD_P}>
        {renderInline(paragraph.join(' '), key)}
      </p>
    )
  }

  return out
}

function splitRow(line: string): string[] {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim())
}

// Pulls one section out of a Markdown file by its exact heading line, so the
// warnings below stay the wording in integrations/ rather than a paraphrase.
function markdownSection(markdown: string, heading: string, source: string): string {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const level = (/^#+/.exec(heading) || [''])[0].length
  if (!level) {
    throw new Error(`/integrations: "${heading}" is not a Markdown heading`)
  }
  let start = -1
  let fenced = false
  for (let i = 0; i < lines.length; i++) {
    if (isFence(lines[i])) fenced = !fenced
    if (!fenced && lines[i].trim() === heading) {
      start = i
      break
    }
  }
  if (start === -1) {
    throw new Error(`/integrations: heading "${heading}" is missing from ${source}`)
  }
  let end = lines.length
  fenced = false
  for (let i = start + 1; i < lines.length; i++) {
    if (isFence(lines[i])) fenced = !fenced
    if (fenced) continue
    const next = /^(#{1,6})\s+/.exec(lines[i])
    if (next && next[1].length <= level) {
      end = i
      break
    }
  }
  const body = lines.slice(start + 1, end).join('\n').trim()
  if (!body) {
    throw new Error(`/integrations: section "${heading}" in ${source} is empty`)
  }
  return body
}

// Content, read at build time

type Skill = { dir: string; name: string; description: string; body: string; source: string }

function loadSkills(): Skill[] {
  const skillsDir = path.join(/* turbopackIgnore: true */ REPO_ROOT, 'skills')
  let entries: fs.Dirent[]
  try {
    entries = fs.readdirSync(skillsDir, { withFileTypes: true })
  } catch (cause) {
    throw new Error(`/integrations: cannot read the skills directory at ${skillsDir}`, { cause })
  }
  const dirs = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
  if (!dirs.length) {
    throw new Error('/integrations: skills/ holds no skill directories')
  }
  return dirs.map((dir) => {
    const source = `skills/${dir}/SKILL.md`
    const { data, body } = splitFrontmatter(readRepoFile(source), source)
    if (!body) throw new Error(`/integrations: ${source} has no body below its frontmatter`)
    return {
      dir,
      name: requireField(data, 'name', source),
      description: requireField(data, 'description', source),
      body,
      source,
    }
  })
}

type CopyRow = { source: string; sourceCell: string; destinationCell: string; readByCell: string; content: string }

// The mapping table is the one in integrations/README.md, parsed rather than
// retyped, so the page cannot drift from the file it documents.
function loadCopyRows(readme: string): CopyRow[] {
  const section = markdownSection(readme, '## What to copy where', 'integrations/README.md')
  const lines = section.split('\n')
  const rows: CopyRow[] = []
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().indexOf('|') !== 0) continue
    if (isTableSeparator(lines[i])) continue
    const cells = splitRow(lines[i])
    if (cells.length < 3) continue
    if (cells[0].toLowerCase().indexOf('copy this') === 0) continue
    const relative = cells[0].replace(/`/g, '').trim()
    rows.push({
      source: `integrations/${relative}`,
      sourceCell: cells[0],
      destinationCell: cells[1],
      readByCell: cells[2],
      content: readRepoFile(`integrations/${relative}`).replace(/\s+$/, ''),
    })
  }
  if (!rows.length) {
    throw new Error('/integrations: no rows parsed from the "What to copy where" table in integrations/README.md')
  }
  return rows
}

type Warning = { title: string; body: string; source: string }

function loadWarnings(): Warning[] {
  const definitions: { title: string; file: string; heading: string }[] = [
    {
      title: 'Zed reads one file and stops',
      file: 'integrations/README.md',
      heading: '## The Zed trap: only one file wins',
    },
    {
      title: 'Copilot prompt files run in three editors, and the key is agent:',
      file: 'integrations/copilot/README.md',
      heading: '## `.github/prompts/share-credential.prompt.md`',
    },
    {
      title: 'Cursor rules take globs, Cursor skills take paths',
      file: 'integrations/cursor/README.md',
      heading: '## Frontmatter is exactly three fields',
    },
  ]
  return definitions.map((definition) => ({
    title: definition.title,
    source: definition.file,
    body: markdownSection(readRepoFile(definition.file), definition.heading, definition.file),
  }))
}

function loadPluginInstall(): { marketplace: string; install: string } {
  const pluginSource = '.claude-plugin/plugin.json'
  const marketplaceSource = '.claude-plugin/marketplace.json'
  let plugin: { name?: string; repository?: string }
  let marketplace: { name?: string }
  try {
    plugin = JSON.parse(readRepoFile(pluginSource))
    marketplace = JSON.parse(readRepoFile(marketplaceSource))
  } catch (cause) {
    throw new Error(`/integrations: cannot parse ${pluginSource} or ${marketplaceSource}`, { cause })
  }
  if (!plugin.name || !plugin.repository || !marketplace.name) {
    throw new Error(`/integrations: ${pluginSource} needs "name" and "repository", ${marketplaceSource} needs "name"`)
  }
  const slug = plugin.repository.replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '').replace(/\/$/, '')
  return {
    marketplace: `/plugin marketplace add ${slug}`,
    install: `/plugin install ${plugin.name}@${marketplace.name}`,
  }
}

const SKILLS = loadSkills()
const INTEGRATIONS_README = readRepoFile('integrations/README.md')
const COPY_ROWS = loadCopyRows(INTEGRATIONS_README)
const WARNINGS = loadWarnings()
const PLUGIN_INSTALL = loadPluginInstall()

// Page

function FileCard({ row }: { row: CopyRow }) {
  return (
    <div className="border-2 border-clouddrove-light/30 rounded-xl p-5">
      <h3 className={H3}>{renderInline(row.destinationCell, `dest-${row.source}`)}</h3>
      <p className="text-clouddrove-light text-sm mb-2">
        Read by {renderInline(row.readByCell, `readby-${row.source}`)}.
      </p>
      <p className="text-clouddrove-light text-sm mb-4">
        Source: {renderInline(row.sourceCell, `src-${row.source}`)} in the repository.{' '}
        <a href={`${GITHUB_BLOB}/${row.source}`} className={LINK} target="_blank" rel="noopener noreferrer">
          View on GitHub
        </a>
      </p>
      <details>
        <summary className={SUMMARY}>Show the file</summary>
        <pre className={`${PRE} mt-3`}>
          <code>{row.content}</code>
        </pre>
      </details>
    </div>
  )
}

export default function IntegrationsPage() {
  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-clouddrove-dark mb-4">Integrations</h1>
          <p className="text-lg md:text-xl text-clouddrove-light max-w-2xl mx-auto">
            The same rules for handling secrets, in the format each AI client reads
          </p>
        </div>

        <div className="space-y-12">
          <section>
            <h2 className={H2}>What this is</h2>
            <div className={CARD}>
              <p className="text-clouddrove-light mb-4">
                One set of rules for handing a credential to a person: never write it into chat, a commit or a log,
                create a one-time link instead, and send the link and its password through different channels. Every
                AI client reads that guidance from a different file, under a different name, so this page ships the
                same rules in each format. Claude calls them skills, Cursor calls them rules, Copilot calls them
                instructions, and Codex reads <code className="font-mono text-sm">AGENTS.md</code>.
              </p>
              <p className="text-clouddrove-light">
                The files described here go in <strong className="text-clouddrove-dark">your</strong> repository, not
                in Vanisec&apos;s. They assume the Vanisec MCP server is connected, which the{' '}
                <Link href="/mcp" className={LINK}>
                  MCP page
                </Link>{' '}
                covers per client. Every file below is read straight out of{' '}
                <a href={GITHUB_BLOB.replace('/blob/master', '')} className={LINK} target="_blank" rel="noopener noreferrer">
                  the repository
                </a>{' '}
                when this page is built, so what you see is what is checked in.
              </p>
            </div>
          </section>

          <section>
            <h2 className={H2}>Claude Code</h2>
            <div className={CARD}>
              <p className="text-clouddrove-light mb-4">
                Two commands in Claude Code, and the skills below are installed along with the MCP server. This is
                the only client with a one-command route.
              </p>
              <pre className={`${PRE} mb-6`}>
                <code>{`${PLUGIN_INSTALL.marketplace}\n${PLUGIN_INSTALL.install}`}</code>
              </pre>
              <p className="text-clouddrove-light mb-6 text-sm">
                Without the plugin, copy a skill directory to{' '}
                <code className="font-mono">.claude/skills/&lt;skill-name&gt;/SKILL.md</code> in your repository, or
                to <code className="font-mono">~/.claude/skills/</code> for every project. Cursor reads{' '}
                <code className="font-mono">.claude/skills/</code> too.
              </p>

              <h3 className={H3}>
                {SKILLS.length === 1 ? 'The skill' : `The ${SKILLS.length} skills`}
              </h3>
              <p className="text-clouddrove-light mb-6 text-sm">
                A skill loads only when the model judges it relevant, which is why it can carry the full detail
                rather than the summary an always-on instruction file has to be.
              </p>
              <div className="space-y-6">
                {SKILLS.map((skill) => (
                  <div key={skill.name} id={skill.name} className="border-2 border-clouddrove-light/30 rounded-xl p-5">
                    <h4 className="text-base font-semibold text-clouddrove-dark mb-2 font-mono">{skill.name}</h4>
                    <p className="text-clouddrove-light text-sm mb-3">{skill.description}</p>
                    <p className="text-clouddrove-light text-sm mb-4">
                      Source: <code className="font-mono">{skill.source}</code>.{' '}
                      <a
                        href={`${GITHUB_BLOB}/${skill.source}`}
                        className={LINK}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View on GitHub
                      </a>
                    </p>
                    <details>
                      <summary className={SUMMARY}>Read the skill</summary>
                      <div className="mt-4">{renderMarkdown(skill.body, `skill-${skill.dir}`, 3)}</div>
                    </details>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section>
            <h2 className={H2}>Every other client</h2>
            <div className={CARD}>
              <p className="text-clouddrove-light mb-6">
                No plugin route here, so these are copied by hand. Every file is already named as its target
                filename, so nothing needs renaming. Take the ones for the clients your team uses: shipping all of
                them costs context on every request.
              </p>
              <div className="overflow-x-auto mb-8">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-clouddrove-light/30 text-left">
                      <th className="py-2 pr-4 font-semibold text-clouddrove-dark">Copy this</th>
                      <th className="py-2 pr-4 font-semibold text-clouddrove-dark">To here in your repository</th>
                      <th className="py-2 font-semibold text-clouddrove-dark">Read by</th>
                    </tr>
                  </thead>
                  <tbody className="text-clouddrove-light">
                    {COPY_ROWS.map((row) => (
                      <tr key={row.source} className="border-b border-clouddrove-light/20 align-top">
                        <td className="py-2 pr-4">{renderInline(row.sourceCell, `t-src-${row.source}`)}</td>
                        <td className="py-2 pr-4">{renderInline(row.destinationCell, `t-dest-${row.source}`)}</td>
                        <td className="py-2">{renderInline(row.readByCell, `t-read-${row.source}`)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-6">
                {COPY_ROWS.map((row) => (
                  <FileCard key={row.source} row={row} />
                ))}
              </div>
            </div>
          </section>

          <section>
            <h2 className={H2}>The warnings</h2>
            <div className={CARD}>
              <p className="text-clouddrove-light mb-6">
                The ways to install these files correctly and still have nothing happen. Each of these fails
                silently: no error, no warning, just a client that never sees the rules.
              </p>
              <div className="space-y-8">
                {WARNINGS.map((warning) => (
                  <div key={warning.source + warning.title} className="border-2 border-clouddrove-light/30 rounded-xl p-5">
                    <h3 className={H3}>{warning.title}</h3>
                    {renderMarkdown(warning.body, `warn-${warning.title}`, 3)}
                    <p className="text-clouddrove-light text-xs">
                      From <code className="font-mono">{warning.source}</code>.{' '}
                      <a
                        href={`${GITHUB_BLOB}/${warning.source}`}
                        className={LINK}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View on GitHub
                      </a>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section>
            <h2 className={H2}>Next</h2>
            <div className={CARD}>
              <p className="text-clouddrove-light mb-4">
                These files describe tools that have to exist. Install the MCP server first, or the instructions
                name tools nobody can call.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/mcp"
                  className="bg-gradient-to-r from-clouddrove-dark to-clouddrove-light text-white px-5 py-3 rounded-lg text-sm font-semibold hover:from-clouddrove-light hover:to-clouddrove-dark transition-all duration-300"
                >
                  Install the MCP server
                </Link>
                <Link
                  href="/docs"
                  className="border-2 border-clouddrove-light/40 text-clouddrove-dark px-5 py-3 rounded-lg text-sm font-semibold hover:border-clouddrove-dark transition-colors"
                >
                  Documentation
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
