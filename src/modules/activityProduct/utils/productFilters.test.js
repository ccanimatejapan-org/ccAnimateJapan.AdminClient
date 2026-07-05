import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  PRODUCT_STOCK_FILTERS,
  createEmptyProductFilters,
  hasActiveProductFilters,
  matchesProductFilters,
} from './productFilters.js'

test('createEmptyProductFilters produces blank defaults', () => {
  assert.deepEqual(createEmptyProductFilters(), {
    name: '',
    productTypeIds: [],
    stockStatuses: [],
  })
})

test('hasActiveProductFilters detects any populated filter', () => {
  assert.equal(hasActiveProductFilters(createEmptyProductFilters()), false)
  assert.equal(hasActiveProductFilters({ name: '  ', productTypeIds: [], stockStatuses: [] }), false)
  assert.equal(hasActiveProductFilters({ name: 'cup', productTypeIds: [], stockStatuses: [] }), true)
  assert.equal(hasActiveProductFilters({ name: '', productTypeIds: [2], stockStatuses: [] }), true)
  assert.equal(
    hasActiveProductFilters({ name: '', productTypeIds: [], stockStatuses: [PRODUCT_STOCK_FILTERS.inStock] }),
    true,
  )
})

test('matchesProductFilters applies name (case-insensitive), type and stock filters', () => {
  const product = { name: 'Red Cup', productTypeId: 2, isOutStock: false }

  assert.equal(matchesProductFilters(product, createEmptyProductFilters()), true)
  assert.equal(matchesProductFilters(product, { name: 'cup', productTypeIds: [], stockStatuses: [] }), true)
  assert.equal(matchesProductFilters(product, { name: 'mug', productTypeIds: [], stockStatuses: [] }), false)

  assert.equal(matchesProductFilters(product, { name: '', productTypeIds: [2], stockStatuses: [] }), true)
  assert.equal(matchesProductFilters(product, { name: '', productTypeIds: ['3'], stockStatuses: [] }), false)

  assert.equal(
    matchesProductFilters(product, { name: '', productTypeIds: [], stockStatuses: [PRODUCT_STOCK_FILTERS.inStock] }),
    true,
  )
  assert.equal(
    matchesProductFilters(product, { name: '', productTypeIds: [], stockStatuses: [PRODUCT_STOCK_FILTERS.outStock] }),
    false,
  )
  assert.equal(
    matchesProductFilters(
      { ...product, isOutStock: true },
      { name: '', productTypeIds: [], stockStatuses: [PRODUCT_STOCK_FILTERS.outStock] },
    ),
    true,
  )
})
