import { test } from 'node:test'
import assert from 'node:assert/strict'

import { formatOrderNumber } from './orderDisplay.js'

test('formatOrderNumber shows the customer-facing order number when the order has one', () => {
  assert.equal(formatOrderNumber({ id: 265, orderNo: 'CJ202610230003' }), 'CJ202610230003')
  assert.equal(formatOrderNumber({ id: 265, orderNo: '  CJ202610230003  ' }), 'CJ202610230003')
})

test('formatOrderNumber falls back to the internal id for orders without an order number', () => {
  assert.equal(formatOrderNumber({ id: 265, orderNo: null }), '#265')
  assert.equal(formatOrderNumber({ id: 265, orderNo: '' }), '#265')
  assert.equal(formatOrderNumber({ id: 265, orderNo: '   ' }), '#265')
  assert.equal(formatOrderNumber({ id: 265 }), '#265')
})

test('formatOrderNumber tolerates a missing order', () => {
  assert.equal(formatOrderNumber(null), '')
  assert.equal(formatOrderNumber(undefined), '')
  assert.equal(formatOrderNumber({}), '')
})
