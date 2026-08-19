// Browser-only zero-knowledge crypto helpers (Web Crypto / SubtleCrypto).
//
// The server never sees plaintext, passwords, or encryption keys. Secrets are
// encrypted with AES-GCM in the browser. The key is either:
//   - random, carried in the URL #fragment (never sent to the server), or
//   - derived from a password via PBKDF2 (the #fragment carries nothing).
//
// For password-protected secrets a separate PBKDF2 "verifier" is sent to the
// server purely to gate retrieval (so a wrong guess does not burn the secret).
// The verifier uses a different salt and is one-way w.r.t. the encryption key,
// so the server still cannot decrypt.

import { PBKDF2_ITERATIONS } from './kdfParams'

export { PBKDF2_ITERATIONS, LEGACY_PBKDF2_ITERATIONS } from './kdfParams'

const IV_BYTES = 12
const SALT_BYTES = 16
const KEY_BITS = 256

function getSubtle(): SubtleCrypto {
  const c = globalThis.crypto
  if (!c?.subtle) {
    throw new Error('Web Crypto API unavailable (requires a secure context / HTTPS)')
  }
  return c.subtle
}

function randomBytes(len: number): Uint8Array {
  const b = new Uint8Array(len)
  globalThis.crypto.getRandomValues(b)
  return b
}

// The DOM lib types Uint8Array as generic over ArrayBufferLike, which is not
// directly assignable to BufferSource (it permits SharedArrayBuffer). Our byte
// arrays are always ArrayBuffer-backed, so this cast is safe.
function bs(u: Uint8Array): BufferSource {
  return u as unknown as BufferSource
}

// --- base64url helpers (URL-fragment safe, no padding) ---

export function toBase64Url(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

const enc = new TextEncoder()
const dec = new TextDecoder()

async function importAesKey(raw: Uint8Array): Promise<CryptoKey> {
  return getSubtle().importKey('raw', bs(raw), { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ])
}

async function pbkdf2(
  password: string,
  salt: Uint8Array,
  bits: number,
  iterations: number = PBKDF2_ITERATIONS
): Promise<Uint8Array> {
  const baseKey = await getSubtle().importKey(
    'raw',
    bs(enc.encode(password)),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const derived = await getSubtle().deriveBits(
    { name: 'PBKDF2', salt: bs(salt), iterations, hash: 'SHA-256' },
    baseKey,
    bits
  )
  return new Uint8Array(derived)
}

export interface EncryptedPayload {
  ciphertext: string // base64url
  iv: string // base64url
}

async function aesEncrypt(plaintext: string, key: CryptoKey): Promise<EncryptedPayload> {
  const iv = randomBytes(IV_BYTES)
  const ct = await getSubtle().encrypt({ name: 'AES-GCM', iv: bs(iv) }, key, bs(enc.encode(plaintext)))
  return { ciphertext: toBase64Url(new Uint8Array(ct)), iv: toBase64Url(iv) }
}

async function aesDecrypt(payload: EncryptedPayload, key: CryptoKey): Promise<string> {
  const pt = await getSubtle().decrypt(
    { name: 'AES-GCM', iv: bs(fromBase64Url(payload.iv)) },
    key,
    bs(fromBase64Url(payload.ciphertext))
  )
  return dec.decode(pt)
}

// --- No-password mode: random key carried in the URL fragment ---

export interface RandomKeyResult extends EncryptedPayload {
  fragmentKey: string // base64url, goes in URL #fragment
}

export async function encryptWithRandomKey(plaintext: string): Promise<RandomKeyResult> {
  const rawKey = randomBytes(KEY_BITS / 8)
  const key = await importAesKey(rawKey)
  const payload = await aesEncrypt(plaintext, key)
  return { ...payload, fragmentKey: toBase64Url(rawKey) }
}

export async function decryptWithRandomKey(
  payload: EncryptedPayload,
  fragmentKey: string
): Promise<string> {
  const key = await importAesKey(fromBase64Url(fragmentKey))
  return aesDecrypt(payload, key)
}

// --- Password mode: PBKDF2-derived key + separate verifier ---

export interface PasswordEncryptResult extends EncryptedPayload {
  encSalt: string // base64url, for key derivation
  authSalt: string // base64url, for verifier derivation
  verifier: string // base64url, sent to server to gate retrieval
  iterations: number // PBKDF2 work factor used, stored with the secret
}

export async function encryptWithPassword(
  plaintext: string,
  password: string
): Promise<PasswordEncryptResult> {
  const encSalt = randomBytes(SALT_BYTES)
  const authSalt = randomBytes(SALT_BYTES)
  const rawKey = await pbkdf2(password, encSalt, KEY_BITS)
  const key = await importAesKey(rawKey)
  const payload = await aesEncrypt(plaintext, key)
  const verifier = await pbkdf2(password, authSalt, 256)
  return {
    ...payload,
    encSalt: toBase64Url(encSalt),
    authSalt: toBase64Url(authSalt),
    verifier: toBase64Url(verifier),
    iterations: PBKDF2_ITERATIONS,
  }
}

// Compute the verifier the server expects, from a candidate password.
export async function computeVerifier(
  password: string,
  authSalt: string,
  iterations: number = PBKDF2_ITERATIONS
): Promise<string> {
  const verifier = await pbkdf2(password, fromBase64Url(authSalt), 256, iterations)
  return toBase64Url(verifier)
}

export async function decryptWithPassword(
  payload: EncryptedPayload,
  password: string,
  encSalt: string,
  iterations: number = PBKDF2_ITERATIONS
): Promise<string> {
  const rawKey = await pbkdf2(password, fromBase64Url(encSalt), KEY_BITS, iterations)
  const key = await importAesKey(rawKey)
  return aesDecrypt(payload, key)
}
