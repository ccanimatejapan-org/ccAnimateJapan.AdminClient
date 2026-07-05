import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  mapProductFromApi,
  mapProductTypeFromApi,
  normalizeProductImages,
  toNumber,
} from './productMapper.js'

test('toNumber coerces finite numbers and falls back otherwise', () => {
  assert.equal(toNumber('5'), 5)
  assert.equal(toNumber(3.2), 3.2)
  assert.equal(toNumber('nope'), 0)
  assert.equal(toNumber(undefined, 9), 9)
  assert.equal(toNumber(null), 0)
})

test('normalizeProductImages drops blank urls / non-positive ids and coerces fields', () => {
  assert.deepEqual(
    normalizeProductImages([
      { id: '1', productId: '2', productImageUrl: 'a.png' },
      { id: 0, productImageUrl: 'b.png' },
      { id: 3, productImageUrl: '' },
    ]),
    [{ id: 1, productId: 2, productImageUrl: 'a.png' }],
  )

  assert.deepEqual(normalizeProductImages(null), [])
})

test('mapProductTypeFromApi normalizes id/name/isDelete and keeps the raw payload', () => {
  const raw = { id: '7', name: '公仔', isDelete: true }
  assert.deepEqual(mapProductTypeFromApi(raw), {
    id: 7,
    name: '公仔',
    isDelete: true,
    raw,
  })
})

test('mapProductFromApi coerces numbers, booleans, images and applies the activity fallback', () => {
  const raw = {
    id: 11,
    createdAt: '2024-01-01',
    updateAt: '2024-02-02',
    name: 'Widget',
    japanCost: '100',
    rate: '0.2',
    price: '120',
    amount: '4',
    orderedAmount: '2',
    isOutStock: true,
    productTypeId: '3',
    info: '<b>hi</b>',
    images: [{ id: '5', productId: '11', productImageUrl: 'a.png' }],
  }

  const mapped = mapProductFromApi(raw, 99)

  assert.equal(mapped.id, 11)
  assert.equal(mapped.japanCost, 100)
  assert.equal(mapped.rate, 0.2)
  assert.equal(mapped.price, 120)
  assert.equal(mapped.amount, 4)
  assert.equal(mapped.orderedAmount, 2)
  assert.equal(mapped.isOutStock, true)
  assert.equal(mapped.productTypeId, 3)
  assert.equal(mapped.activityId, 99)
  assert.deepEqual(mapped.images, [{ id: 5, productId: 11, productImageUrl: 'a.png' }])
  assert.equal(mapped.raw, raw)

  // A present activityId wins over the fallback.
  assert.equal(mapProductFromApi({ ...raw, activityId: '7' }, 99).activityId, 7)
})
