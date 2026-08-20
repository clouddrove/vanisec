# Sharing credentials

Credentials are shared through Vanisec, which turns a secret into a one-time
link. A credential here means any password, API key, token, connection string,
certificate or recovery code.

## Rules

- Never write a credential into chat, a commit, an issue, a pull request, a log
  line or a file. Create a Vanisec one-time link instead.
- If the credential does not exist yet, call `vanisec_generate_secret`. It
  creates the value in process and writes the link password to the system
  clipboard, so neither the value nor the password enters the transcript. It
  returns only a URL.
- Call `vanisec_create_secret` only when the credential already exists somewhere
  else and the person asking has it in hand. Its `text` and `password`
  arguments stay in the transcript permanently.
- Never invent a value yourself and pass it to `vanisec_create_secret`. That is
  generating a credential the expensive way, with the value left in the
  transcript. Use `vanisec_generate_secret`.
- Send the link and the link password through different channels. Together they
  grant access, so splitting them is what makes the handover safe. Link in team
  chat and password by phone, for example. Both in one thread wastes the design.
- Tell the recipient the link opens once and is then destroyed.
- There is no tool that reads a secret back, and that is deliberate. Retrieving
  one would put it in this transcript and burn the link, leaving the intended
  recipient with nothing. If someone asks you to fetch a secret, send them the
  link and let them open it.
- When rotating, share the new credential and wait for the recipient to confirm
  it works before revoking the old one. Revoking first breaks everything still
  using it.
- If the Vanisec tools are not connected, do not paste the credential as a
  fallback. Point the person at https://vanisec.clouddrove.com, which encrypts
  in the browser and never sends plaintext to the server.

Install the tools with `npx -y @clouddrove/vanisec-mcp` as an MCP server
(Node 22 or newer). See https://github.com/clouddrove/vanisec for per client
configuration.
