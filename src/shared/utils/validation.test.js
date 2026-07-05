import { test } from 'node:test'
import assert from 'node:assert/strict'

import { formatRequiredFieldsMessage, hasPositiveNumberValue, isBlankValue } from './validation.js'

test('isBlankValue treats undefined, null and whitespace-only as blank', () => {
  assert.equal(isBlankValue(undefined), true)
  assert.equal(isBlankValue(null), true)
  assert.equal(isBlankValue(''), true)
  assert.equal(isBlankValue('   '), true)
  assert.equal(isBlankValue('a'), false)
  assert.equal(isBlankValue(0), false)
  assert.equal(isBlankValue(false), false)
})

test('hasPositiveNumberValue requires a finite number greater than zero', () => {
  assert.equal(hasPositiveNumberValue(1), true)
  assert.equal(hasPositiveNumberValue('5'), true)
  assert.equal(hasPositiveNumberValue(0), false)
  assert.equal(hasPositiveNumberValue('0'), false)
  assert.equal(hasPositiveNumberValue(-3), false)
  assert.equal(hasPositiveNumberValue(''), false)
  assert.equal(hasPositiveNumberValue(null), false)
  assert.equal(hasPositiveNumberValue('abc'), false)
})

test('formatRequiredFieldsMessage joins fields with the full-width comma', () => {
  assert.equal(formatRequiredFieldsMessage(['訂購人']), '請填寫：訂購人。')
  assert.equal(formatRequiredFieldsMessage(['訂購人', 'Email']), '請填寫：訂購人、Email。')
})
