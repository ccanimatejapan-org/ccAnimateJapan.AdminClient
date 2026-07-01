import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ref } from 'vue'

import { createProductTypeNameGetter, getCostTwd } from './productPricing.js'

test('getCostTwd multiplies japanCost by rate and rounds to a whole TWD amount', () => {
  assert.equal(getCostTwd({ japanCost: 100, rate: 0.2 }), 20)
  assert.equal(getCostTwd({ japanCost: '150', rate: '0.21' }), 32)
  assert.equal(getCostTwd({ japanCost: 'x', rate: 0.2 }), 0)
})

test('createProductTypeNameGetter resolves names from a plain array, with #id / - fallbacks', () => {
  const getName = createProductTypeNameGetter([
    { id: 1, name: '公仔' },
    { id: 2, name: '吊飾' },
  ])

  assert.equal(getName(1), '公仔')
  assert.equal(getName('2'), '吊飾')
  assert.equal(getName(99), '#99')
  assert.equal(getName(0), '-')
  assert.equal(getName('abc'), '-')
})

test('createProductTypeNameGetter reads through a ref', () => {
  const typesRef = ref([{ id: 5, name: '海報' }])
  const getName = createProductTypeNameGetter(typesRef)

  assert.equal(getName(5), '海報')
  assert.equal(getName(6), '#6')
})
