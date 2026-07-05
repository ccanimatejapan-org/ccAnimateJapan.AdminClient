import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  buildCreateOrderPayload,
  buildUpdateOrderPayload,
  createEmptyOrderForm,
  createEmptyOrderItem,
  validateOrderForm,
} from './orderForm.js'

const makeValidForm = (overrides = {}) => ({
  subscriberName: '王小明',
  subscriberEmail: 'buyer@example.com',
  subscriberBank: '12345',
  deliveryTypeId: 2,
  orderStatus: 1,
  paymentStatus: 5,
  deliveryStatus: 6,
  items: [{ productId: 3, amount: 2, info: '' }],
  ...overrides,
})

test('createEmptyOrderItem and createEmptyOrderForm produce the expected defaults', () => {
  assert.deepEqual(createEmptyOrderItem(), { productId: '', amount: 1, info: '' })

  const form = createEmptyOrderForm()
  assert.equal(form.subscriberName, '')
  assert.equal(form.deliveryTypeId, '')
  assert.equal(form.orderStatus, 1)
  assert.equal(form.paymentStatus, 1)
  assert.equal(form.deliveryStatus, 1)
  assert.deepEqual(form.items, [{ productId: '', amount: 1, info: '' }])
})

test('buildCreateOrderPayload coerces numbers, trims strings and nulls blank info', () => {
  const form = makeValidForm({
    subscriberName: '  王小明  ',
    subscriberBank: '  12345  ',
    deliveryTypeId: '2',
    items: [
      { productId: '3', amount: '2', info: '  規格說明超過十個字會被截斷  ' },
      { productId: 4, amount: 1, info: '' },
    ],
  })

  assert.deepEqual(buildCreateOrderPayload(form, '7'), {
    activityId: 7,
    subscriberName: '王小明',
    subscriberEmail: 'buyer@example.com',
    subscriberBank: '12345',
    deliveryTypeId: 2,
    items: [
      { productId: 3, amount: 2, info: '規格說明超過十個字會' },
      { productId: 4, amount: 1, info: null },
    ],
  })
})

test('buildUpdateOrderPayload adds the three status fields as numbers', () => {
  const form = makeValidForm({ orderStatus: '3', paymentStatus: '2', deliveryStatus: '4' })
  const payload = buildUpdateOrderPayload(form, 7)

  assert.equal(payload.orderStatus, 3)
  assert.equal(payload.paymentStatus, 2)
  assert.equal(payload.deliveryStatus, 4)
  assert.equal(payload.activityId, 7)
})

test('validateOrderForm returns null for a valid create form', () => {
  assert.equal(validateOrderForm(makeValidForm(), { isEdit: false, activityId: 7 }), null)
})

test('validateOrderForm lists every missing required field for a blank create form', () => {
  const message = validateOrderForm(createEmptyOrderForm(), { isEdit: false, activityId: undefined })
  assert.equal(message, '請填寫：活動、訂購人、Email、帳號後五碼、配送方式、第 1 筆商品。')
})

test('validateOrderForm checks status fields only when editing', () => {
  const form = makeValidForm({ orderStatus: 999, paymentStatus: 999, deliveryStatus: 999 })

  assert.equal(validateOrderForm(form, { isEdit: false, activityId: 7 }), null)
  assert.equal(
    validateOrderForm(form, { isEdit: true, activityId: 7 }),
    '請填寫：訂單狀態、付款狀態、物流狀態。',
  )
})

test('validateOrderForm rejects malformed email after required checks pass', () => {
  const form = makeValidForm({ subscriberEmail: 'not-an-email' })
  assert.equal(validateOrderForm(form, { isEdit: false, activityId: 7 }), 'Email 格式不正確。')
})
