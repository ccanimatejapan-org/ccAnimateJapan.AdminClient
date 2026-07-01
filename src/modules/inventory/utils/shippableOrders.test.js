import { test } from 'node:test'
import assert from 'node:assert/strict'

import { aggregateShippableAmount } from './shippableOrders.js'

test('sums amounts of every item matching the product id', () => {
  const order = {
    items: [
      { productId: 1, amount: 2 },
      { productId: 1, amount: 3 },
    ],
  }
  assert.equal(aggregateShippableAmount(order, 1), 5)
})

test('ignores items belonging to other products', () => {
  const order = {
    items: [
      { productId: 1, amount: 2 },
      { productId: 2, amount: 9 },
    ],
  }
  assert.equal(aggregateShippableAmount(order, 1), 2)
})

test('matches the product id across string/number types (Number coercion both sides)', () => {
  assert.equal(aggregateShippableAmount({ items: [{ productId: '5', amount: 4 }] }, 5), 4)
  assert.equal(aggregateShippableAmount({ items: [{ productId: 5, amount: 4 }] }, '5'), 4)
})

test('excludes items whose orderProductStatus is 2 (already shipped)', () => {
  const order = {
    items: [
      { productId: 1, amount: 2, orderProductStatus: 1 },
      { productId: 1, amount: 5, orderProductStatus: 2 },
    ],
  }
  assert.equal(aggregateShippableAmount(order, 1), 2)
})

test('excludes status 2 supplied as a numeric string', () => {
  const order = { items: [{ productId: 1, amount: 5, orderProductStatus: '2' }] }
  assert.equal(aggregateShippableAmount(order, 1), 0)
})

test('treats a missing orderProductStatus as 1 (included)', () => {
  const order = { items: [{ productId: 1, amount: 7 }] }
  assert.equal(aggregateShippableAmount(order, 1), 7)
})

test('treats a falsy orderProductStatus of 0 as 1 (included) — preserves original `|| 1`', () => {
  const order = { items: [{ productId: 1, amount: 7, orderProductStatus: 0 }] }
  assert.equal(aggregateShippableAmount(order, 1), 7)
})

test('includes statuses other than 2 (e.g. 3)', () => {
  const order = { items: [{ productId: 1, amount: 7, orderProductStatus: 3 }] }
  assert.equal(aggregateShippableAmount(order, 1), 7)
})

test('treats a missing amount as 0', () => {
  const order = { items: [{ productId: 1 }, { productId: 1, amount: 4 }] }
  assert.equal(aggregateShippableAmount(order, 1), 4)
})

test('returns 0 when the order has no items', () => {
  assert.equal(aggregateShippableAmount({ items: [] }, 1), 0)
})

test('returns 0 for a null/undefined order or one missing its items array', () => {
  assert.equal(aggregateShippableAmount(null, 1), 0)
  assert.equal(aggregateShippableAmount(undefined, 1), 0)
  assert.equal(aggregateShippableAmount({}, 1), 0)
})

test('aggregates a realistic mix into a single shippable total', () => {
  const order = {
    items: [
      { productId: 1, amount: 2, orderProductStatus: 1 }, // include
      { productId: 1, amount: 3 }, // include (default status 1)
      { productId: 1, amount: 4, orderProductStatus: 2 }, // exclude (shipped)
      { productId: 2, amount: 9, orderProductStatus: 1 }, // exclude (other product)
    ],
  }
  assert.equal(aggregateShippableAmount(order, 1), 5)
})
