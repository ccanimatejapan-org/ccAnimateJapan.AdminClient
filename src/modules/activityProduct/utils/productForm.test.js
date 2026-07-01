import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  buildProductPayload,
  createEmptyProductForm,
  getSaleRateFromProduct,
} from './productForm.js'

const makeForm = (overrides = {}) => ({
  name: '  Widget  ',
  japanCost: '100',
  rate: '0.2',
  saleRate: '0.24',
  price: '120',
  productTypeId: '3',
  info: '  note  ',
  isOutStock: true,
  amount: '5',
  ...overrides,
})

test('createEmptyProductForm produces the expected defaults', () => {
  assert.deepEqual(createEmptyProductForm(), {
    name: '',
    japanCost: 0,
    rate: 0.2,
    saleRate: 0.24,
    price: 0,
    amount: 0,
    isOutStock: false,
    productTypeId: 1,
    info: '',
  })
})

test('getSaleRateFromProduct derives price/japanCost rounded to four decimals', () => {
  assert.equal(getSaleRateFromProduct({ japanCost: 100, price: 24 }), 0.24)
  assert.equal(getSaleRateFromProduct({ japanCost: 3, price: 1 }), 0.3333)
})

test('getSaleRateFromProduct falls back to product.rate then 0.24 when japanCost <= 0', () => {
  assert.equal(getSaleRateFromProduct({ japanCost: 0, price: 50, rate: 0.3 }), 0.3)
  assert.equal(getSaleRateFromProduct({ japanCost: 0, price: 50 }), 0.24)
  assert.equal(getSaleRateFromProduct({ japanCost: -5, price: 50, rate: 'nope' }), 0.24)
})

test('buildProductPayload trims/coerces and adds create-only amount for a spot activity', () => {
  assert.deepEqual(
    buildProductPayload(makeForm(), {
      isPreOrderActivity: false,
      isSpotActivity: true,
      isEditing: false,
    }),
    {
      name: 'Widget',
      japanCost: 100,
      rate: 0.2,
      price: 120,
      productTypeId: 3,
      info: 'note',
      amount: 5,
    },
  )
})

test('buildProductPayload clamps negative create amount to zero and zeroes non-spot amount', () => {
  const spot = buildProductPayload(makeForm({ amount: '-3' }), {
    isPreOrderActivity: false,
    isSpotActivity: true,
    isEditing: false,
  })
  assert.equal(spot.amount, 0)

  const preorder = buildProductPayload(makeForm(), {
    isPreOrderActivity: true,
    isSpotActivity: false,
    isEditing: false,
  })
  assert.equal(preorder.amount, 0)
  assert.equal(preorder.isOutStock, true)
})

test('buildProductPayload omits amount when editing and sanitizes the info html', () => {
  const payload = buildProductPayload(
    makeForm({ info: '  <script>alert(1)</script>safe  ', isOutStock: false }),
    { isPreOrderActivity: true, isSpotActivity: true, isEditing: true },
  )

  assert.equal('amount' in payload, false)
  assert.equal(payload.isOutStock, false)
  assert.equal(payload.info, 'safe')
})
