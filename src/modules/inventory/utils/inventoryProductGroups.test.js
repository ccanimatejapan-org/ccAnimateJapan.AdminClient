import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  INVENTORY_MODES,
  UNCLASSIFIED_ACTIVITY_ID,
  UNCLASSIFIED_ACTIVITY_NAME,
  UNNAMED_ACTIVITY_NAME,
  countInventoryProductsByMode,
  createInventoryActivityCollapseKey,
  createInventoryActivityGroups,
  filterInventoryProductsByMode,
  getInventoryModeEmptyText,
} from './inventoryProductGroups.js'

test('puts false and missing isPreOrder values in ready-stock mode', () => {
  const products = [
    { id: 1, isPreOrder: false },
    { id: 2, isPreOrder: true },
    { id: 3 },
    { id: 4, isPreOrder: null },
  ]

  assert.deepEqual(
    filterInventoryProductsByMode(products, INVENTORY_MODES.readyStock).map((product) => product.id),
    [1, 3, 4],
  )
})

test('puts only strict true isPreOrder values in pre-order mode', () => {
  const products = [
    { id: 1, isPreOrder: false },
    { id: 2, isPreOrder: true },
    { id: 3 },
  ]

  assert.deepEqual(
    filterInventoryProductsByMode(products, INVENTORY_MODES.preOrder).map((product) => product.id),
    [2],
  )
})

test('counts filtered products for both inventory modes', () => {
  const products = [
    { id: 1, isPreOrder: false },
    { id: 2, isPreOrder: true },
    { id: 3, isPreOrder: true },
    { id: 4 },
  ]

  assert.deepEqual(countInventoryProductsByMode(products), {
    [INVENTORY_MODES.readyStock]: 2,
    [INVENTORY_MODES.preOrder]: 2,
  })
})

test('groups products with the same activity id and preserves product order', () => {
  const products = [
    { id: 'second', activityId: 10, activityName: '活動 A' },
    { id: 'first', activityId: 10, activityName: '活動 A' },
  ]

  const groups = createInventoryActivityGroups(products)

  assert.equal(groups.length, 1)
  assert.equal(groups[0].activityId, 10)
  assert.equal(groups[0].activityName, '活動 A')
  assert.equal(groups[0].count, 2)
  assert.deepEqual(groups[0].products.map((product) => product.id), ['second', 'first'])
})

test('sorts separate activity groups by numeric activity id descending', () => {
  const products = [
    { id: 1, activityId: 3, activityName: '舊活動' },
    { id: 2, activityId: '12', activityName: '新活動' },
    { id: 3, activityId: 7, activityName: '中間活動' },
  ]

  assert.deepEqual(
    createInventoryActivityGroups(products).map((group) => group.activityId),
    [12, 7, 3],
  )
})

test('puts invalid activity ids in one final unclassified group', () => {
  const products = [
    { id: 1, activityId: 10, activityName: '活動 A' },
    { id: 2, activityId: null, activityName: '' },
    { id: 3, activityName: '缺少 ID' },
    { id: 4, activityId: 0, activityName: '無效 ID' },
  ]

  const unclassifiedGroup = createInventoryActivityGroups(products).at(-1)

  assert.equal(unclassifiedGroup.activityId, UNCLASSIFIED_ACTIVITY_ID)
  assert.equal(unclassifiedGroup.activityName, UNCLASSIFIED_ACTIVITY_NAME)
  assert.deepEqual(unclassifiedGroup.products.map((product) => product.id), [2, 3, 4])
})

test('uses unnamed activity text when a valid id has no name', () => {
  const groups = createInventoryActivityGroups([
    { id: 1, activityId: 10, activityName: '' },
  ])

  assert.equal(groups[0].activityName, UNNAMED_ACTIVITY_NAME)
})

test('uses a later non-empty activity name for the same group', () => {
  const groups = createInventoryActivityGroups([
    { id: 1, activityId: 10, activityName: '' },
    { id: 2, activityId: 10, activityName: '活動 A' },
  ])

  assert.equal(groups[0].activityName, '活動 A')
})

test('returns an empty group list for an empty or missing product list', () => {
  assert.deepEqual(createInventoryActivityGroups([]), [])
  assert.deepEqual(createInventoryActivityGroups(), [])
})

test('does not mutate the input array or product objects', () => {
  const firstProduct = { id: 1, activityId: 2, activityName: '活動 A' }
  const secondProduct = { id: 2, activityId: 1, activityName: '活動 B' }
  const products = [firstProduct, secondProduct]

  const groups = createInventoryActivityGroups(products)

  assert.deepEqual(products, [firstProduct, secondProduct])
  assert.equal(groups[0].products[0], firstProduct)
  assert.equal(groups[1].products[0], secondProduct)
})

test('creates mode-specific collapse keys including unclassified groups', () => {
  assert.equal(
    createInventoryActivityCollapseKey(INVENTORY_MODES.readyStock, 10),
    'readyStock:10',
  )
  assert.equal(
    createInventoryActivityCollapseKey(INVENTORY_MODES.preOrder, 10),
    'preOrder:10',
  )
  assert.equal(
    createInventoryActivityCollapseKey(
      INVENTORY_MODES.readyStock,
      UNCLASSIFIED_ACTIVITY_ID,
    ),
    'readyStock:unclassified',
  )
})

test('returns mode-specific empty text before and after filters', () => {
  assert.equal(
    getInventoryModeEmptyText({
      mode: INVENTORY_MODES.readyStock,
      modeTotalCount: 0,
      modeFilteredCount: 0,
    }),
    '目前沒有現貨商品',
  )
  assert.equal(
    getInventoryModeEmptyText({
      mode: INVENTORY_MODES.preOrder,
      modeTotalCount: 0,
      modeFilteredCount: 0,
    }),
    '目前沒有預購商品',
  )
  assert.equal(
    getInventoryModeEmptyText({
      mode: INVENTORY_MODES.readyStock,
      modeTotalCount: 3,
      modeFilteredCount: 0,
    }),
    '沒有符合篩選條件的商品',
  )
  assert.equal(
    getInventoryModeEmptyText({
      mode: INVENTORY_MODES.preOrder,
      modeTotalCount: 3,
      modeFilteredCount: 2,
    }),
    '',
  )
})
