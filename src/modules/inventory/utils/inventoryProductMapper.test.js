import { test } from 'node:test'
import assert from 'node:assert/strict'

import { mapInventoryProductFromApi } from './inventoryProductMapper.js'

test('mapInventoryProductFromApi keeps the activity name, mode and activity status from the inventory endpoint', () => {
  const product = mapInventoryProductFromApi({
    id: 11,
    name: '現貨商品',
    activityId: 5,
    activityName: '現貨活動',
    isPreOrder: false,
    activityStatus: 3,
    amount: 0,
    orderedAmount: 0,
  })

  assert.equal(product.id, 11)
  assert.equal(product.activityName, '現貨活動')
  assert.equal(product.isPreOrder, false)
  assert.equal(product.activityStatus, 3)
})

test('mapInventoryProductFromApi tolerates an older backend without activityStatus', () => {
  const product = mapInventoryProductFromApi({ id: 1, activityId: 5, isPreOrder: true })

  assert.equal(product.activityStatus, null)
  assert.equal(product.isPreOrder, true)
  assert.equal(product.activityName, '')
})

test('mapInventoryProductFromApi only treats a strict true as pre-order', () => {
  assert.equal(mapInventoryProductFromApi({ id: 1, isPreOrder: 'true' }).isPreOrder, false)
  assert.equal(mapInventoryProductFromApi({ id: 1 }).isPreOrder, false)
})
