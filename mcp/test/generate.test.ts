import { test } from 'node:test'
import assert from 'node:assert/strict'
import { generateSecret, generatePassword, GENERATION_RULES } from '../src/generate.js'
import { ValidationError } from '../src/validate.js'

test('produces the default length for each type', () => {
  for (const type of ['password', 'token', 'hex'] as const) {
    assert.equal(generateSecret(type).length, GENERATION_RULES[type].defaultLength)
  }
})

test('honours an explicit length', () => {
  assert.equal(generateSecret('token', 16).length, 16)
})

test('only emits characters from the declared alphabet', () => {
  for (const type of ['password', 'token', 'hex'] as const) {
    const out = generateSecret(type, GENERATION_RULES[type].min)
    for (const ch of out) assert.ok(GENERATION_RULES[type].alphabet.includes(ch), `${type}: ${ch}`)
  }
})

test('rejects lengths outside the allowed range', () => {
  assert.throws(() => generateSecret('password', 11), ValidationError)
  assert.throws(() => generateSecret('password', 129), ValidationError)
})

test('rejects an odd hex length so output maps to whole bytes', () => {
  assert.throws(() => generateSecret('hex', 17), ValidationError)
  assert.equal(generateSecret('hex', 18).length, 18)
})

test('rejects an unknown type', () => {
  assert.throws(() => generateSecret('rsa' as never), ValidationError)
})

test('successive values differ', () => {
  const seen = new Set(Array.from({ length: 50 }, () => generateSecret('token')))
  assert.equal(seen.size, 50)
})

test('generatePassword returns a default-length password', () => {
  assert.equal(generatePassword().length, GENERATION_RULES.password.defaultLength)
})
