// Key-derivation parameters shared by the browser crypto helpers and the API
// routes. Kept in its own module so server code can validate the work factor
// without importing browser-only crypto.

// OWASP's current floor for PBKDF2-SHA256.
export const PBKDF2_ITERATIONS = 600_000

// Work factor used before it was stored per-secret. Secrets written then carry
// no `iterations` field and must be derived with this value.
export const LEGACY_PBKDF2_ITERATIONS = 210_000
