# Vanisec

<div align="center">

**Designed to vanish**

A secure, open-source one-time secret sharing platform built with modern web technologies.

[![Build Status](https://github.com/clouddrove/vanisec/actions/workflows/build-and-push.yml/badge.svg)](https://github.com/clouddrove/vanisec/actions/workflows/build-and-push.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Docker Image](https://img.shields.io/badge/docker-ghcr.io%2Fclouddrove%2Fvanisec-blue)](https://github.com/clouddrove/vanisec/pkgs/container/vanisec)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.1-black)](https://nextjs.org/)

[Features](#features) • [Quick Start](#quick-start) • [Documentation](#documentation) • [Contributing](#contributing) • [License](#license)

</div>

---

## Overview

Vanisec provides a production-grade, open-source solution for ephemeral secret sharing. Exchange sensitive data including passwords, API keys, authentication credentials, or confidential information via encrypted links designed for single-use access with automatic deletion.

### Why Choose Vanisec?

- 🔒 **Security-Focused**: Implements end-to-end encryption with immediate deletion after access
- ⚡ **Zero Friction**: No registration, authentication, or account management required
- 🚀 **Enterprise-Grade**: Production-optimized container builds with comprehensive Kubernetes support
- 🎨 **Polished Interface**: Modern, responsive design featuring CloudDrove's visual identity
- 📦 **Self-Hostable**: Complete infrastructure control and data sovereignty
- 🌐 **Open Source**: MIT-licensed with active community participation

## Features

### Core Functionality

- **One-Time Access**: Secrets can only be viewed once and are immediately deleted after viewing
- **Password Protection**: Optional password protection for an additional layer of security
- **Configurable Expiration**: Set expiration times from 1 hour to 7 days (default: 24 hours)
- **Automatic Cleanup**: Redis TTL ensures expired secrets are automatically removed
- **Unique URLs**: Cryptographically secure, unguessable secret identifiers

### Technical Features

- **Modern Stack**: Built with Next.js 16, TypeScript, and Tailwind CSS
- **Containerized**: Optimized multi-stage Docker builds with BuildKit caching
- **Kubernetes Ready**: Production-ready Helm charts included
- **CI/CD**: Automated builds and deployments via GitHub Actions
- **Type Safe**: Full TypeScript coverage for reliability
- **SEO Optimized**: Comprehensive metadata, structured data, and sitemap generation

### Security Features

- **Encrypted Storage**: Secrets are encrypted before storage
- **No Persistence**: Secrets are never logged or stored permanently
- **Automatic Deletion**: Immediate removal after viewing or expiration
- **Non-Root Execution**: Docker containers run with minimal privileges
- **Health Monitoring**: Built-in health checks and monitoring

## Table of Contents

- [Quick Start](#quick-start)
  - [Docker Compose](#docker-compose)
  - [Local Development](#local-development)
  - [Kubernetes Deployment](#kubernetes-deployment)
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
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX  # Optional: Google Analytics
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

1. **Secret Creation**: User submits secret → Encrypted → Stored in Redis with TTL → Unique URL generated
2. **Secret Access**: URL accessed → Secret retrieved → Displayed once → Immediately deleted
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
| `NEXT_PUBLIC_BASE_URL` | Base URL for the application | `https://vanisec.clouddrove.com` | No |
| `NEXT_PUBLIC_GA_ID` | Google Analytics Measurement ID | - | No |
| `NODE_ENV` | Environment mode | `production` | No |

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

**Redis Deployment Modes:**

1. **Embedded Redis** (`redis.enabled: true`): Redis is deployed as part of the Helm release
   - Suitable for: Development, small deployments, single-tenant
   - Benefits: Simple setup, no external dependencies
   
2. **External Redis** (`redis.enabled: false`): Connect to existing Redis instance
   - Suitable for: Production, high availability, managed services
   - Benefits: Better performance, shared infrastructure, managed backups

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
│   └── secrets.ts        # Secret management
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
```

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Next.js recommended rules
- **Formatting**: Prettier (via ESLint)
- **Imports**: Absolute imports with `@/` prefix

### Testing

```bash
# Run linter
npm run lint

# Type checking (via TypeScript)
npm run build
```

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
4. Run validation: `npm run lint && npm run build`
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

- **Encryption**: Secrets are encrypted before storage
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

<div align="center">

**Made with ❤️ by [CloudDrove](https://clouddrove.com)**

[Website](https://clouddrove.com) • [GitHub](https://github.com/clouddrove) • [Twitter](https://twitter.com/clouddrove)

</div>
