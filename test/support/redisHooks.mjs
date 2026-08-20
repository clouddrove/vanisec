// Preloaded by the `test` script. Redirects the `ioredis` specifier to the
// in-memory stand-in in fakeRedis.ts, so the API route tests need no Redis
// server, no Docker and no network. Everything below lib/redis.ts is real.
//
// registerHooks is synchronous and in-process, so the redirect is in place
// before any test file is loaded and it composes with the tsx loader that
// transpiles fakeRedis.ts.
import { registerHooks } from 'node:module'

const fakeRedisUrl = new URL('./fakeRedis.ts', import.meta.url).href

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'ioredis') {
      return { url: fakeRedisUrl, format: 'module', shortCircuit: true }
    }
    return nextResolve(specifier, context)
  },
})
