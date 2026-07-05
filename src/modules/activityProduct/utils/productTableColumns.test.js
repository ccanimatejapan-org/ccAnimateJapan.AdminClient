import { test } from 'node:test'
import assert from 'node:assert/strict'

import { createProductTableColumns } from './productTableColumns.js'

const deps = {
  getProductTypeName: (id) => `type-${id}`,
  getCostTwd: (product) => product.cost,
  stripHtml: (value) => `stripped:${value}`,
}

test('createProductTableColumns returns the default ordered columns with an actions column', () => {
  const columns = createProductTableColumns(deps)

  assert.deepEqual(
    columns.map((column) => column.key),
    [
      'name',
      'image',
      'productType',
      'costTwd',
      'price',
      'amount',
      'activityKind',
      'stockStatus',
      'info',
      'updatedAt',
      'actions',
    ],
  )
  assert.equal(columns.find((column) => column.key === 'actions').sortable, false)
})

test('createProductTableColumns inserts orderedAmount after amount and can drop actions', () => {
  const withOrdered = createProductTableColumns({ ...deps, includeOrderedAmount: true })
  assert.deepEqual(
    withOrdered.map((column) => column.key),
    [
      'name',
      'image',
      'productType',
      'costTwd',
      'price',
      'amount',
      'orderedAmount',
      'activityKind',
      'stockStatus',
      'info',
      'updatedAt',
      'actions',
    ],
  )

  const noActions = createProductTableColumns({ ...deps, includeActions: false })
  assert.equal(noActions.some((column) => column.key === 'actions'), false)
})

test('createProductTableColumns getValue helpers delegate to the injected dependencies', () => {
  const byKey = Object.fromEntries(
    createProductTableColumns(deps).map((column) => [column.key, column]),
  )

  assert.equal(byKey.productType.getValue({ productTypeId: 7 }), 'type-7')
  assert.equal(byKey.costTwd.getValue({ cost: 42 }), 42)
  assert.equal(byKey.price.getValue({ price: '12' }), 12)
  assert.equal(byKey.info.getValue({ info: '<b>x</b>' }), 'stripped:<b>x</b>')
  assert.equal(byKey.image.getValue({ images: [{ productImageUrl: 'a.png' }] }), 'a.png')
  assert.equal(byKey.activityKind.getValue({ isPreOrder: true }), '預購')
  assert.equal(byKey.stockStatus.getValue({ isOutStock: true }), '缺貨')
  assert.equal(byKey.updatedAt.getValue({ updateAt: 'u', createdAt: 'c' }), 'u')
  assert.equal(byKey.updatedAt.getValue({ createdAt: 'c' }), 'c')
})
