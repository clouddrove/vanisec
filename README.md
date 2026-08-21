<p align="center">
  <img src="public/favicon.svg" width="80" height="80" alt="Vanisec logo" />
</p>

<h1 align="center">Vanisec</h1>
<p align="center"><strong>Designed to vanish</strong></p>
<p align="center">A secure, open-source one-time secret sharing platform built with modern web technologies.</p>

<p align="center">
  <a href="https://github.com/clouddrove/vanisec/actions/workflows/build-and-push.yml"><img src="https://github.com/clouddrove/vanisec/actions/workflows/build-and-push.yml/badge.svg" alt="Build Status" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License" /></a>
  <a href="https://github.com/clouddrove/vanisec/pkgs/container/vanisec"><img src="https://img.shields.io/badge/docker-ghcr.io%2Fclouddrove%2Fvanisec-blue" alt="Docker Image" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.2-blue" alt="TypeScript" /></a>
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-16.1-black" alt="Next.js" /></a>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#documentation">Documentation</a> •
  <a href="#contributing">Contributing</a> •
  <a href="#license">License</a>
</p>

---

## Overview

Vanisec provides a production-grade, open-source solution for ephemeral secret sharing. Exchange sensitive data including passwords, API keys, authentication credentials, or confidential information via encrypted links designed for single-use access with automatic deletion.

### Why Choose Vanisec?

- 🔒 **Zero-Knowledge**: Secrets are encrypted in your browser; the server only ever stores ciphertext, deleted immediately after access
- ⚡ **Zero Friction**: No registration, authentication, or account management required
- 🚀 **Enterprise-Grade**: Production-optimized container builds with comprehensive Kubernetes support
- 🎨 **Polished Interface**: Modern, responsive design featuring CloudDrove's visual identity
- 📦 **Self-Hostable**: Complete infrastructure control and data sovereignty
- 🌐 **Open Source**: MIT-licensed with active community participation

## Features

### Core Functionality

- **One-Time Access**: Secrets can only be viewed once and are immediately deleted after viewing
- **Password Protection**: Every secret is protected by a password that never leaves your browser — it derives the encryption key (PBKDF2) and gates retrieval via a one-way verifier
- **Configurable Expiration**: Set expiration times from 1 hour to 7 days (default: 24 hours)
- **Automatic Cleanup**: Redis TTL ensures expired secrets are automatically removed
- **Unique URLs**: Cryptographically secure, unguessable secret identifiers
- **Clipboard**: Paste text or a file at `/clipboard`, get a short code, and open it on any other device. No password and no login: the code itself derives the encryption key in your browser and is never sent to the server
- **Pairing Codes**: Hand a secret to your own phone by typing a short code at `/c` instead of retyping a URL. Codes last five minutes, work once, and still require the password

### Technical Features

- **Modern Stack**: Built with Next.js 16, TypeScript, and Tailwind CSS
- **Containerized**: Optimized multi-stage Docker builds with BuildKit caching
- **Kubernetes Ready**: Production-ready Helm charts included
- **CI/CD**: Automated builds and deployments via GitHub Actions
- **Type Safe**: Full TypeScript coverage for reliability
- **SEO Optimized**: Comprehensive metadata, structured data, and sitemap generation

### Security Features

- **Zero-Knowledge Storage**: Secrets are AES-GCM encrypted in the browser before upload; the server and Redis only ever hold ciphertext — never plaintext, filenames, or passwords
- **No Persistence**: Secrets are never logged or stored permanently
- **Automatic Deletion**: Immediate removal after viewing or expiration
- **Non-Root Execution**: Docker containers run with minimal privileges
- **Health Monitoring**: Built-in health checks and monitoring

## Table of Contents

- [Quick Start](#quick-start)
  - [Docker Compose](#docker-compose)
  - [Local Development](#local-development)
  - [Kubernetes Deployment](#kubernetes-deployment)
- [Use it from your AI client](#use-it-from-your-ai-client)
- [Architecture](#architecture)
- [Configuration](#configuration)
- [Development](#development)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)

## Quick Start

### Docker Compose (Recommended)

The fastest way to get started with Vanisec:

```bash
# Enable BuildKit for faster builds (optional but recommended)
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Build and start services
docker-compose up -d --build

# View logs
docker-compose logs -f app
```

The application will be available at [http://localhost:3000](http://localhost:3000).

**Common Commands:**

```bash
# Stop services
docker-compose down

# View logs
docker-compose logs -f app
docker-compose logs -f redis

# Rebuild after changes
docker-compose up -d --build

# Remove volumes (clears Redis data)
docker-compose down -v
```

### Local Development

#### Prerequisites

- **Node.js**: 20.x or higher
- **Redis**: 7.x or higher (or use Docker for Redis only)

#### Installation

```bash
# Clone the repository
git clone https://github.com/clouddrove/vanisec.git
cd vanisec

# Install dependencies
npm install

# Start Redis (if not using Docker)
docker run -d -p 6379:6379 redis:7-alpine

# Or install Redis locally
redis-server
```

#### Environment Setup

Create a `.env.local` file:

```env
REDIS_URL=redis://localhost:6379/3
NEXT_PUBLIC_BASE_URL=http://localhost:3000
GA_ID=G-XXXXXXXXXX  # Optional: Google Analytics (runtime)
```

#### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

#### Build for Production

```bash
npm run build
npm start
```

### Kubernetes Deployment

Vanisec includes production-ready Helm charts for Kubernetes deployment.

#### Prerequisites

- Kubernetes cluster (1.19+)
- Helm 3.x
- kubectl configured

#### Installation

```bash
# Install with default values
helm install vanisec ./_infra/helm/vanisec

# Or install with custom values
helm install vanisec ./_infra/helm/vanisec -f my-values.yaml

# Upgrade existing installation
helm upgrade vanisec ./_infra/helm/vanisec
```

#### Configuration

Edit `_infra/helm/vanisec/values.yaml` to customize:

- Replica count and autoscaling
- Image repository and tag
- Resource limits and requests
- Redis configuration (embedded or external)
- Ingress settings and TLS
- Environment variables

#### Redis Configuration

Vanisec supports two Redis deployment modes:

**Option 1: Embedded Redis (Default)**

Redis is deployed as part of the Helm chart:

```yaml
redis:
  enabled: true  # Deploy Redis with the application
  password: ""   # Optional: Set password for Redis authentication
  persistence:
    enabled: true
    size: 8Gi

env:
  REDIS_URL: "redis://vanisec-redis:6379/3"  # Points to embedded Redis
  REDIS_PASSWORD: ""  # Optional: Redis password
```

**Option 2: External Redis**

Use an existing Redis instance (managed service, external cluster, etc.):

```yaml
redis:
  enabled: false  # Disable embedded Redis deployment

env:
  # Point to your external Redis instance
  REDIS_URL: "redis://external-redis.example.com:6379/3"
  # Or with password:
  # REDIS_URL: "redis://:password@external-redis.example.com:6379/3"
  # Or using Kubernetes service:
  # REDIS_URL: "redis://redis-service.namespace.svc.cluster.local:6379/3"
  REDIS_PASSWORD: ""  # Optional: Set if not included in URL
```

**Example: Using External Redis in Kubernetes**

```yaml
redis:
  enabled: false  # Don't deploy Redis

env:
  # Connect to Redis in another namespace
  REDIS_URL: "redis://redis.default.svc.cluster.local:6379/3"
  REDIS_PASSWORD: "your-redis-password"
```

**Example: Using Managed Redis Service (AWS ElastiCache, Azure Cache, etc.)**

```yaml
redis:
  enabled: false

env:
  # Connect to managed Redis service
  REDIS_URL: "redis://your-redis-cluster.cache.amazonaws.com:6379/3"
  REDIS_PASSWORD: "your-secure-password"
```

#### Example Custom Values (Embedded Redis)

```yaml
replicaCount: 3

image:
  repository: ghcr.io/clouddrove/vanisec
  tag: "latest"

redis:
  enabled: true
  password: "secure-redis-password"
  persistence:
    enabled: true
    size: 8Gi

ingress:
  enabled: true
  className: "nginx"
  hosts:
    - host: vanisec.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: vanisec-tls
      hosts:
        - vanisec.example.com

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 80

env:
  NEXT_PUBLIC_BASE_URL: "https://vanisec.example.com"
  REDIS_URL: "redis://vanisec-redis:6379/3"
  REDIS_PASSWORD: "secure-redis-password"
```

## Use it from your AI client

Handing a credential to someone while working in an AI client usually means
pasting it into the conversation, where the transcript keeps it. Vanisec ships an
MCP server so you can create a one-time link instead, and a set of rules that
tell the model which of the two tools to reach for.

### The MCP server

```bash
claude mcp add vanisec -- npx -y @clouddrove/vanisec-mcp
```

Two tools. `vanisec_generate_secret` creates the value on your own machine and
puts the link password on your clipboard, so neither ever enters the
conversation. `vanisec_create_secret` takes a secret you already have, which
means both it and the password stay in the transcript. Prefer the first wherever
the secret does not exist yet.

There is deliberately no retrieval tool. A retrieved secret would land in the
transcript, and a one-time secret would stop being one-time in any useful sense.

Requires Node 22 or newer. A hosted endpoint is also available at
`/api/mcp` for clients that can only use remote servers, but it encrypts server
side and is not zero-knowledge, so it is a fallback rather than the default.

Install instructions for Cursor, VS Code with Copilot, the Copilot CLI and cloud
agent, Codex, Windsurf, Zed and the JetBrains family are in
[mcp/README.md](mcp/README.md). The top-level configuration key differs between
clients and a wrong one fails silently, so use the block for your client rather
than adapting another.

### The rules

The guidance lives in [skills/](skills/) as Agent Skills, which Claude Code,
Cursor and Codex all load, since they share the same `SKILL.md` format.

For clients that read something else, [integrations/](integrations/) carries the
same rules as Cursor rules, GitHub Copilot instructions and prompt files, and
`AGENTS.md`. Those files are meant to be copied into your own repository. They
are not applied to Vanisec itself.

### Everything at once

```
/plugin marketplace add clouddrove/vanisec
/plugin install vanisec@vanisec
```

That installs the MCP server and the skills together in Claude Code.

Browse it all at [vanisec.clouddrove.com/integrations](https://vanisec.clouddrove.com/integrations).

## Architecture

### System Overview

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────────────────────────┐
│      Next.js Application        │
│  ┌───────────────────────────┐  │
│  │   API Routes              │  │
│  │   - /api/secrets          │  │
│  │   - /api/secrets/[id]    │  │
│  │   - /api/pair             │  │
│  │   - /api/pair/redeem      │  │
│  │   - /api/clip             │  │
│  │   - /api/clip/open        │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │   Secret Management       │  │
│  │   - Encryption            │  │
│  │   - UUID Generation       │  │
│  │   - TTL Management        │  │
│  └───────────────────────────┘  │
└───────────┬─────────────────────┘
            │
            │ Redis Protocol
            ▼
┌─────────────────────────┐
│   Redis (Database 3)    │
│  ┌───────────────────┐  │
│  │  Secret Storage   │  │
│  │  - Encrypted Data │  │
│  │  - TTL Expiration │  │
│  │  - Auto Cleanup   │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

### Data Flow

1. **Secret Creation**: Secret encrypted in the browser (AES-GCM) → ciphertext uploaded → Stored in Redis with TTL → Unique URL generated
2. **Secret Access**: URL accessed → password verifier checked → ciphertext atomically fetched-and-deleted (GETDEL) → decrypted in the browser → displayed once
3. **Expiration**: Redis TTL expires → Secret automatically removed

### Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| **Framework** | Next.js | 16.1+ |
| **Language** | TypeScript | 5.2+ |
| **Styling** | Tailwind CSS | 3.3+ |
| **Database** | Redis | 7.x |
| **Container** | Docker | Latest |
| **Orchestration** | Kubernetes + Helm | 1.19+ |

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|----------|----------|
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379/3` | Yes |
| `REDIS_PASSWORD` | Redis password (if authentication enabled) | - | No |
| `REDIS_DB` | Redis database index. Ignored when `REDIS_URL` already selects one | `3` | No |
| `TRUSTED_PROXY_HOPS` | Number of reverse proxies in front of the app. See below | `1` | No |
| `NEXT_PUBLIC_BASE_URL` | Base URL for the application | `https://vanisec.clouddrove.com` | No |
| `GA_ID` | Google Analytics Measurement ID (runtime; no rebuild needed) | - | No |
| `NEXT_PUBLIC_GA_ID` | Google Analytics Measurement ID (build-time alternative) | - | No |
| `NODE_ENV` | Environment mode | `production` | No |

**`TRUSTED_PROXY_HOPS` — set this to match your deployment.**

Rate limiting identifies clients by IP, read from `X-Forwarded-For`. Each proxy
appends to that header, so only the rightmost entries are trustworthy; anything
further left was supplied by the caller and can be forged. The app reads the
Nth entry from the right, where N is `TRUSTED_PROXY_HOPS`.

| Deployment | Value |
|------------|-------|
| Single ingress / load balancer (default) | `1` |
| CDN in front of an ingress (e.g. Cloudflare → nginx) | `2` |
| No proxy, app exposed directly | `1` |

Setting it **too high** reads an entry the client controls, letting one caller
forge unlimited identities and bypass rate limiting. Setting it **too low**
buckets everyone behind the proxy together, so one noisy client can rate-limit
everyone else. Count your actual hops.

**Redis URL Format:**

```
redis://[password@]host:port[/database]
redis://localhost:6379/3
redis://:password@redis.example.com:6379/3
```

### Docker Configuration

The `docker-compose.yml` includes:

- **Redis**: Persistent storage with AOF enabled
- **App**: Production-optimized Next.js build
- **Networks**: Isolated Docker network
- **Health Checks**: Automatic container health monitoring
- **Restart Policies**: Automatic restart on failure

### Helm Configuration

Key configuration options in `_infra/helm/vanisec/values.yaml`:

- **Replicas**: Number of application instances
- **Resources**: CPU and memory limits
- **Redis**: 
  - `redis.enabled: true` - Deploy embedded Redis (default)
  - `redis.enabled: false` - Use external Redis (set `REDIS_URL` accordingly)
- **Ingress**: TLS termination and routing
- **Autoscaling**: Horizontal Pod Autoscaler settings
- **Secrets**: source sensitive values from a Kubernetes Secret rather than
  plain Deployment env, either one the chart creates or one you already manage:
  - `secrets.create: true` with `secrets.data.REDIS_PASSWORD` renders a Secret
    from your values. The value still passes through the values file and
    `helm get values`, so this keeps it out of the Deployment spec and out of a
    GitOps repo, not out of Helm.
  - `secrets.existingSecret: my-secret` references a Secret you manage yourself,
    which is the option to use if the value must never reach Helm at all.
  - The two are mutually exclusive, and a value is never rendered in both a
    Secret and plain env. Conflicting configuration fails the render rather than
    quietly picking one.
  - The embedded Redis reads the same Secret, so it stays password protected.
- **`TRUSTED_PROXY_HOPS`**: set it through `env.TRUSTED_PROXY_HOPS` to match the
  number of proxies that append to `X-Forwarded-For` in front of the app. Too
  high is the dangerous direction: it selects an entry the caller supplied, so
  rate limiting can be bypassed. Too low only makes clients share a bucket.

**Redis Deployment Modes:**

1. **Embedded Redis** (`redis.enabled: true`): Redis is deployed as part of the Helm release
   - Suitable for: Development, small deployments, single-tenant
   - Benefits: Simple setup, no external dependencies
   
2. **External Redis** (`redis.enabled: false`): Connect to existing Redis instance
   - Suitable for: Production, high availability, managed services
   - Benefits: Better performance, shared infrastructure, managed backups

## Documentation

- **In-app**: Run the app and visit `/docs`, `/api`, `/faq` for usage and API details
- **Contributing**: [CONTRIBUTING.md](CONTRIBUTING.md)
- **Changelog**: [CHANGELOG.md](CHANGELOG.md)

## Development

### Project Structure

```
vanisec/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── secret/            # Secret viewing pages
│   └── layout.tsx         # Root layout
├── components/             # React components
│   ├── SecretForm.tsx    # Secret creation form
│   ├── Header.tsx        # Navigation header
│   └── Footer.tsx        # Site footer
├── lib/                   # Utility libraries
│   ├── redis.ts          # Redis client
│   ├── rateLimit.ts      # Client IP resolution and rate limiting
│   └── secrets.ts        # Secret management
├── proxy.ts               # Nonce-based CSP for /secret (Next 16 proxy convention)
├── test/                  # Root test suite
│   └── integration/      # Tests needing a real Redis, excluded by default
├── mcp/                   # @clouddrove/vanisec-mcp, published separately
├── skills/                # Agent Skills for AI clients
├── integrations/          # The same rules for Cursor, Copilot and AGENTS.md
├── _infra/                # Infrastructure as Code
│   └── helm/             # Kubernetes Helm charts
│       └── vanisec/      # Helm chart
├── .github/               # GitHub Actions workflows
│   └── workflows/        # CI/CD pipelines
└── public/               # Static assets
```

### Development Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Linting
npm run lint

# Tests
npm test
```

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Next.js recommended rules
- **Formatting**: Prettier (via ESLint)
- **Imports**: Absolute imports with `@/` prefix

### Testing

```bash
# Root suite: API routes, rate limiting, the hosted MCP endpoint
npm test

# The published MCP package, which builds and tests on its own
cd mcp && npm test
```

The root suite needs no Redis. `ioredis` is redirected to an in-memory stand-in
through a module resolve hook, so `lib/redis.ts`, `lib/rateLimit.ts` and
`lib/secrets.ts` run unmodified.

Tests that genuinely need a real Redis live in `test/integration/` and are
excluded from `npm test`, since they require Docker:

```bash
npm run test:integration
```

`mcp/` is published to npm on its own and its CI job installs only that
directory, so nothing under `mcp/` may import from the app. To check that still
holds, copy the repository somewhere with no `node_modules`, run `npm ci` inside
`mcp/` alone, then `npm run typecheck` and `npm test` there.

## Deployment

### Docker Registry

Images are automatically built and pushed to GitHub Container Registry:

```bash
# Pull latest image
docker pull ghcr.io/clouddrove/vanisec:latest

# Pull specific version
docker pull ghcr.io/clouddrove/vanisec:06b08d1
```

### CI/CD Pipeline

GitHub Actions workflows:

- **Build and Push**: Automatic Docker builds on push to `master`
- **Dependabot**: Automated dependency updates
- **Auto-Merge**: Automatic PR merging when CI passes

### Production Checklist

- [ ] Set `NEXT_PUBLIC_BASE_URL` to your domain
- [ ] Configure Redis password authentication
- [ ] Enable TLS/HTTPS via ingress or reverse proxy
- [ ] Set appropriate resource limits
- [ ] Configure monitoring and alerting
- [ ] Review security settings
- [ ] Set up backup strategy for Redis (if needed)

## Contributing

Contributions are essential for Vanisec's growth. See our [Contributing Guide](CONTRIBUTING.md) for complete details.

### Getting Started

1. Fork the repository to your account
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Implement your changes
4. Run validation: `npm run lint && npm test && npm run build`
5. Commit with descriptive messages: `git commit -m 'feat: Add new feature'`
6. Push to your fork: `git push origin feature/your-feature-name`
7. Submit a pull request with a clear description

### Contribution Guidelines

- Maintain TypeScript type safety and best practices
- Use conventional commit message format
- Update relevant documentation alongside code changes
- Include appropriate tests for new functionality
- Verify all linting and build checks pass before submitting

## Security

### Vulnerability Reporting

Security is a top priority for Vanisec. To report a security vulnerability:

1. **Do not** create a public GitHub issue
2. Send details via email to: **security@clouddrove.com**
3. Provide detailed steps to reproduce the issue
4. Include potential impact assessment if possible
5. Expect a response within 48 hours acknowledging receipt

### Security Features

- **Encryption**: Secrets are AES-GCM encrypted in the browser; the server stores only ciphertext (zero-knowledge), atomically deleted on first view
- **No Logging**: Secrets are never logged or persisted
- **Automatic Deletion**: Immediate removal after viewing
- **TTL Expiration**: Automatic cleanup of expired secrets
- **Non-Root Execution**: Containers run with minimal privileges
- **Input Validation**: All inputs are validated and sanitized

### Best Practices

- Use HTTPS in production
- Enable Redis password authentication
- Regularly update dependencies
- Monitor for security advisories
- Review access logs regularly

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

Vanisec leverages several excellent open-source technologies:

- **Next.js** - React framework powering the application
- **Tailwind CSS** - Utility-first CSS framework for styling
- **Redis** - In-memory data store for ephemeral secret storage
- **GitHub Container Registry** - Container image hosting and distribution

## Support

- **Documentation**: See [Documentation](https://github.com/clouddrove/vanisec/wiki)
- **Issues**: [GitHub Issues](https://github.com/clouddrove/vanisec/issues)
- **Discussions**: [GitHub Discussions](https://github.com/clouddrove/vanisec/discussions)
- **Security**: security@clouddrove.com

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed list of changes and version history.

---

<p align="center">
  <strong>Made with ❤️ by <a href="https://clouddrove.com">CloudDrove</a></strong><br />
  <a href="https://clouddrove.com">Website</a> •
  <a href="https://github.com/clouddrove">GitHub</a> •
  <a href="https://twitter.com/clouddrove">Twitter</a>
</p>
