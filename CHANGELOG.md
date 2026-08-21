# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Clipboard

Paste text or a file at `/clipboard`, get a short code, and open it on any other
device. No login, no password, and it opens once.

This exists because the two earlier attempts at the same problem both missed. A
pairing code still asks for the password on the second device, and the
passwordless handoff below needs the receiving device standing by before the
sender can send. Neither is "paste this, send someone a code, they read it
whenever".

There is still nothing the server can read, because **the code is the key**. One
PBKDF2 pass over a ten character code yields 512 bits: the first half is the id
the server stores under, the second half is the AES-GCM key. The code never
leaves the browser, so an id cannot be walked back to the code that produced it.

Ten characters rather than the eight a pairing code uses, because a pairing code
only locates a secret that a password still guards, while this one carries the
whole burden: 2^50, and reversing an id means that many PBKDF2 passes at 600,000
iterations.

The derivation salt is fixed rather than per-clip. Per-secret salts stop one
precomputation covering many secrets, which matters when the input is a
human-chosen password drawn from a small space. Every code here is 50 random
bits, so there is no small space to precompute, and a stored salt would only add
a round trip before the browser could derive anything.

The tradeoff worth stating: a code is a single string that grants access, so
anyone who sees it in transit can read the clip. That is the price of dropping
the password, and it is why a clip opens exactly once and expires.

Exposed as `POST /api/clip` and `POST /api/clip/open`.

### Passwordless device handoff

`/r` shows a code and waits. The receiving device generates an ephemeral P-256
keypair and publishes only the public half, so whatever arrives was sealed to a
key that never left that browser. The sender enters the code at `/c` and types.

Stronger than the password path rather than weaker: guessing a code lets someone
*send* to a waiting device, never *read* what someone else sent.

`/c` now takes either kind of code and works out which it was given, asking the
non-destructive `/api/beam/peek` before the one-shot `/api/pair/redeem`.

### Pairing codes

A Vanisec link is a 122-bit UUID in a URL, which is the right shape for sending a
secret to someone and the wrong shape for moving one onto the phone in your other
hand. Doing that meant messaging yourself the link, which puts it somewhere
neither one-time nor encrypted.

A pairing code is a short code, `4F2K-9QX1`, entered at `/c` on the other device.
It resolves to the secret id and nothing else: the password still gates retrieval
and still derives the key in the browser, so a code grants exactly what holding
the link already grants.

Codes are 8 characters of Crockford base32 (2^40), against 2^122 for the id.
Three things stand in for the difference: a five minute life, which is why it is
not configurable; single use, through the same atomic `GETDEL` that reads
secrets; and a redeem budget of 10 per 15 minutes per address. Unknown,
malformed, expired and already-redeemed codes all answer identically.

The alphabet omits `I`, `L`, `O` and `U`, since the first three misread when a
code is copied off one screen onto another. Because they cannot appear in a code,
a typed `I` or `L` folds to `1` and `O` to `0`.

Available on the website, on both MCP surfaces via an opt-in `pairingCode`
argument, and over the API as `POST /api/pair` and `POST /api/pair/redeem`.

Opt-in rather than automatic on MCP: the usual job there is handing a credential
to someone who reads it in Slack an hour later, and a five minute code would be
dead before they got to it.

### MCP package 0.3.0

`@clouddrove/vanisec-mcp` goes to 0.3.0 for the `pairingCode` argument on both
tools. Until it is tagged and published, the local package has no pairing while
the hosted endpoint does, which is the same local-versus-hosted split the 0.2.0
release existed to close.

`mcp/package-lock.json` had been left at 0.1.0 through the 0.2.0 release and is
now back in step with `mcp/package.json`.

### MCP package 0.2.0

`@clouddrove/vanisec-mcp` goes to 0.2.0. The published 0.1.0 predates the prompts
and the `instructions` field, so until this is released to npm the hosted
endpoint and the local package behave differently, which is the split those
changes existed to remove. npm versions are immutable, so the new server cannot
ship under the old number.

The version the server reports at initialization is now pinned to
`mcp/package.json` by a test, since a stale value there breaks nothing visibly
and only misreports the server to clients.


### Added

- **Tests for the Next app.** The root project had no test runner, so the
  hosted MCP endpoint and the secrets API were both uncovered. `npm test` runs
  `node --test` through `tsx`, matching the mcp package. The suite calls the API
  route handlers directly against an in-memory Redis stand-in, so it needs no
  server, no Docker and no network, and it runs as its own CI job. Covered: the
  JSON-RPC surface of `/api/mcp` including the deliberate absence of
  `vanisec_generate_secret`, the hosted instructions, the PBKDF2 floor that
  stops a modified client downgrading the key-derivation cost, the request body
  the 2.0.0 rewrite introduced, and the one-time retrieval semantics.
  `npm run test:integration` repeats the storage guarantees against a real
  Redis in Docker.
- **Agent Skills.** `skills/` carries the rules for handling secrets from an AI
  client: which of the two MCP tools to reach for and why, rotating a credential
  without causing an outage, and self-hosting. The format is shared by Claude
  Code, Cursor and Codex, so the same files load in all three.
- **Rules for other clients.** `integrations/` carries the same guidance as
  Cursor rules, GitHub Copilot instructions and prompt files, and `AGENTS.md`.
  These are meant to be copied into your own repository and are inert here.
- **MCP prompts.** `share-credential` and `rotate-and-share`, on both the stdio
  server and the hosted endpoint.
- **MCP instructions.** Both transports now return server-wide guidance at
  initialization, carrying the tool-choice rule. Prompts turned out to be
  reachable only in VS Code, so this is how the rule gets to everyone else.
- **Claude Code plugin.** `/plugin marketplace add clouddrove/vanisec` then
  `/plugin install vanisec@vanisec` installs the MCP server and the skills
  together.
- **`/integrations` page**, rendered from the files in `skills/` and
  `integrations/` rather than a copy of them.
- **Install instructions for every MCP client**, in `mcp/README.md` and on
  `/mcp`: Cursor, VS Code with Copilot, the Copilot CLI and cloud agent, the
  JetBrains family, Codex, Windsurf and Devin Local, and Zed. The top-level
  configuration key differs four ways between them and a wrong one fails
  silently, so each client gets its own verified block.
- **Helm: sensitive values can be sourced from a Kubernetes Secret.**
  `secrets.create` has the chart render one from `secrets.data`, and
  `secrets.existingSecret` points it at a Secret you manage yourself with
  sealed-secrets, external-secrets or vault. Anything listed in `secrets.keys`
  is delivered with `secretKeyRef` and left out of the Deployment's plain `env`,
  so a value is never rendered in both forms, and a values file that says both
  stops the render instead of picking a winner. The embedded Redis reads the
  same Secret, so its password no longer sits in the pod spec either. Off by
  default: an existing values file that sets `env.REDIS_PASSWORD` keeps working
  and upgrading needs no change.

### Changed

- `vanisec_generate_secret` now states that the link and its password must
  travel through different channels, in both its description and its result. It
  has no password parameter, so unlike `vanisec_create_secret` it had nowhere to
  carry that rule.

### Fixed

- **The hosted MCP endpoint negotiates its protocol revision.** `/api/mcp`
  answered a fixed `2024-11-05` to every client without ever reading
  `params.protocolVersion`, so the two transports disagreed about what Vanisec
  speaks: the stdio server negotiates through the SDK, the endpoint did not
  negotiate at all. It now supports `2025-11-25`, `2025-06-18`, `2025-03-26` and
  `2024-11-05`, echoes back whichever of those the client asks for, and answers
  `2025-11-25` to anything else. The list stops there because `2026-07-28`, the
  current revision, replaced the initialize handshake with per-request metadata
  and a mandatory `server/discover`. Claiming `2025-06-18` also meant
  implementing what it made binding: an unsupported `MCP-Protocol-Version`
  header is now `400`, and an absent one is served rather than rejected. An
  invalid `Origin` is now `403`, which `2025-11-25` requires; clients send no
  `Origin`, so only browsers are affected and none could read an answer from
  here anyway.
- **A `GET` on the hosted MCP endpoint explains itself.** Probing for an SSE
  stream returned a bare `405`, which does not tell a client whether the
  endpoint is broken, moved or simply JSON only. The status and the `Allow`
  header are unchanged, since the Streamable HTTP transport lets a server
  decline the stream, but the body is now a JSON-RPC error saying so. A batched
  array body is likewise refused by name instead of falling through to
  "Invalid Request".
- **Self-hosted builds no longer report analytics to CloudDrove.** `.env` was
  committed with `NEXT_PUBLIC_GA_ID` set to our own measurement ID, and Next
  inlines `NEXT_PUBLIC_*` into the client bundle at build time, so every build
  made from this repository shipped it. Setting `GA_ID` at run time did not help,
  because a build-time id takes precedence in `GoogleAnalytics.tsx`. The values
  in `.env` are now empty and `docker-compose.yml` no longer defaults `GA_ID`.
  Anyone running their own instance should rebuild. Analytics is now off unless
  the operator sets an id.
- **Helm: the app Service no longer matches the embedded Redis pods.** It
  selected on name and instance only, which the Redis pods also carry, so with
  `redis.enabled: true` a share of HTTP traffic was routed to a pod that does not
  speak HTTP. App pods now carry `app.kubernetes.io/component: app` and the
  Service selects on it. The Deployment's own selector is unchanged, so this
  upgrades in place.
- **Helm: `redis.password` now reaches the app.** It put `--requirepass` on the
  embedded Redis while the app read `REDIS_PASSWORD` only from
  `env.REDIS_PASSWORD`, so setting it alone locked the app out of its own Redis.
  `env.REDIS_PASSWORD` still wins where both are set.
- **Helm: `TRUSTED_PROXY_HOPS` is now templated.** It was in neither
  `values.yaml` nor the Deployment, so a chart install always ran on the value
  baked into the image with no way to change it through values. The setting
  decides which entry of `X-Forwarded-For` rate limiting treats as the client
  address: too high and that entry is one the caller supplied, so a single
  client can forge unlimited identities and rate limiting stops applying; too
  low and everyone behind the proxy shares one bucket, so one noisy client can
  rate-limit every other user. It defaults to `1`, the value the app already
  assumed, so nothing changes for an existing install.
- The published `bin` path no longer carries a leading `./`.

## [2.0.0] - 2026-08-19

Zero-knowledge rewrite plus a security hardening pass. The server no longer sees
plaintext, and the HTTP API changed shape as a result.

### Breaking

- **Storage model.** Secrets are encrypted in the browser and the server stores
  only ciphertext. Secrets created before this release cannot be decrypted after
  upgrading — rotate any outstanding links first.
- **`POST /api/secrets` request body.** Now takes `ciphertext`, `iv`,
  `passwordProtected`, `encSalt`, `authSalt`, `verifier`, `iterations` and
  `expiresIn`. The previous `{ secret, password, expiresIn }` body is rejected
  with `400`.
- **`iterations` is validated.** A value below 600000 is rejected, so a modified
  client cannot downgrade the key-derivation cost.
- **`GET /api/secrets/:id`** no longer returns `encSalt` in its `401`. It returns
  `authSalt` and `iterations` only; `encSalt` arrives with the successful `POST`
  once the verifier is accepted.
- **A password is required** on every secret.

Note: the in-app API documentation at `/api` still describes the pre-encryption
request body and has not yet been updated.

### Added

- Zero-knowledge client-side encryption: AES-GCM with a PBKDF2-derived key, text
  and file bundled into one encrypted envelope (#56)
- One-way retrieval verifier, separately salted. The server stores only
  `sha256(verifier)` and compares with `timingSafeEqual`, so a wrong password
  does not consume the secret (#56)
- Atomic `GETDEL` retrieval, making the one-time guarantee race-safe (#56)
- Rate limiting on retrieval, per secret and per IP, closing an unlimited online
  password oracle (#79)
- Security headers: CSP, `X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy`, HSTS; `no-store` on the secrets API
  (#79)
- Nonce-based CSP on `/secret`, removing `script-src 'unsafe-inline'` from the
  route that renders decrypted secrets (#80)
- `TRUSTED_PROXY_HOPS` and `REDIS_DB` environment variables, documented in the
  README (#79)
- ESLint now runs in CI (#76)

### Changed

- PBKDF2 raised from 210,000 to 600,000 iterations, OWASP's current floor. The
  work factor is stored per secret, so secrets written at the old value still
  decrypt (#79)
- Migrated to ESLint flat config on ESLint 9. Held at 9.x because
  `eslint-plugin-react` peers at `^9.7` and crashes under ESLint 10 (#78, #83)
- `npm run lint` now invokes `eslint .`; `next lint` was removed in Next 16 (#75)
- The Docker build copies the source tree rather than enumerating paths (#82)

### Fixed

- Dependabot auto-merge never ran: the wait step matched the workflow name
  instead of the job id, and repository auto-merge was disabled (#72, #79)
- Rate limiting could be bypassed by forging `X-Forwarded-For`; the client IP is
  now read from the right using the trusted hop count (#79)
- Payload size is checked from `Content-Length` before the body is parsed (#79)
- Google Fonts was blocked by the new CSP on every page (#80)
- `middleware.ts` was missing from the Docker image, so `/secret` shipped with no
  CSP at all (#81)
- A hardcoded `db: 3` overrode any database selected in `REDIS_URL` (#79)
- 29 `react/no-unescaped-entities` errors, previously hidden by the broken lint
  script (#75)

### Security

- All 17 open Dependabot alerts resolved: `next` (SSRF, middleware bypass, DoS,
  cache confusion), `postcss` (path traversal), `nanoid`, `js-yaml`,
  `brace-expansion`, `sharp`

### Dependencies

- `next` 16.2.9 → 16.3.0, `postcss` → 8.5.26, `nanoid` → 3.3.18
- `eslint` 8.57 → 9.39.5, `eslint-config-next` 15 → 16.3.1, `autoprefixer` → 10.5.4
- `uuid` → 14, `ioredis` → 5.11.1, Node base image → 26-alpine
- `js-yaml` → 4.3.1, `brace-expansion` → 1.1.18 / 5.0.9 via scoped overrides
- GitHub Actions: `actions/checkout` → 7, `dependabot/fetch-metadata` → 3,
  `lewagon/wait-on-check-action` → 1.9.1

## [1.2.0] - 2026-04-03

### Added
- File upload support (up to 5MB) for sharing documents, keys, and configs alongside secret text
- Comparison pages: `/compare/onetimesecret` and `/compare/privatebin` for SEO
- Cross-link sections on About, Security, Docs, and FAQ pages for better internal linking
- "Why Open Source" section and expanded content on About page
- All 12 FAQs now included in FAQPage JSON-LD structured data (was 5)
- OG image (1200x630) and Apple Touch Icon (180x180) for social sharing and iOS bookmarks
- File Upload added as 5th feature card on homepage

### Changed
- Differentiated website copy from OneTimeSecret (rewrote Footer tagline, Features, HowItWorks, StructuredData descriptions)
- Shortened title template from `%s | Vanisec - Designed to vanish` to `%s | Vanisec` for better SEO keyword space
- Fixed canonical URLs — each page now has its own canonical (was all pointing to homepage)
- Fixed sitemap — removed ghost `/features` route, added `/docs`, `/faq`, `/api`, comparison pages
- Removed misleading SearchAction schema (no search functionality exists)
- Improved responsive design: touch targets (48px min), responsive spacing, heading sizes, mobile nav
- Fixed copy-link layout to stack on small screens
- Made API code blocks font-size responsive
- Added `aria-hidden` to decorative SVG icons and `aria-label` to header logo

### Security
- Fixed all npm audit vulnerabilities (ajv, brace-expansion, glob, picomatch)
- Updated `eslint-config-next` to v16.2.2

## [1.1.0] - 2026-03-17

### Added
- Password is now required when creating a secret (enforced on both frontend and API)
- Google Analytics support via `GA_ID` / `NEXT_PUBLIC_GA_ID` environment variables
- Python example added to API documentation
- "Who Uses Vanisec" section added to homepage use cases

### Changed
- Rewrote all website copy across every page for clearer, more natural language
- Improved Features, How It Works, and Use Cases sections on homepage
- Updated API docs with better descriptions and additional code examples
- Improved best practices guidance in Documentation page

### Security
- Bumped Next.js from 16.1.6 to 16.1.7 (fixes CVE-2026-27977, CVE-2026-27978, CVE-2026-27979, CVE-2026-27980, CVE-2026-29057)

### Dependencies
- Bumped `ioredis` to 5.10.0
- Bumped `minimatch` (security patch)
- Bumped `docker/setup-buildx-action` from 3 to 4
- Bumped `docker/login-action` from 3 to 4
- Bumped `docker/build-push-action` from 6 to 7
- Bumped `docker/metadata-action` from 5 to 6
- Updated development dependencies (`@types/node`, `typescript`, `eslint-config-next`)

## [1.0.0] - 2025-01-13

### Added
- Initial release of Vanisec
- One-time secret sharing functionality
- Password protection for secrets
- Configurable expiration times (1 hour to 7 days)
- Redis-based storage with automatic expiration
- Docker Compose setup for easy deployment
- Helm chart for Kubernetes deployment
- GitHub Actions CI/CD workflows
- Dependabot configuration with auto-merge
- Modern UI with glass morphism effects
- Responsive design for all devices
- SEO-friendly sitemap and robots.txt
- Production-ready Docker builds

### Security
- Non-root user execution
- Secure secret handling with one-time view
- Automatic secret deletion after viewing
- Redis TTL for automatic cleanup

