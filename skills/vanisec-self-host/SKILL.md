---
name: vanisec-self-host
description: Use when running Vanisec on your own infrastructure rather than the public instance, or when someone asks how to deploy it with Docker Compose, the container image, or the Helm chart on Kubernetes. Covers the required Redis configuration, every environment variable the app actually reads, what the bundled Helm chart does and does not template, the reverse proxy setting that rate limiting depends on, and how to point the Vanisec MCP server at your own instance.
license: MIT
---

# Self-hosting Vanisec

Vanisec is a Next.js app with Redis behind it. Redis stores ciphertext and a
hash of a verifier, nothing else, so the server cannot read a secret even with
full access to its own database. Self-hosting does not change the encryption
model, it changes who runs the box.

Everything below is what is in the repository at
https://github.com/clouddrove/vanisec. There is no separate configuration
service and no database other than Redis.

## Docker Compose

The fastest path. `docker-compose.yml` defines two services:

- `redis`, from `redis:7-alpine`, started with `redis-server --appendonly yes`,
  persisting to a named `redis-data` volume, with a `redis-cli ping` healthcheck
- `app`, built from the repository `Dockerfile`, published on port 3000,
  depending on Redis being healthy, with `restart: unless-stopped`

```bash
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

docker-compose up -d --build
docker-compose logs -f app
```

The app is then on http://localhost:3000.

Two things about the compose file are worth changing before it goes anywhere
real:

- Redis has no password. Authentication is present but commented out: uncomment
  the `requirepass` form of the Redis `command`, then point the app's
  `REDIS_URL` at `redis://:password@redis:6379/3`, and update the healthcheck to
  pass `-a`.
- `GA_ID` defaults to CloudDrove's own Google Analytics measurement ID. Set
  `GA_ID` to your own, or to an empty value, unless you want to send traffic
  data to that property.

Other commands the repository documents:

```bash
docker-compose down       # stop
docker-compose down -v    # stop and drop the Redis volume
```

## The container image

Prebuilt images are published to GitHub Container Registry by CI on pushes to
`master`:

```bash
docker pull ghcr.io/clouddrove/vanisec:latest
```

The `Dockerfile` builds in three stages on `node:26-alpine` and produces a
Next.js standalone output. The runtime stage runs as a non-root user (uid 1001,
group 1001), listens on port 3000 with `HOSTNAME=0.0.0.0`, and starts with
`node server.js`.

The image copies the whole source tree in the builder stage rather than listing
paths, so `.dockerignore` is the single place that decides what stays out. If
you add a root level source file, check `.dockerignore` rather than the
`Dockerfile`.

## Environment variables

These are the variables the application code actually reads. Anything not on
this list does nothing.

| Variable | Purpose | Default |
|----------|---------|---------|
| `REDIS_URL` | Redis connection URL. Required in practice. | `redis://localhost:6379/3` |
| `REDIS_PASSWORD` | Redis password, when it is not already in `REDIS_URL`. | unset |
| `REDIS_DB` | Redis database index. Ignored when `REDIS_URL` already selects one. | `3` |
| `TRUSTED_PROXY_HOPS` | Number of reverse proxies in front of the app. | `1` |
| `NEXT_PUBLIC_BASE_URL` | Public base URL, used for metadata, `robots.txt`, the sitemap, and the links the hosted MCP endpoint returns. | `https://vanisec.clouddrove.com` |
| `GA_ID` | Google Analytics measurement ID, read at runtime. | unset |
| `NEXT_PUBLIC_GA_ID` | Same, but baked in at build time. | unset |
| `NODE_ENV` | Environment mode. | `production` in the images |

`REDIS_URL` accepts `redis://[password@]host:port[/database]`. When the URL path
already selects a database, `REDIS_DB` is ignored, so `redis://host/0` is
honoured rather than silently overridden.

Set `NEXT_PUBLIC_BASE_URL` to your own domain. Left at its default, a
self-hosted instance advertises the public one in its metadata and sitemap.

### `TRUSTED_PROXY_HOPS` deserves its own paragraph

Rate limiting identifies callers by IP, read from `X-Forwarded-For`. Every proxy
appends to that header, so only the rightmost entries are trustworthy; anything
further left came from the caller and can be forged. The app takes the Nth entry
from the right, where N is `TRUSTED_PROXY_HOPS`.

| Deployment | Value |
|------------|-------|
| Single ingress or load balancer | `1` |
| CDN in front of an ingress | `2` |
| No proxy, app exposed directly | `1` |

Set too high, it reads an entry the caller controls, and one client can forge
unlimited identities and walk past rate limiting entirely. Set too low, everyone
behind the proxy shares a bucket and one noisy client rate limits the rest.
Count your actual hops.

## Kubernetes with the bundled Helm chart

The chart lives at `_infra/helm/vanisec`. It is a complete chart, not a
skeleton: `Chart.yaml` (apiVersion v2, chart version 1.0.0, appVersion 1.0.0),
`values.yaml`, and templates for the Deployment, Service, Ingress,
HorizontalPodAutoscaler, ServiceAccount, and an optional embedded Redis
(Deployment, Service and PersistentVolumeClaim in one file).

```bash
helm install vanisec ./_infra/helm/vanisec
helm install vanisec ./_infra/helm/vanisec -f my-values.yaml
helm upgrade vanisec ./_infra/helm/vanisec
```

Defaults worth knowing:

- `replicaCount: 2`, image `ghcr.io/clouddrove/vanisec:latest`
- Service is `ClusterIP` on port 80, targeting container port 3000
- Ingress is **disabled** by default. Enabling it uses `className: nginx` and a
  placeholder host, so set `ingress.hosts` and `ingress.tls` yourself.
- Autoscaling is disabled by default. Enabled, it runs 2 to 10 replicas against
  80 percent CPU and memory targets.
- Pods run as uid 1001 with `runAsNonRoot`, all capabilities dropped, no
  privilege escalation, and a read only root filesystem.
- Liveness and readiness probes both hit `/`.

### Redis, embedded or external

`redis.enabled: true` (the default) deploys Redis 7-alpine inside the release,
with an 8Gi PersistentVolumeClaim when `redis.persistence.enabled` is true and
an `emptyDir` when it is not. An `emptyDir` means every unopened secret is lost
when the pod moves.

`redis.enabled: false` skips all of that, and you point `env.REDIS_URL` at your
own Redis or a managed service. That is the right choice for anything
production shaped.

The default `env.REDIS_URL` is `redis://vanisec-redis:6379/3`, which matches the
embedded Redis Service only when the release is named `vanisec`. Install under
any other release name and you have to update `env.REDIS_URL` to match, because
the Service is named after the release.

Setting `redis.password` adds `--requirepass` to the embedded Redis and passes
`-a` to its probes, but it does **not** flow into the app. Set `env.REDIS_PASSWORD`
as well, or put the password in `env.REDIS_URL`, or the app will not authenticate.

### Two gaps in the chart to know about

- The Deployment template renders only `NODE_ENV`, `REDIS_URL`,
  `REDIS_PASSWORD`, `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_GA_ID` and `GA_ID`.
  There is no `TRUSTED_PROXY_HOPS` in `values.yaml` or in the template, so
  behind an ingress the app falls back to its default of 1. Add it to the
  template if your hop count is different.
- Secrets go into the Deployment as plain values from `values.yaml`, not through
  a Kubernetes Secret. If you set `env.REDIS_PASSWORD` or `redis.password`, it
  is readable in the rendered manifest and in `helm get values`.

A third thing to check when `redis.enabled` is true: the app Service selects on
the chart's name and instance labels only, while the embedded Redis pods carry
those same labels plus a component label. Verify the Service endpoints after
install and narrow the selector if it has picked up the Redis pod.

## Local development

For running from source rather than a container:

- Node.js 20.x or higher, Redis 7.x or higher
- `npm install`, then `npm run dev`, with a `.env.local` holding `REDIS_URL` and
  `NEXT_PUBLIC_BASE_URL`
- `npm run build` then `npm start` for a production build

Redis on its own is enough to develop against:
`docker run -d -p 6379:6379 redis:7-alpine`.

## Pointing the MCP server at your instance

The `@clouddrove/vanisec-mcp` package targets `https://vanisec.clouddrove.com`
unless `VANISEC_BASE_URL` says otherwise. Set it in the `env` block of the
client's MCP configuration:

```json
{
  "mcpServers": {
    "vanisec": {
      "command": "npx",
      "args": ["-y", "@clouddrove/vanisec-mcp"],
      "env": {
        "VANISEC_BASE_URL": "https://vanisec.example.com"
      }
    }
  }
}
```

Trailing slashes are stripped, so either form works. The server posts to
`{base}/api/secrets` and returns links of the form `{base}/secret/{id}`. It logs
the base URL it is targeting to stderr at startup, which is the quickest way to
confirm the variable took effect.

Your instance also serves the hosted MCP endpoint at `POST {base}/api/mcp` for
clients that cannot run a local process. That endpoint offers
`vanisec_create_secret` only and encrypts on the server, so it is not
zero-knowledge; prefer the local package. The links it returns come from
`NEXT_PUBLIC_BASE_URL` when that is set, and from the request origin otherwise,
which is another reason to set it.

## Operational notes

- Secret creation is rate limited to 30 per 10 minutes per IP, and the hosted
  MCP endpoint to 20 per 10 minutes per IP. Rate limit counters live in the same
  Redis instance.
- Payloads are capped: 16MB on the request body, and 12,000,000 characters of
  ciphertext.
- Secrets are stored with a Redis TTL matching their expiry, and retrieval is an
  atomic fetch and delete, which is what makes them one-time. A racing second
  reader gets nothing.
- Terminate TLS at your ingress or reverse proxy. Encryption happens in the
  browser or in the MCP client, but the link and the password still travel over
  the wire.
- Back up Redis only if you have a reason to. Its entire contents expire on
  their own, and a backup of ciphertext plus verifier hashes is of no use to
  anyone without the passwords.
