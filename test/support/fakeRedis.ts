// In-memory stand-in for the ioredis client, covering only the commands lib/
// actually issues: INCR, EXPIRE, TTL, SETEX, SET (with EX/NX), GET, GETDEL
// and DEL.
//
// test/support/redisHooks.mjs redirects every `ioredis` import to this file, so
// lib/redis.ts, lib/rateLimit.ts and lib/secrets.ts run unmodified against it.
// That is the point: the route handlers are exercised through the real storage
// helpers, and only the network hop is replaced.

interface Entry {
  value: string
  expiresAtMs: number | null
}

export default class FakeRedis {
  private store = new Map<string, Entry>()

  // lib/redis.ts calls `new Redis(url, options)`; both are ignored here.
  constructor(_url?: unknown, _options?: unknown) {}

  // lib/redis.ts attaches 'error' and 'connect' listeners. Nothing ever fires.
  on(_event: string, _listener: (...args: unknown[]) => void): this {
    return this
  }

  private live(key: string): Entry | undefined {
    const entry = this.store.get(key)
    if (!entry) return undefined
    if (entry.expiresAtMs !== null && entry.expiresAtMs <= Date.now()) {
      this.store.delete(key)
      return undefined
    }
    return entry
  }

  async incr(key: string): Promise<number> {
    const entry = this.live(key)
    const next = String(Number(entry?.value ?? '0') + 1)
    this.store.set(key, { value: next, expiresAtMs: entry?.expiresAtMs ?? null })
    return Number(next)
  }

  async expire(key: string, seconds: number): Promise<number> {
    const entry = this.live(key)
    if (!entry) return 0
    entry.expiresAtMs = Date.now() + seconds * 1000
    return 1
  }

  async ttl(key: string): Promise<number> {
    const entry = this.live(key)
    if (!entry) return -2
    if (entry.expiresAtMs === null) return -1
    return Math.ceil((entry.expiresAtMs - Date.now()) / 1000)
  }

  async setex(key: string, seconds: number, value: string): Promise<'OK'> {
    this.store.set(key, { value, expiresAtMs: Date.now() + seconds * 1000 })
    return 'OK'
  }

  // lib/pairing.ts issues SET key value EX <ttl> NX. ioredis takes those as
  // trailing variadic arguments, and NX must return null (not 'OK') when the
  // key already exists, because that is how a code collision is detected.
  async set(key: string, value: string, ...args: (string | number)[]): Promise<'OK' | null> {
    const tokens = args.map((a) => String(a))
    const nx = tokens.some((t) => t.toUpperCase() === 'NX')
    const exIndex = tokens.findIndex((t) => t.toUpperCase() === 'EX')
    const seconds = exIndex >= 0 ? Number(tokens[exIndex + 1]) : null

    if (nx && this.live(key)) return null

    this.store.set(key, {
      value,
      expiresAtMs: seconds === null ? null : Date.now() + seconds * 1000,
    })
    return 'OK'
  }

  async get(key: string): Promise<string | null> {
    return this.live(key)?.value ?? null
  }

  async del(key: string): Promise<number> {
    return this.store.delete(key) ? 1 : 0
  }

  // lib/secrets.ts reaches GETDEL through the generic `call` escape hatch.
  async call(command: string, ...args: string[]): Promise<unknown> {
    if (command.toUpperCase() !== 'GETDEL') {
      throw new Error(`FakeRedis does not implement ${command}`)
    }
    const key = args[0]
    const value = this.live(key)?.value ?? null
    this.store.delete(key)
    return value
  }

  // Only used by tests, to assert that nothing was written. The pattern
  // support is glob-lite: * matches any run of characters, ? matches one.
  async keys(pattern: string): Promise<string[]> {
    const expression = new RegExp(
      '^' + pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
    )
    const matched: string[] = []
    this.store.forEach((_entry, key) => {
      if (expression.test(key) && this.live(key)) matched.push(key)
    })
    return matched
  }

  async flushall(): Promise<'OK'> {
    this.store.clear()
    return 'OK'
  }

  async quit(): Promise<'OK'> {
    this.store.clear()
    return 'OK'
  }
}
