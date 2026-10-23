import { test } from 'node:test'
import assert from 'node:assert/strict'

import { isOrderItemsLocked } from './orderStatuses.js'

test('order items stay editable before the order reaches 預購已完成 (status 1-3)', () => {
  assert.equal(isOrderItemsLocked(1), false)
  assert.equal(isOrderItemsLocked(2), false)
  assert.equal(isOrderItemsLocked(3), false)
})

test('order items are locked from 預購已完成 onwards (status 4-8, including canceled)', () => {
  for (const status of [4, 5, 6, 7, 8]) {
    assert.equal(isOrderItemsLocked(status), true, `status ${status}`)
  }
})

test('isOrderItemsLocked accepts numeric strings and treats unknown values as editable', () => {
  assert.equal(isOrderItemsLocked('4'), true)
  assert.equal(isOrderItemsLocked('3'), false)
  assert.equal(isOrderItemsLocked(undefined), false)
  assert.equal(isOrderItemsLocked(null), false)
  assert.equal(isOrderItemsLocked(''), false)
})
