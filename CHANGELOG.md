# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

