import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  buildProductPayload,
  createEmptyProductForm,
  getProductLimitError,
  getSaleRateFromProduct,
} from './productForm.js'

const makeForm = (overrides = {}) => ({
  name: '  Widget  ',
  japanCost: '100',
  rate: '0.202',
  saleRate: '0.225',
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
    rate: 0.202,
    saleRate: 0.225,
    price: 0,
    amount: 0,
    isOutStock: false,
    productTypeId: 1,
    info: '',
  })
})

test('getSaleRateFromProduct derives price/japanCost rounded to four decimals', () => {
  assert.equal(getSaleRateFromProduct({ japanCost: 100, price: 22.5 }), 0.225)
  assert.equal(getSaleRateFromProduct({ japanCost: 3, price: 1 }), 0.3333)
})

test('getSaleRateFromProduct falls back to product.rate then 0.225 when japanCost <= 0', () => {
  assert.equal(getSaleRateFromProduct({ japanCost: 0, price: 50, rate: 0.3 }), 0.3)
  assert.equal(getSaleRateFromProduct({ japanCost: 0, price: 50 }), 0.225)
  assert.equal(getSaleRateFromProduct({ japanCost: -5, price: 50, rate: 'nope' }), 0.225)
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
      rate: 0.202,
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

test('getProductLimitError accepts normal values and values exactly at the limit', () => {
  assert.equal(getProductLimitError(makeForm()), '')
  assert.equal(
    getProductLimitError(
      makeForm({ japanCost: 10_000_000, rate: 10, price: 10_000_000, amount: 100_000 }),
      { checkAmount: true },
    ),
    '',
  )
})

test('getProductLimitError names the field that is above the limit', () => {
  assert.match(getProductLimitError(makeForm({ japanCost: 10_000_001 })), /成本\(日\)/)
  assert.match(getProductLimitError(makeForm({ rate: 10.5 })), /成本匯率/)
  assert.match(getProductLimitError(makeForm({ price: 10_000_001 })), /售價/)
  assert.match(getProductLimitError(makeForm({ amount: 100_001 }), { checkAmount: true }), /數量/)
})

test('getProductLimitError ignores the amount unless it is being created for a spot activity', () => {
  assert.equal(getProductLimitError(makeForm({ amount: 999_999_999 })), '')
})
