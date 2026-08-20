import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validateExpiry, validateNonEmpty, ValidationError, DEFAULT_EXPIRY_HOURS } from '../src/validate.js'

test('accepts each allowed expiry value', () => {
  for (const h of [1, 6, 24, 72, 168]) assert.equal(validateExpiry(h), h)
})

test('defaults when expiry is omitted', () => {
  assert.equal(validateExpiry(undefined), DEFAULT_EXPIRY_HOURS)
})

test('rejects an expiry outside the allowed set', () => {
  assert.throws(() => validateExpiry(5), ValidationError)
  assert.throws(() => validateExpiry(0), ValidationError)
  assert.throws(() => validateExpiry(-24), ValidationError)
})

test('rejects a non-integer expiry', () => {
  assert.throws(() => validateExpiry(24.5), ValidationError)
})

test('validateNonEmpty returns the value and rejects blanks', () => {
  assert.equal(validateNonEmpty('x', 'text'), 'x')
  assert.throws(() => validateNonEmpty('', 'text'), ValidationError)
  assert.throws(() => validateNonEmpty('   ', 'text'), ValidationError)
})

test('the error message names the offending field', () => {
  assert.throws(() => validateNonEmpty('', 'password'), /password/)
})
