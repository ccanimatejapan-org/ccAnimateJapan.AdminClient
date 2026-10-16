import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

import {
  MAX_JAPAN_COST,
  MAX_PRICE,
  MAX_RATE,
  MAX_STOCK_QUANTITY,
  MAX_UNIT_AMOUNT,
} from './productLimits.js'

const read = (relativePath) => fs.readFileSync(new URL(relativePath, import.meta.url), 'utf8')

// The <input> element that carries a given v-model.
const inputOf = (source, model) => {
  const match = source.match(new RegExp(`<input[^>]*v-model\\.number="${model.replace('.', '\\.')}"[^>]*>`, 's'))
  assert.ok(match, `input with v-model.number="${model}" not found`)
  return match[0]
}

test('limits mirror the backend (AdminAPI Application/Common/ProductValueLimits.cs)', () => {
  assert.equal(MAX_JAPAN_COST, 10_000_000)
  assert.equal(MAX_PRICE, 10_000_000)
  assert.equal(MAX_RATE, 10)
  assert.equal(MAX_STOCK_QUANTITY, 100_000)
  // the stock dialog fills the unit cost with round(japanCost * rate): the largest valid product must still be stockable
  assert.ok(MAX_UNIT_AMOUNT >= MAX_JAPAN_COST * MAX_RATE)
})

test('product form: number inputs carry the limits', () => {
  const source = read('../../modules/activityProduct/components/ProductFormDialog.vue')

  assert.ok(inputOf(source, 'form.japanCost').includes(':max="MAX_JAPAN_COST"'))
  assert.ok(inputOf(source, 'form.rate').includes(':max="MAX_RATE"'))
  assert.ok(inputOf(source, 'form.price').includes(':max="MAX_PRICE"'))
  assert.ok(inputOf(source, 'form.amount').includes(':max="MAX_STOCK_QUANTITY"'))
})

test('stock dialog: the quantity input carries the limit', () => {
  const source = read('../../modules/inventory/components/ProductStockTransactionDialog.vue')

  assert.ok(inputOf(source, 'form.amount').includes(':max="MAX_STOCK_QUANTITY"'))
})
