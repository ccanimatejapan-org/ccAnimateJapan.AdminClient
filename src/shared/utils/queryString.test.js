import { test } from 'node:test'
import assert from 'node:assert/strict'

import { toQueryString } from './queryString.js'

test('toQueryString skips undefined, null and empty-string values', () => {
  assert.equal(
    toQueryString({ page: 1, pageSize: 20, keyword: '', orderStatus: undefined }),
    '?page=1&pageSize=20',
  )
})

test('toQueryString returns an empty string when nothing is set', () => {
  assert.equal(toQueryString({ keyword: '', orderStatus: null }), '')
  assert.equal(toQueryString({}), '')
})

test('toQueryString keeps zero values and encodes the leading question mark', () => {
  assert.equal(toQueryString({ page: 0 }), '?page=0')
  assert.equal(toQueryString({ keyword: 'a b' }), '?keyword=a+b')
})
