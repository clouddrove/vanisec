import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MCP Server',
  description:
    'Vanisec MCP server: share secrets from Claude and other AI clients without pasting them into chat. Covers what reaches the conversation, install, tools, and self-hosting.',
  alternates: { canonical: '/mcp' },
}

const CARD = 'bg-white rounded-2xl p-8 border-2 border-clouddrove-light/30'
const PRE = 'bg-clouddrove-light/10 rounded-lg p-4 overflow-x-auto text-xs md:text-sm'
const H2 = 'text-2xl md:text-3xl font-bold text-clouddrove-dark mb-4'
const H3 = 'text-lg font-semibold text-clouddrove-dark mb-2'

export default function MCPPage() {
  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-clouddrove-dark mb-4">MCP Server</h1>
          <p className="text-lg md:text-xl text-clouddrove-light max-w-2xl mx-auto">
            Share secrets from Claude and other AI clients without pasting them into chat
          </p>
        </div>

        <div className="space-y-12">
          <section>
            <h2 className={H2}>What reaches the conversation</h2>
            <div className={CARD}>
              <p className="text-clouddrove-light mb-6">
                This is what decides whether you should install this at all, and which tool to reach for once you
                have. The two tools have very different trust properties.
              </p>
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-clouddrove-light/30 text-left">
                      <th className="py-2 pr-4 font-semibold text-clouddrove-dark">Tool</th>
                      <th className="py-2 pr-4 font-semibold text-clouddrove-dark">Secret value</th>
                      <th className="py-2 pr-4 font-semibold text-clouddrove-dark">Password</th>
                      <th className="py-2 font-semibold text-clouddrove-dark">Link</th>
                    </tr>
                  </thead>
                  <tbody className="text-clouddrove-light">
                    <tr className="border-b border-clouddrove-light/20">
                      <td className="py-2 pr-4 font-mono">vanisec_create_secret</td>
                      <td className="py-2 pr-4">in conversation</td>
                      <td className="py-2 pr-4">in conversation</td>
                      <td className="py-2">in conversation</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-mono">vanisec_generate_secret</td>
                      <td className="py-2 pr-4">never</td>
                      <td className="py-2 pr-4">clipboard only</td>
                      <td className="py-2">in conversation</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-clouddrove-light mb-3">
                <code className="font-mono text-sm">create_secret</code> does not make anything worse, because the
                caller already typed the secret into the conversation, but the transcript keeps it.
              </p>
              <p className="text-clouddrove-light">
                <code className="font-mono text-sm">generate_secret</code> produces the value locally and puts the
                link password on the clipboard, so the conversation holds only a URL, which is useless on its own.
              </p>
            </div>
          </section>

          <section>
            <h2 className={H2}>Install</h2>
            <div className={CARD}>
              <p className="text-clouddrove-light mb-4">
                Two ways to run this, and they are not equivalent.
              </p>
              <p className="text-clouddrove-light mb-3">
                <strong className="text-clouddrove-dark">stdio</strong> runs{' '}
                <code className="font-mono text-sm">npx -y @clouddrove/vanisec-mcp</code> on your own machine. You
                get both tools, and encryption happens locally, so Vanisec only ever receives ciphertext. Requires
                Node 22 or newer.
              </p>
              <p className="text-clouddrove-light mb-6">
                <strong className="text-clouddrove-dark">Hosted</strong> points a client at{' '}
                <code className="font-mono text-sm">https://vanisec.clouddrove.com/api/mcp</code>. It encrypts
                server side and offers <code className="font-mono text-sm">vanisec_create_secret</code> only. Use it
                only when the client cannot run a local process, and read the hosted endpoint section below first.
              </p>

              <h3 className={H3}>One server, four different top-level keys</h3>
              <p className="text-clouddrove-light mb-4 text-sm">
                Getting the key wrong is a silent no-op: the client starts, the server never loads, and nothing
                tells you why. Open your client below for the exact key and file.
              </p>
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-clouddrove-light/30 text-left">
                      <th className="py-2 pr-4 font-semibold text-clouddrove-dark">Client</th>
                      <th className="py-2 pr-4 font-semibold text-clouddrove-dark">Config file</th>
                      <th className="py-2 font-semibold text-clouddrove-dark">Top-level key</th>
                    </tr>
                  </thead>
                  <tbody className="text-clouddrove-light">
                    {[
                      ['Claude Code', 'written by claude mcp add', 'not edited by hand'],
                      ['Claude Desktop', 'claude_desktop_config.json', 'mcpServers'],
                      ['Cursor', '.cursor/mcp.json, ~/.cursor/mcp.json', 'mcpServers'],
                      ['VS Code with Copilot', '.vscode/mcp.json', 'servers'],
                      ['Copilot Agent Host', '.mcp.json, ~/.copilot/mcp-config.json', 'mcpServers'],
                      ['Copilot CLI', '~/.copilot/mcp-config.json, .mcp.json, .github/mcp.json', 'mcpServers'],
                      ['Copilot cloud agent, code review', 'repository settings, not a file', 'mcpServers'],
                      ['Copilot JetBrains, Visual Studio, Xcode, Eclipse', 'not documented, add through the UI', 'servers'],
                      ['Codex', '~/.codex/config.toml, .codex/config.toml', '[mcp_servers.vanisec]'],
                      ['Windsurf Cascade', '~/.codeium/windsurf/mcp_config.json', 'mcpServers'],
                      ['Windsurf plugin for VS Code and JetBrains', '~/.codeium/mcp_config.json', 'mcpServers'],
                      ['Devin Local', '~/.config/devin/mcp_config.json, .devin/mcp_config.json', 'mcpServers'],
                      ['Zed', '~/.config/zed/settings.json', 'context_servers'],
                    ].map(([client, file, key]) => (
                      <tr key={client} className="border-b border-clouddrove-light/20 align-top">
                        <td className="py-2 pr-4">{client}</td>
                        <td className="py-2 pr-4 font-mono text-xs">{file}</td>
                        <td className="py-2 font-mono text-xs">{key}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <details open className="group">
                <summary
                  className="cursor-pointer list-none flex items-center justify-between gap-3 py-4 border-t border-clouddrove-light/20 text-lg font-semibold text-clouddrove-dark hover:text-clouddrove-light marker:hidden"
                >
                  <span>Claude Code</span>
                  <span aria-hidden="true" className="text-clouddrove-light transition-transform group-open:rotate-90">
                    &#9656;
                  </span>
                </summary>
                <div className="pb-4">
              <pre className={PRE + ' mb-6'}>
{`claude mcp add vanisec -- npx -y @clouddrove/vanisec-mcp`}
              </pre>

                </div>
              </details>
              <details className="group">
                <summary
                  className="cursor-pointer list-none flex items-center justify-between gap-3 py-4 border-t border-clouddrove-light/20 text-lg font-semibold text-clouddrove-dark hover:text-clouddrove-light marker:hidden"
                >
                  <span>Claude Desktop</span>
                  <span aria-hidden="true" className="text-clouddrove-light transition-transform group-open:rotate-90">
                    &#9656;
                  </span>
                </summary>
                <div className="pb-4">
              <p className="text-clouddrove-light mb-3 text-sm">
                Settings, Developer, Edit Config opens{' '}
                <code className="font-mono">claude_desktop_config.json</code>, at{' '}
                <code className="font-mono">~/Library/Application Support/Claude/claude_desktop_config.json</code> on
                macOS and <code className="font-mono">%APPDATA%\Claude\claude_desktop_config.json</code> on Windows.
                Key <code className="font-mono">mcpServers</code>.
              </p>
              <pre className={PRE + ' mb-2'}>
{`{
  "mcpServers": {
    "vanisec": {
      "command": "npx",
      "args": ["-y", "@clouddrove/vanisec-mcp"]
    }
  }
}`}
              </pre>
              <p className="text-clouddrove-light mb-6 text-xs">
                Docs:{' '}
                <a className="underline" href="https://modelcontextprotocol.io/docs/develop/connect-local-servers">
                  modelcontextprotocol.io
                </a>
              </p>

                </div>
              </details>
              <details className="group">
                <summary
                  className="cursor-pointer list-none flex items-center justify-between gap-3 py-4 border-t border-clouddrove-light/20 text-lg font-semibold text-clouddrove-dark hover:text-clouddrove-light marker:hidden"
                >
                  <span>Cursor</span>
                  <span aria-hidden="true" className="text-clouddrove-light transition-transform group-open:rotate-90">
                    &#9656;
                  </span>
                </summary>
                <div className="pb-4">
              <p className="text-clouddrove-light mb-3 text-sm">
                <code className="font-mono">.cursor/mcp.json</code> for one project,{' '}
                <code className="font-mono">~/.cursor/mcp.json</code> for every project, project config winning. Key{' '}
                <code className="font-mono">mcpServers</code>. Turn the server on from Customize in the sidebar.
              </p>
              <pre className={PRE + ' mb-3'}>
{`{
  "mcpServers": {
    "vanisec": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@clouddrove/vanisec-mcp"]
    }
  }
}`}
              </pre>
              <p className="text-clouddrove-light mb-3 text-sm">
                Cursor&apos;s field table marks <code className="font-mono">type</code> as required for stdio while
                none of its examples include it. Including it is harmless. For the hosted endpoint, which is server
                side encryption and <code className="font-mono">vanisec_create_secret</code> only, leave{' '}
                <code className="font-mono">type</code> out, because Cursor documents no allowed values for it on a
                remote server.
              </p>
              <pre className={PRE + ' mb-2'}>
{`{
  "mcpServers": {
    "vanisec": {
      "url": "https://vanisec.clouddrove.com/api/mcp"
    }
  }
}`}
              </pre>
              <p className="text-clouddrove-light mb-6 text-xs">
                Docs:{' '}
                <a className="underline" href="https://cursor.com/docs/context/mcp">
                  cursor.com/docs/context/mcp
                </a>
              </p>

                </div>
              </details>
              <details className="group">
                <summary
                  className="cursor-pointer list-none flex items-center justify-between gap-3 py-4 border-t border-clouddrove-light/20 text-lg font-semibold text-clouddrove-dark hover:text-clouddrove-light marker:hidden"
                >
                  <span>VS Code with GitHub Copilot</span>
                  <span aria-hidden="true" className="text-clouddrove-light transition-transform group-open:rotate-90">
                    &#9656;
                  </span>
                </summary>
                <div className="pb-4">
              <p className="text-clouddrove-light mb-3 text-sm">
                The key is <code className="font-mono">servers</code>.{' '}
                <code className="font-mono">mcpServers</code> is not accepted in{' '}
                <code className="font-mono">.vscode/mcp.json</code>. On a Copilot Business or Enterprise seat, read
                the org policy note below first, because nothing works until an admin acts.{' '}
                <code className="font-mono">.vscode/mcp.json</code> covers the workspace; for a user level file run{' '}
                <code className="font-mono">MCP: Open User Configuration</code> from the command palette, since VS
                Code publishes no path for it. <code className="font-mono">settings.json</code> is no longer the
                mechanism.
              </p>
              <pre className={PRE + ' mb-3'}>
{`{
  "servers": {
    "vanisec": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@clouddrove/vanisec-mcp"]
    }
  }
}`}
              </pre>
              <p className="text-clouddrove-light mb-3 text-sm">
                Hosted, which is server side encryption and{' '}
                <code className="font-mono">vanisec_create_secret</code> only. Use{' '}
                <code className="font-mono">type: &quot;http&quot;</code>, since{' '}
                <code className="font-mono">sse</code> is legacy.
              </p>
              <pre className={PRE + ' mb-3'}>
{`{
  "servers": {
    "vanisec": {
      "type": "http",
      "url": "https://vanisec.clouddrove.com/api/mcp"
    }
  }
}`}
              </pre>
              <p className="text-clouddrove-light mb-3 text-sm">
                From a terminal, where a <code className="font-mono">name</code> key appears that does not exist
                inside <code className="font-mono">mcp.json</code>:
              </p>
              <pre className={PRE + ' mb-3'}>
{`code --add-mcp "{\\"name\\":\\"vanisec\\",\\"command\\":\\"npx\\",\\"args\\":[\\"-y\\",\\"@clouddrove/vanisec-mcp\\"]}"`}
              </pre>
              <p className="text-clouddrove-light mb-2 text-sm">
                Agent Host does not read <code className="font-mono">.vscode/mcp.json</code>. Its portable config is
                a workspace <code className="font-mono">.mcp.json</code> or{' '}
                <code className="font-mono">~/.copilot/mcp-config.json</code>, both keyed{' '}
                <code className="font-mono">mcpServers</code>.
              </p>
              <p className="text-clouddrove-light mb-6 text-xs">
                Docs:{' '}
                <a
                  className="underline"
                  href="https://code.visualstudio.com/docs/agents/reference/mcp-configuration"
                >
                  code.visualstudio.com
                </a>
              </p>

                </div>
              </details>
              <details className="group">
                <summary
                  className="cursor-pointer list-none flex items-center justify-between gap-3 py-4 border-t border-clouddrove-light/20 text-lg font-semibold text-clouddrove-dark hover:text-clouddrove-light marker:hidden"
                >
                  <span>GitHub Copilot, other surfaces</span>
                  <span aria-hidden="true" className="text-clouddrove-light transition-transform group-open:rotate-90">
                    &#9656;
                  </span>
                </summary>
                <div className="pb-4">
              <p className="text-clouddrove-light mb-3 text-sm">
                <strong className="text-clouddrove-dark">Start here.</strong> The organization and enterprise policy{' '}
                <code className="font-mono">MCP servers in Copilot</code> is disabled by default for Copilot
                Business and Enterprise seats. Until an admin enables it, nothing below works in any Copilot
                surface, including VS Code, and the failure does not explain itself. It does not apply to Free, Pro,
                Pro+ or Max.{' '}
                <a
                  className="underline"
                  href="https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-organization/manage-policies"
                >
                  Policy docs
                </a>
                .
              </p>
              <p className="text-clouddrove-light mb-3 text-sm">
                <strong className="text-clouddrove-dark">Cloud agent and code review.</strong> Configured under
                repository Settings, Copilot, MCP servers, not in a file. Key{' '}
                <code className="font-mono">mcpServers</code>, with{' '}
                <code className="font-mono">tools</code> and <code className="font-mono">type</code> both required.
                There is no local process here, so it is the hosted endpoint or nothing: server side encryption and{' '}
                <code className="font-mono">vanisec_create_secret</code> only, on a surface where the secrets being
                handled are rarely trivial. It also runs MCP tools without approval prompts, the opposite of every
                interactive client, so allowlist the specific tool rather than{' '}
                <code className="font-mono">&quot;*&quot;</code>. Naming the one tool we expose costs nothing and
                keeps the allowlist from silently widening later.
              </p>
              <pre className={PRE + ' mb-3'}>
{`{
  "mcpServers": {
    "vanisec": {
      "type": "http",
      "url": "https://vanisec.clouddrove.com/api/mcp",
      "tools": ["vanisec_create_secret"]
    }
  }
}`}
              </pre>
              <p className="text-clouddrove-light mb-6 text-sm">
                GitHub states the cloud agent supports tools only, not resources or prompts. OAuth remote servers
                are not supported, so use a static header if you need auth. Secrets must be Agents secrets named
                with a <code className="font-mono">COPILOT_MCP_</code> prefix.{' '}
                <a
                  className="underline"
                  href="https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/extend-coding-agent-with-mcp"
                >
                  Docs
                </a>
                .
              </p>
              <p className="text-clouddrove-light mb-3 text-sm">
                <strong className="text-clouddrove-dark">Copilot CLI.</strong> Key{' '}
                <code className="font-mono">mcpServers</code>, in{' '}
                <code className="font-mono">~/.copilot/mcp-config.json</code>,{' '}
                <code className="font-mono">.mcp.json</code> or{' '}
                <code className="font-mono">.github/mcp.json</code>. It does not read{' '}
                <code className="font-mono">.vscode/mcp.json</code> and reports an unsupported top-level key{' '}
                <code className="font-mono">servers</code> if you point it there. Every MCP tool call needs explicit
                permission, even read-only ones, which is the opposite of the cloud agent.
              </p>
              <pre className={PRE + ' mb-2'}>
{`jq '{mcpServers: .servers}' .vscode/mcp.json > .mcp.json

copilot mcp add vanisec -- npx -y @clouddrove/vanisec-mcp
copilot mcp add --transport http vanisec https://vanisec.clouddrove.com/api/mcp`}
              </pre>
              <p className="text-clouddrove-light mb-6 text-xs">
                The last line is the hosted endpoint: server side encryption,{' '}
                <code className="font-mono">vanisec_create_secret</code> only.{' '}
                <a
                  className="underline"
                  href="https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-mcp-servers"
                >
                  Docs
                </a>
                .
              </p>
              <p className="text-clouddrove-light mb-3 text-sm">
                <strong className="text-clouddrove-dark">JetBrains, Visual Studio, Xcode, Eclipse.</strong> All
                supported, all keyed <code className="font-mono">servers</code>. GitHub never publishes a path for
                these files, saying only that it varies by IDE, so add the server through the UI. In JetBrains:
                Copilot icon, Open Chat, Agent mode, tools icon, Add MCP Tools. Minimum versions: JetBrains plugin
                1.5.53 or newer for remote servers, Visual Studio 2022 17.14, Xcode 0.41.0, Eclipse plug-in 0.10.0.
                The block below is the hosted endpoint, so server side encryption and{' '}
                <code className="font-mono">vanisec_create_secret</code> only. Install the package with stdio
                instead if the IDE can run a local process.
              </p>
              <pre className={PRE + ' mb-3'}>
{`{
  "servers": {
    "vanisec": {
      "url": "https://vanisec.clouddrove.com/api/mcp"
    }
  }
}`}
              </pre>
              <p className="text-clouddrove-light mb-3 text-sm">
                If you need to send a header, JetBrains, Xcode and Eclipse nest it under{' '}
                <code className="font-mono">requestInit</code>, not a top level{' '}
                <code className="font-mono">headers</code> key. Visual Studio uses a plain{' '}
                <code className="font-mono">url</code> with OAuth instead.
              </p>
              <pre className={PRE + ' mb-2'}>
{`{
  "servers": {
    "vanisec": {
      "url": "https://vanisec.clouddrove.com/api/mcp",
      "requestInit": {
        "headers": { "Authorization": "Bearer TOKEN" }
      }
    }
  }
}`}
              </pre>
              <p className="text-clouddrove-light mb-6 text-xs">
                Docs:{' '}
                <a
                  className="underline"
                  href="https://docs.github.com/en/copilot/how-tos/context/use-mcp/extend-copilot-chat-with-mcp"
                >
                  docs.github.com
                </a>
                . github.com web chat and Copilot Spaces are not supported at all: both use a preconfigured GitHub
                MCP server that cannot be changed.
              </p>

                </div>
              </details>
              <details className="group">
                <summary
                  className="cursor-pointer list-none flex items-center justify-between gap-3 py-4 border-t border-clouddrove-light/20 text-lg font-semibold text-clouddrove-dark hover:text-clouddrove-light marker:hidden"
                >
                  <span>Codex</span>
                  <span aria-hidden="true" className="text-clouddrove-light transition-transform group-open:rotate-90">
                    &#9656;
                  </span>
                </summary>
                <div className="pb-4">
              <p className="text-clouddrove-light mb-3 text-sm">
                <code className="font-mono">~/.codex/config.toml</code> for you,{' '}
                <code className="font-mono">.codex/config.toml</code> for a project, and the project file is read
                only when the project is trusted. The table name is{' '}
                <code className="font-mono">[mcp_servers.vanisec]</code>, snake_case, not{' '}
                <code className="font-mono">mcpServers</code>. The IDE extension reads the same file.
              </p>
              <p className="text-clouddrove-light mb-3 text-sm">
                <strong className="text-clouddrove-dark">
                  Set <code className="font-mono">startup_timeout_sec = 30</code>.
                </strong>{' '}
                The default is 10 seconds and an <code className="font-mono">npx -y</code> cold start routinely
                exceeds it. The symptom is the server failing to start with no useful explanation, and it is the
                single most common way this install goes wrong.
              </p>
              <pre className={PRE + ' mb-3'}>
{`[mcp_servers.vanisec]
command = "npx"
args = ["-y", "@clouddrove/vanisec-mcp"]
startup_timeout_sec = 30`}
              </pre>
              <p className="text-clouddrove-light mb-3 text-sm">
                Hosted, which is server side encryption and{' '}
                <code className="font-mono">vanisec_create_secret</code> only:
              </p>
              <pre className={PRE + ' mb-3'}>
{`[mcp_servers.vanisec]
url = "https://vanisec.clouddrove.com/api/mcp"
startup_timeout_sec = 30`}
              </pre>
              <pre className={PRE + ' mb-2'}>
{`codex mcp add vanisec -- npx -y @clouddrove/vanisec-mcp
codex mcp add vanisec-remote --url https://vanisec.clouddrove.com/api/mcp`}
              </pre>
              <p className="text-clouddrove-light mb-6 text-xs">
                Inline <code className="font-mono">bearer_token</code> is gone, replaced by{' '}
                <code className="font-mono">bearer_token_env_var</code>, and{' '}
                <code className="font-mono">experimental_use_rmcp_client</code> is unnecessary now that streamable
                HTTP is first-class. Docs:{' '}
                <a className="underline" href="https://learn.chatgpt.com/docs/codex/cli">
                  learn.chatgpt.com/docs/codex/cli
                </a>
              </p>

                </div>
              </details>
              <details className="group">
                <summary
                  className="cursor-pointer list-none flex items-center justify-between gap-3 py-4 border-t border-clouddrove-light/20 text-lg font-semibold text-clouddrove-dark hover:text-clouddrove-light marker:hidden"
                >
                  <span>Windsurf and Devin</span>
                  <span aria-hidden="true" className="text-clouddrove-light transition-transform group-open:rotate-90">
                    &#9656;
                  </span>
                </summary>
                <div className="pb-4">
              <p className="text-clouddrove-light mb-3 text-sm">
                The Devin rebrand split the config in two, so the file depends on the surface. Legacy Cascade uses{' '}
                <code className="font-mono">~/.codeium/windsurf/mcp_config.json</code>, the Windsurf plugin for VS
                Code and JetBrains uses <code className="font-mono">~/.codeium/mcp_config.json</code>, and Devin
                Local uses <code className="font-mono">~/.config/devin/mcp_config.json</code> or{' '}
                <code className="font-mono">.devin/mcp_config.json</code>. All four use{' '}
                <code className="font-mono">mcpServers</code>, and stdio is identical in all of them.
              </p>
              <pre className={PRE + ' mb-3'}>
{`{
  "mcpServers": {
    "vanisec": {
      "command": "npx",
      "args": ["-y", "@clouddrove/vanisec-mcp"]
    }
  }
}`}
              </pre>
              <p className="text-clouddrove-light mb-3 text-sm">
                The remote form differs, and both are the hosted endpoint: server side encryption,{' '}
                <code className="font-mono">vanisec_create_secret</code> only. Cascade uses{' '}
                <code className="font-mono">serverUrl</code> and takes no transport key. Devin Local uses{' '}
                <code className="font-mono">url</code> with an optional{' '}
                <code className="font-mono">transport</code>, defaulting to{' '}
                <code className="font-mono">http</code>.
              </p>
              <pre className={PRE + ' mb-2'}>
{`{
  "mcpServers": {
    "vanisec": { "serverUrl": "https://vanisec.clouddrove.com/api/mcp" }
  }
}

{
  "mcpServers": {
    "vanisec": {
      "url": "https://vanisec.clouddrove.com/api/mcp",
      "transport": "http"
    }
  }
}`}
              </pre>
              <p className="text-clouddrove-light mb-6 text-xs">
                Cascade caps out at 100 tools across all servers. Docs:{' '}
                <a className="underline" href="https://docs.devin.ai/work-with-devin/mcp">
                  docs.devin.ai
                </a>
              </p>

                </div>
              </details>
              <details className="group">
                <summary
                  className="cursor-pointer list-none flex items-center justify-between gap-3 py-4 border-t border-clouddrove-light/20 text-lg font-semibold text-clouddrove-dark hover:text-clouddrove-light marker:hidden"
                >
                  <span>Zed</span>
                  <span aria-hidden="true" className="text-clouddrove-light transition-transform group-open:rotate-90">
                    &#9656;
                  </span>
                </summary>
                <div className="pb-4">
              <p className="text-clouddrove-light mb-3 text-sm">
                <code className="font-mono">~/.config/zed/settings.json</code>, key{' '}
                <code className="font-mono">context_servers</code>. Add it from Settings, AI, MCP Servers, Add
                Server. The old <code className="font-mono">&quot;source&quot;: &quot;custom&quot;</code>{' '}
                discriminator is gone, and a project level{' '}
                <code className="font-mono">.zed/settings.json</code> for context servers is not documented, so use
                the user file.
              </p>
              <pre className={PRE + ' mb-3'}>
{`{
  "context_servers": {
    "vanisec": {
      "command": "npx",
      "args": ["-y", "@clouddrove/vanisec-mcp"],
      "env": {}
    }
  }
}`}
              </pre>
              <p className="text-clouddrove-light mb-3 text-sm">
                Hosted, which is server side encryption and{' '}
                <code className="font-mono">vanisec_create_secret</code> only. Zed accepts only{' '}
                <code className="font-mono">url</code> and <code className="font-mono">headers</code> on a remote
                server.
              </p>
              <pre className={PRE + ' mb-2'}>
{`{
  "context_servers": {
    "vanisec": { "url": "https://vanisec.clouddrove.com/api/mcp" }
  }
}`}
              </pre>
              <p className="text-clouddrove-light text-xs">
                Tool permissions are keyed <code className="font-mono">mcp:vanisec:&lt;tool_name&gt;</code>. Docs:{' '}
                <a className="underline" href="https://zed.dev/docs/ai/mcp">
                  zed.dev/docs/ai/mcp
                </a>
              </p>
                </div>
              </details>
            </div>
          </section>

          <section>
            <h2 className={H2}>Tools</h2>
            <div className={CARD}>
              <h3 className={H3}>vanisec_create_secret</h3>
              <p className="text-clouddrove-light mb-3">
                Uploads a secret whose text and password you provide directly. Use this when the secret already
                exists somewhere, such as an API key you are handing off.
              </p>
              <pre className={PRE + ' mb-3'}>
{`vanisec_create_secret(text, password, expiresIn?, pairingCode?)`}
              </pre>
              <ul className="space-y-1 text-clouddrove-light mb-6 text-sm">
                <li>
                  <code className="font-mono">text</code>: the secret content
                </li>
                <li>
                  <code className="font-mono">password</code>: required, chosen by the caller
                </li>
                <li>
                  <code className="font-mono">expiresIn</code>: hours, one of 1, 6, 24, 72, 168, default 24
                </li>
                <li>
                  <code className="font-mono">pairingCode</code>: also return a short code to type at{' '}
                  <code className="font-mono">/c</code> on another device, such as your phone. Lasts five
                  minutes, works once, and the password is still needed. Off by default
                </li>
              </ul>
              <p className="text-clouddrove-light mb-6 text-sm italic">
                Example prompt: &quot;Share this deploy key with password hunter2 as a one-time link.&quot;
              </p>

              <h3 className={H3}>vanisec_create_clip</h3>
              <p className="text-clouddrove-light mb-3">
                Puts plain text on the clipboard and returns a four digit code to enter at{' '}
                <code className="font-mono">/clipboard</code> on another device. Use it for moving
                ordinary text onto a phone you are holding.
              </p>
              <pre className={PRE + ' mb-3'}>
{`vanisec_create_clip(text)`}
              </pre>
              <ul className="space-y-1 text-clouddrove-light mb-3 text-sm">
                <li>
                  <code className="font-mono">text</code>: the text to put on the clipboard
                </li>
              </ul>
              <p className="text-clouddrove-light mb-3 text-sm">
                Clips expire after five minutes and open once. <strong className="text-clouddrove-dark">
                Not a private channel:</strong> four digits is too small a space to be an
                encryption key, so the key is held server side and Vanisec can read a clip while it
                exists. Never use it for a credential; that is what{' '}
                <code className="font-mono">vanisec_generate_secret</code> is for.
              </p>
              <p className="text-clouddrove-light mb-6 text-sm italic">
                Example prompt: &quot;Put this YAML block on my phone.&quot;
              </p>

              <h3 className={H3}>vanisec_generate_secret</h3>
              <p className="text-clouddrove-light mb-3">
                Generates a random password, token, or hex string locally, uploads it, and copies the link password
                to your clipboard. Use this whenever the value itself can be random, which covers most credential
                hand-offs.
              </p>
              <pre className={PRE + ' mb-3'}>
{`vanisec_generate_secret(type, length?, expiresIn?, pairingCode?)`}
              </pre>
              <ul className="space-y-1 text-clouddrove-light mb-6 text-sm">
                <li>
                  <code className="font-mono">type</code>: <code className="font-mono">password</code>,{' '}
                  <code className="font-mono">token</code>, or <code className="font-mono">hex</code>
                </li>
                <li>
                  <code className="font-mono">length</code>: password default is 24, range 12 to 128; token
                  default is 32, range 16 to 128; hex default is 64, range 16 to 256, even lengths only
                </li>
                <li>
                  <code className="font-mono">expiresIn</code>: hours, one of 1, 6, 24, 72, 168, default 24
                </li>
                <li>
                  <code className="font-mono">pairingCode</code>: also return a short code to type at{' '}
                  <code className="font-mono">/c</code> on another device, such as your phone. Lasts five
                  minutes, works once, and the password is still needed. Off by default
                </li>
              </ul>
              <p className="text-clouddrove-light text-sm italic">
                Example prompt: &quot;Generate a 32 character token and give me a one-time link.&quot;
              </p>
            </div>
          </section>

          <section>
            <h2 className={H2}>Prompts</h2>
            <div className={CARD}>
              <p className="text-clouddrove-light mb-4">
                Two prompts ship with the server, for the cases where picking the wrong tool is the actual risk.{' '}
                <code className="font-mono text-sm">share-credential</code> points at{' '}
                <code className="font-mono text-sm">vanisec_generate_secret</code> when the credential does not
                exist yet and falls back to <code className="font-mono text-sm">vanisec_create_secret</code> only
                when it already exists elsewhere.{' '}
                <code className="font-mono text-sm">rotate-and-share</code> adds the ordering: hand over the
                replacement, wait for the recipient to confirm it works, revoke the old value only after that.
              </p>
              <h3 className={H3}>Which clients can reach them</h3>
              <p className="text-clouddrove-light mb-4 text-sm">
                Mostly none of them. Several vendors declare prompt support in a capability table and then document
                no way for a user to invoke one. Rows below come from each vendor&apos;s own docs, checked
                2026-08-20, and cover the clients in the install matrix above.
              </p>
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-clouddrove-light/30 text-left">
                      <th className="py-2 pr-4 font-semibold text-clouddrove-dark">Client</th>
                      <th className="py-2 pr-4 font-semibold text-clouddrove-dark">Prompts</th>
                      <th className="py-2 font-semibold text-clouddrove-dark">How you reach them</th>
                    </tr>
                  </thead>
                  <tbody className="text-clouddrove-light">
                    {[
                      [
                        'VS Code with Copilot',
                        'yes',
                        '/mcp.vanisec.share-credential, /mcp.vanisec.rotate-and-share',
                      ],
                      ['Cursor', 'declared supported', 'no documented surface'],
                      ['Windsurf, Devin', 'declared supported', 'no documented surface'],
                      ['Zed', 'declared supported', 'no documented surface'],
                      [
                        'Copilot cloud agent, code review',
                        'no',
                        'GitHub documents tools only, explicitly not prompts',
                      ],
                      [
                        'Copilot JetBrains, Visual Studio, Xcode, Eclipse, CLI',
                        'not documented',
                        '',
                      ],
                      ['Codex', 'not documented', 'reads the server instructions field instead'],
                    ].map(([client, support, how]) => (
                      <tr key={client} className="border-b border-clouddrove-light/20 align-top">
                        <td className="py-2 pr-4">{client}</td>
                        <td className="py-2 pr-4">{support}</td>
                        <td className="py-2 font-mono text-xs">{how}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-clouddrove-light mb-4 text-sm">
                VS Code is the only client with a documented, user-reachable prompt surface. Declared supported
                means the vendor lists prompts as a supported MCP feature but publishes no invocation surface, so
                treat those three as unreachable until they document one.
              </p>
              <p className="text-clouddrove-light text-sm">
                That is why the two tool descriptions repeat the guidance the prompts give: it is the only channel
                every client reads. Tracking issue{' '}
                <a className="underline" href="https://github.com/clouddrove/vanisec/issues/112">
                  #112
                </a>
                .
              </p>
            </div>
          </section>

          <section>
            <h2 className={H2}>Hosted endpoint</h2>
            <div className="bg-gradient-to-br from-clouddrove-light/10 to-clouddrove-dark/10 rounded-2xl p-8 border-2 border-clouddrove-light/30">
              <p className="text-clouddrove-light mb-4">
                For clients that cannot run a local process, an MCP endpoint is available at{' '}
                <code className="font-mono text-sm">POST https://vanisec.clouddrove.com/api/mcp</code>.
              </p>
              <p className="text-clouddrove-light mb-4">
                <strong className="text-clouddrove-dark">
                  It is not zero-knowledge, and you should use the local package instead wherever you can.
                </strong>{' '}
                The endpoint receives your secret and your password in the request body and encrypts them on our
                server. For the duration of that request, Vanisec holds material it otherwise never sees. That is
                the opposite of how the rest of this product works, and it is the entire reason the local package
                exists.
              </p>
              <p className="text-clouddrove-light mb-4">
                It offers <code className="font-mono text-sm">vanisec_create_secret</code> only.{' '}
                <code className="font-mono text-sm">vanisec_generate_secret</code> is deliberately absent: its
                purpose is putting the link password on your clipboard, and over HTTP the clipboard would be the
                server&apos;s, so the password would have to travel back in the response and into your
                conversation. Offering it here would defeat the reason it exists.
              </p>
              <p className="text-clouddrove-light mb-4">
                Because of both of those, the two forms are not interchangeable. Prefer stdio wherever it can run,
                and pick the hosted endpoint only for a client that has no local process at all, such as
                Copilot&apos;s cloud agent, knowing what you are giving up.
              </p>
              <pre className={PRE}>
{`{
  "mcpServers": {
    "vanisec": {
      "url": "https://vanisec.clouddrove.com/api/mcp"
    }
  }
}`}
              </pre>
              <p className="text-clouddrove-light mt-4 text-sm">
                That block uses <code className="font-mono">mcpServers</code>. Four different top-level keys are in
                play across clients, so check the install matrix above before copying it anywhere.
              </p>
              <p className="text-clouddrove-light mt-4 text-sm">
                The remote form is also newer and less exercised than stdio. The endpoint negotiates the protocol
                revision rather than pinning one: ask for <code className="font-mono">2025-11-25</code>,{' '}
                <code className="font-mono">2025-06-18</code>, <code className="font-mono">2025-03-26</code> or{' '}
                <code className="font-mono">2024-11-05</code> and you get that same revision back, and anything
                else is answered with <code className="font-mono">2025-11-25</code>. It does not speak{' '}
                <code className="font-mono">2026-07-28</code>, the current revision, which replaced the initialize
                handshake with per-request metadata and a mandatory{' '}
                <code className="font-mono">server/discover</code>. It runs the Streamable HTTP JSON mode, so a{' '}
                <code className="font-mono">GET</code> for an SSE stream is declined with{' '}
                <code className="font-mono">405</code>, which that transport allows. Each remote block above
                follows the shape its vendor documents. We have not tested every client against the endpoint.
              </p>
              <p className="text-clouddrove-light mt-4 text-sm">
                Rate limited to 20 calls per 10 minutes per IP, since server side key derivation is more expensive
                than the browser path.
              </p>
            </div>
          </section>

          <section>
            <h2 className={H2}>Self-hosting</h2>
            <div className={CARD}>
              <p className="text-clouddrove-light mb-3">
                Point the server at your own Vanisec instance by setting{' '}
                <code className="font-mono text-sm">VANISEC_BASE_URL</code> in the config&apos;s{' '}
                <code className="font-mono text-sm">env</code> block:
              </p>
              <pre className={PRE}>
{`{
  "mcpServers": {
    "vanisec": {
      "command": "npx",
      "args": ["-y", "@clouddrove/vanisec-mcp"],
      "env": {
        "VANISEC_BASE_URL": "https://your-instance.example.com"
      }
    }
  }
}`}
              </pre>
            </div>
          </section>

          <section>
            <h2 className={H2}>Why there is no retrieval tool</h2>
            <div className="bg-gradient-to-br from-clouddrove-light/10 to-clouddrove-dark/10 rounded-2xl p-8 border-2 border-clouddrove-light/30">
              <p className="text-clouddrove-light">
                There is no <code className="font-mono text-sm">vanisec_retrieve_secret</code>, and there will not
                be one. A retrieved secret would land in the model&apos;s context and in the transcript, which would
                stop a one-time secret from being one-time. That defeats the entire point of the tool, so retrieval
                is deliberately absent.
              </p>
            </div>
          </section>

          <section>
            <h2 className={H2}>Clipboard requirement</h2>
            <div className={CARD}>
              <p className="text-clouddrove-light mb-3">
                <code className="font-mono text-sm">generate_secret</code> relies on a system clipboard to hand you
                the link password without it passing through the conversation. Over SSH or inside a container there
                may be no clipboard available, and in that case the tool fails rather than falling back to revealing
                the password in the conversation.
              </p>
              <p className="text-clouddrove-light">
                Set <code className="font-mono text-sm">VANISEC_ALLOW_INLINE_PASSWORD=1</code> to opt into that
                degraded behaviour if you understand the trade-off and need it anyway.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
