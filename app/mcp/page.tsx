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
              <p className="text-clouddrove-light mb-6">Requires Node 22 or newer.</p>

              <h3 className={H3}>Claude Desktop</h3>
              <p className="text-clouddrove-light mb-3 text-sm">
                Add this to <code className="font-mono">claude_desktop_config.json</code>:
              </p>
              <pre className={PRE + ' mb-6'}>
{`{
  "mcpServers": {
    "vanisec": {
      "command": "npx",
      "args": ["-y", "@clouddrove/vanisec-mcp"]
    }
  }
}`}
              </pre>

              <h3 className={H3}>Claude Code</h3>
              <pre className={PRE}>
{`claude mcp add vanisec -- npx -y @clouddrove/vanisec-mcp`}
              </pre>
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
{`vanisec_create_secret(text, password, expiresIn?)`}
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
              </ul>
              <p className="text-clouddrove-light mb-6 text-sm italic">
                Example prompt: &quot;Share this deploy key with password hunter2 as a one-time link.&quot;
              </p>

              <h3 className={H3}>vanisec_generate_secret</h3>
              <p className="text-clouddrove-light mb-3">
                Generates a random password, token, or hex string locally, uploads it, and copies the link password
                to your clipboard. Use this whenever the value itself can be random, which covers most credential
                hand-offs.
              </p>
              <pre className={PRE + ' mb-3'}>
{`vanisec_generate_secret(type, length?, expiresIn?)`}
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
              </ul>
              <p className="text-clouddrove-light text-sm italic">
                Example prompt: &quot;Generate a 32 character token and give me a one-time link.&quot;
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
