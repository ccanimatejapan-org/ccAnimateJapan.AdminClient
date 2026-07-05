import { test } from 'node:test'
import assert from 'node:assert/strict'

import { appendIfValue } from './formData.js'

test('appendIfValue appends defined, non-empty values (including 0 and false)', () => {
  const formData = new FormData()

  appendIfValue(formData, 'name', '王小明')
  appendIfValue(formData, 'count', 0)
  appendIfValue(formData, 'flag', false)

  assert.equal(formData.get('name'), '王小明')
  assert.equal(formData.get('count'), '0')
  assert.equal(formData.get('flag'), 'false')
})

test('appendIfValue skips undefined, null and empty string', () => {
  const formData = new FormData()

  appendIfValue(formData, 'undef', undefined)
  appendIfValue(formData, 'nul', null)
  appendIfValue(formData, 'empty', '')

  assert.equal(formData.has('undef'), false)
  assert.equal(formData.has('nul'), false)
  assert.equal(formData.has('empty'), false)
})
