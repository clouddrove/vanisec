# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

