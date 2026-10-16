import { test } from 'node:test'
import assert from 'node:assert/strict'

import { getStockLimitError } from './stockTransactionRules.js'

test('getStockLimitError accepts normal values and values exactly at the limit', () => {
  assert.equal(getStockLimitError({ amount: 5, unitValue: 200, inOrOut: true }), '')
  assert.equal(getStockLimitError({ amount: 100_000, unitValue: 100_000_000, inOrOut: true }), '')
  assert.equal(getStockLimitError({ amount: 1, unitValue: 100_000_000, inOrOut: false }), '')
})

test('getStockLimitError rejects a quantity above the limit', () => {
  assert.match(getStockLimitError({ amount: 100_001, unitValue: 200, inOrOut: true }), /數量/)
})

test('getStockLimitError names the unit value that is above the limit', () => {
  assert.match(getStockLimitError({ amount: 5, unitValue: 100_000_001, inOrOut: true }), /單位成本/)
  assert.match(getStockLimitError({ amount: 5, unitValue: 100_000_001, inOrOut: false }), /單位售價/)
})
