// Ephemeral ECDH for passwordless device-to-device handoff.
//
// The password flow exists so two people who share nothing but a channel can
// exchange a secret. Moving something onto your own phone is a different
// problem: there is no second party, so a password is pure friction, and the
// thing standing in for it is that the receiving device made a keypair nobody
// else has.
//
// The receiver generates a P-256 keypair and publishes only the public half
// under a short code. The sender fetches that key, derives a shared AES key
// against its own ephemeral keypair, and uploads ciphertext plus its own public
// key. The server holds two public keys and a blob, which is not enough to
// decrypt anything.
//
// The security consequence is worth stating plainly: guessing a code lets an
// attacker *send* to a waiting device. It never lets them read what someone
// else sent, because the private key never leaves the receiving browser.
//
// No imports, matching lib/clientCrypto.ts, so this file stays cheap to reuse.

const CURVE = 'P-256'
const KEY_BITS = 256
const IV_BYTES = 12

function getSubtle(): SubtleCrypto {
  const c = globalThis.crypto
  if (!c?.subtle) {
    throw new Error('Web Crypto API unavailable (requires a secure context / HTTPS)')
  }
  return c.subtle
}

// The DOM lib types Uint8Array over ArrayBufferLike, which is not assignable to
// BufferSource. Our arrays are always ArrayBuffer-backed, so this is safe.
function bs(u: Uint8Array): BufferSource {
  return u as unknown as BufferSource
}

export function toBase64Url(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i += 1) bin += String.fromCharCode(bytes[i])
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i)
  return out
}

export interface EphemeralKeyPair {
  privateKey: CryptoKey
  publicKeyB64: string
}

// Generated fresh per handoff and never persisted. The private key stays a
// non-extractable CryptoKey, so even the page that owns it cannot read the raw
// bytes back out.
export async function generateEphemeralKeyPair(): Promise<EphemeralKeyPair> {
  const subtle = getSubtle()
  const pair = await subtle.generateKey({ name: 'ECDH', namedCurve: CURVE }, false, [
    'deriveKey',
  ])
  const raw = new Uint8Array(await subtle.exportKey('raw', pair.publicKey))
  return { privateKey: pair.privateKey, publicKeyB64: toBase64Url(raw) }
}

async function sharedKey(privateKey: CryptoKey, peerPublicKeyB64: string): Promise<CryptoKey> {
  const subtle = getSubtle()
  const peer = await subtle.importKey(
    'raw',
    bs(fromBase64Url(peerPublicKeyB64)),
    { name: 'ECDH', namedCurve: CURVE },
    false,
    []
  )
  return subtle.deriveKey(
    { name: 'ECDH', public: peer },
    privateKey,
    { name: 'AES-GCM', length: KEY_BITS },
    false,
    ['encrypt', 'decrypt']
  )
}

export interface SealedPayload {
  ciphertext: string
  iv: string
  senderPublicKey: string
}

// Sender side. Makes its own throwaway keypair so the shared secret depends on
// both halves, and ships its public key alongside the ciphertext.
export async function sealTo(recipientPublicKeyB64: string, plaintext: string): Promise<SealedPayload> {
  const subtle = getSubtle()
  const ephemeral = await generateEphemeralKeyPair()
  const key = await sharedKey(ephemeral.privateKey, recipientPublicKeyB64)
  const iv = new Uint8Array(IV_BYTES)
  globalThis.crypto.getRandomValues(iv)

  const ct = new Uint8Array(
    await subtle.encrypt({ name: 'AES-GCM', iv: bs(iv) }, key, bs(new TextEncoder().encode(plaintext)))
  )
  return {
    ciphertext: toBase64Url(ct),
    iv: toBase64Url(iv),
    senderPublicKey: ephemeral.publicKeyB64,
  }
}

// Receiver side. Throws if the payload was not sealed to this keypair, which
// AES-GCM detects through its authentication tag rather than returning garbage.
export async function openSealed(privateKey: CryptoKey, payload: SealedPayload): Promise<string> {
  const subtle = getSubtle()
  const key = await sharedKey(privateKey, payload.senderPublicKey)
  const plain = await subtle.decrypt(
    { name: 'AES-GCM', iv: bs(fromBase64Url(payload.iv)) },
    key,
    bs(fromBase64Url(payload.ciphertext))
  )
  return new TextDecoder().decode(plain)
}
