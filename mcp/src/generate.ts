import { ValidationError } from './validate.js'

export type SecretType = 'password' | 'token' | 'hex'

const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

export const GENERATION_RULES = {
  password: { alphabet: ALPHA + '!@#$%^&*()-_=+', defaultLength: 24, min: 12, max: 128 },
  token: { alphabet: ALPHA, defaultLength: 32, min: 16, max: 128 },
  hex: { alphabet: '0123456789abcdef', defaultLength: 64, min: 16, max: 256 },
} as const

// Rejection sampling. Taking a raw byte modulo the alphabet size would bias
// toward the first (256 % size) characters.
function pick(alphabet: string, count: number): string {
  const out: string[] = []
  const limit = Math.floor(256 / alphabet.length) * alphabet.length
  const buf = new Uint8Array(count * 2)
  while (out.length < count) {
    crypto.getRandomValues(buf)
    for (const byte of buf) {
      if (out.length === count) break
      if (byte < limit) out.push(alphabet[byte % alphabet.length])
    }
  }
  return out.join('')
}

export function generateSecret(type: SecretType, length?: number): string {
  const rule = GENERATION_RULES[type]
  if (!rule) throw new ValidationError(`type must be one of password, token, hex, got ${type}`)

  const len = length ?? rule.defaultLength
  if (!Number.isInteger(len) || len < rule.min || len > rule.max) {
    throw new ValidationError(`length for ${type} must be an integer between ${rule.min} and ${rule.max}`)
  }
  if (type === 'hex' && len % 2 !== 0) {
    throw new ValidationError('length for hex must be even so the output maps to whole bytes')
  }
  return pick(rule.alphabet, len)
}

export function generatePassword(): string {
  return generateSecret('password')
}
