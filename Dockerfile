# Stage 1: Dependencies
# Next.js 16 requires Node.js >= 20.9.0
FROM node:26-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy only package files first for better caching
COPY package.json package-lock.json* ./

# Install dependencies with BuildKit cache mount for npm cache
# Try npm ci first, fallback to npm install if package-lock.json is missing/outdated
RUN --mount=type=cache,target=/root/.npm \
    sh -c "npm ci --no-audit --no-fund || npm install --no-audit --no-fund"

# Stage 2: Builder
FROM node:26-alpine AS builder
WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy the whole source tree, minus whatever .dockerignore excludes.
#
# This used to enumerate each path, which meant a new root-level source file was
# silently left out of the image. middleware.ts was missed that way: Next builds
# and starts happily without it, just serving no middleware, so the build stayed
# green while /secret lost its nonce-based CSP in production. Copying everything
# makes that failure mode impossible; .dockerignore is the single place that
# decides what stays out.
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build with BuildKit cache mount for Next.js cache
# Using standalone output for smaller final image
RUN --mount=type=cache,target=/app/.next/cache \
    npm run build

# Stage 3: Runner (Production)
FROM node:26-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy public directory
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
