# Tessera

**Share once. Vanish forever.**

A secure, one-time secret sharing application built with Next.js, featuring the CloudDrove brand design.

[![CI](https://github.com/clouddrove/tessera/actions/workflows/ci.yml/badge.svg)](https://github.com/clouddrove/tessera/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Features

- **One-Time View**: Secrets can only be viewed once and are automatically deleted after viewing
- **Password Protection**: Optional password protection for enhanced security
- **Configurable Expiration**: Set expiration times from 1 hour to 7 days
- **CloudDrove Design**: Minimalist UI matching CloudDrove brand colors (#909090, #232323)
- **Fully Responsive**: Optimized for all devices and screen sizes
- **Production Ready**: Built with security and scalability in mind

## Quick Start

### Docker Compose

Start the application with a single command:

```bash
docker-compose up -d --build
```

The application will be available at [http://localhost:3000](http://localhost:3000).

**Common Commands**

```bash
# Stop services
docker-compose down

# View logs
docker-compose logs -f app

# Rebuild after changes
docker-compose up -d --build
```

### Local Development

#### Prerequisites

- Node.js 20 or higher
- Redis server running (or use Docker Compose for Redis only)

#### Install Dependencies

```bash
npm install
```

#### Start Redis (if not using Docker)

```bash
# Using Docker for Redis only
docker run -d -p 6379:6379 redis:7-alpine

# Or install Redis locally and run:
redis-server
```

#### Set Environment Variables

Create a `.env.local` file:

```env
REDIS_URL=redis://localhost:6379/3
```

#### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Technology Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Redis** - In-memory data store with automatic expiration
- **Docker** - Containerization and orchestration
- **Helm** - Kubernetes package manager
- **GitHub Actions** - CI/CD automation

## Design System

**Colors**
- Light Gray: `#909090`
- Dark Gray: `#232323`

**Typography**
- Font Family: Poppins (Google Fonts)
- Weight: 300, 400, 500, 600, 700

## Architecture

1. **Secret Creation**: User submits a secret with optional password and expiration time
2. **Link Generation**: System generates a unique, unguessable URL
3. **One-Time Access**: When accessed, the secret is displayed once and immediately deleted
4. **Automatic Cleanup**: Redis TTL ensures expired secrets are automatically removed

## Environment Variables

- `REDIS_URL` - Redis connection URL with database number (default: `redis://localhost:6379/3`)
  - The application uses Redis database 3
  - Format: `redis://host:port/db` or `redis://host:port` (database 3 is set in code)
- `NEXT_PUBLIC_BASE_URL` - Base URL for the application (optional, for sitemap generation)

## Production Deployment

The application is production-ready with Docker Compose. Key features:

- Redis with persistent storage (AOF enabled)
- Production-optimized Next.js build with standalone output
- Multi-stage Docker build for minimal image size
- Health checks and automatic monitoring
- Non-root user execution for enhanced security

### Production Deployment

```bash
# Build and start services (production mode)
docker-compose up -d --build

# Stop services
docker-compose down

# View logs
docker-compose logs -f app
docker-compose logs -f redis

# Rebuild after code changes
docker-compose up -d --build

# Remove volumes (clears Redis data)
docker-compose down -v
```

### Production Features

- Optimized multi-stage Docker build
- Next.js standalone mode for faster startup
- Non-root user execution with minimal privileges
- Automatic health monitoring and checks
- Persistent Redis storage across restarts
- Automatic container restart on failure

## Kubernetes Deployment (Helm)

The application includes a Helm chart for easy Kubernetes deployment.

### Prerequisites

- Kubernetes cluster (1.19+)
- Helm 3.x
- kubectl configured

### Installation

```bash
# Install with default values
helm install tessera ./helm/tessera

# Or install with custom values
helm install tessera ./helm/tessera -f my-values.yaml

# Upgrade existing installation
helm upgrade tessera ./helm/tessera
```

### Configuration

Edit `helm/tessera/values.yaml` to customize:

- Replica count
- Image repository and tag
- Resource limits
- Redis configuration
- Ingress settings
- Autoscaling

### Example: Custom Values

```yaml
replicaCount: 3

image:
  repository: ghcr.io/clouddrove/tessera
  tag: "v1.0.0"

ingress:
  enabled: true
  className: "nginx"
  hosts:
    - host: tessera.example.com
      paths:
        - path: /
          pathType: Prefix

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
```

## CI/CD

Automated workflows powered by GitHub Actions.

### Build and Push

- Automatic Docker builds on push to master/develop branches
- Multi-platform support (amd64, arm64)
- Pushes to GitHub Container Registry (ghcr.io)
- Semantic versioning with git tags

### Dependabot

- Weekly automatic dependency updates
- Auto-merge when CI passes (minor/patch only)
- Grouped updates to minimize PR noise
- Monitors: npm, Docker, GitHub Actions

### Workflows

- `build-and-push.yml` - Docker image builds and registry pushes
- `ci.yml` - Linting, type checking, and builds
- `dependabot-auto-merge.yml` - Automatic PR merging when CI passes

### Setup

1. Enable GitHub Actions in repository settings
2. Set repository visibility to public or enable GitHub Packages
3. Dependabot will automatically:
   - Create PRs for dependency updates
   - Run CI checks
   - Auto-merge when CI passes (for minor/patch updates)

### Manual Trigger

```bash
# Create a new tag to trigger build
git tag v1.0.0
git push origin v1.0.0
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/tessera.git`
3. Create a branch: `git checkout -b feature/your-feature`
4. Make your changes
5. Run tests: `npm run lint && npm run build`
6. Commit your changes: `git commit -m 'Add some feature'`
7. Push to the branch: `git push origin feature/your-feature`
8. Submit a pull request

### Code Style

- Follow TypeScript best practices
- Use Prettier for code formatting
- Run `npm run lint` before committing

## Security

If you discover a security vulnerability, please send an email to security@clouddrove.com. We take security seriously and will respond promptly.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Powered by [Redis](https://redis.io/)

## Support

For support, please open an issue in the [GitHub repository](https://github.com/clouddrove/tessera/issues).

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes and version history.
