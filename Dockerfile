# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy only package files first for better caching
COPY package.json package-lock.json* ./

# Install dependencies with optimizations and BuildKit cache mount
RUN --mount=type=cache,target=/root/.npm \
    if [ -f package-lock.json ]; then \
      npm ci --prefer-offline --no-audit --no-fund; \
    else \
      npm install --prefer-offline --no-audit --no-fund; \
    fi

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy package files
COPY package.json package-lock.json* ./

# Copy Next.js config and other config files first (better caching)
COPY next.config.js tsconfig.json tailwind.config.js postcss.config.js ./

# Copy source code (this layer changes most often)
COPY app ./app
COPY components ./components
COPY lib ./lib
COPY public ./public

ENV NEXT_TELEMETRY_DISABLED=1

# Build with optimizations and BuildKit cache mount for Next.js cache
RUN --mount=type=cache,target=/app/.next/cache \
    npm run build

# Stage 3: Runner (Production)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

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
