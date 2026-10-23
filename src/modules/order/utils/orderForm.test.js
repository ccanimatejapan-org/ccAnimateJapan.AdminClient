import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  buildCreateOrderPayload,
  buildUpdateOrderPayload,
  createEmptyOrderForm,
  createEmptyOrderItem,
  createOrderItemFromDetail,
  ORDER_ITEM_INFO_MAX_LENGTH,
  validateOrderForm,
} from './orderForm.js'

const makeValidForm = (overrides = {}) => ({
  subscriberName: '王小明',
  subscriberEmail: 'buyer@example.com',
  subscriberBank: '12345',
  deliveryTypeId: 2,
  orderStatus: 1,
  paymentStatus: 5,
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
  assert.deepEqual(form.items, [{ productId: '', amount: 1, info: '' }])
})

test('buildCreateOrderPayload coerces numbers, trims strings and nulls blank info', () => {
  const form = makeValidForm({
    subscriberName: '  王小明  ',
    subscriberBank: '  12345  ',
    deliveryTypeId: '2',
    items: [
      { productId: '3', amount: '2', info: '  規格說明超過十個字也不會被截斷  ' },
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
      { productId: 3, amount: 2, info: '規格說明超過十個字也不會被截斷' },
      { productId: 4, amount: 1, info: null },
    ],
  })
})

test('item info limit matches the customer cart note limit (80) so editing never truncates a note', () => {
  assert.equal(ORDER_ITEM_INFO_MAX_LENGTH, 80)

  const customerNote = '請幫我選L號黑色，附購物袋'
  const exactlyAtLimit = 'a'.repeat(ORDER_ITEM_INFO_MAX_LENGTH)
  const overLimit = 'b'.repeat(ORDER_ITEM_INFO_MAX_LENGTH + 1)

  const payload = buildUpdateOrderPayload(
    makeValidForm({
      items: [
        { productId: 3, amount: 1, info: customerNote },
        { productId: 4, amount: 1, info: exactlyAtLimit },
        { productId: 5, amount: 1, info: overLimit },
      ],
    }),
    7,
  )

  assert.equal(payload.items[0].info, customerNote)
  assert.equal(payload.items[1].info, exactlyAtLimit)
  assert.equal(payload.items[2].info, 'b'.repeat(ORDER_ITEM_INFO_MAX_LENGTH))
})

test('createOrderItemFromDetail keeps a long customer note when loading the edit form', () => {
  const customerNote = '請幫我選L號黑色，附購物袋，如果缺貨請改深藍色'

  assert.deepEqual(createOrderItemFromDetail({ productId: 3, amount: 2, info: customerNote }), {
    productId: 3,
    amount: 2,
    info: customerNote,
  })
  assert.deepEqual(createOrderItemFromDetail({ productId: 4, amount: 1, info: null }), {
    productId: 4,
    amount: 1,
    info: '',
  })
  assert.equal(
    createOrderItemFromDetail({ productId: 5, amount: 1, info: 'c'.repeat(200) }).info.length,
    ORDER_ITEM_INFO_MAX_LENGTH,
  )
})

test('buildUpdateOrderPayload adds the status fields as numbers', () => {
  const form = makeValidForm({ orderStatus: '3', paymentStatus: '2' })
  const payload = buildUpdateOrderPayload(form, 7)

  assert.equal(payload.orderStatus, 3)
  assert.equal(payload.paymentStatus, 2)
  assert.equal(payload.activityId, 7)
})

test('validateOrderForm returns null for a valid create form', () => {
  assert.equal(validateOrderForm(makeValidForm(), { isEdit: false, activityId: 7 }), null)
})

test('validateOrderForm lists every missing required field for a blank create form', () => {
  const message = validateOrderForm(createEmptyOrderForm(), { isEdit: false, activityId: undefined })
  assert.equal(message, '請填寫：活動、訂購人、Email、配送方式、第 1 筆商品。')
})

test('validateOrderForm does not require the bank account last five digits', () => {
  const blankBank = makeValidForm({ subscriberBank: '' })
  const whitespaceBank = makeValidForm({ subscriberBank: '   ' })

  assert.equal(validateOrderForm(blankBank, { isEdit: false, activityId: 7 }), null)
  assert.equal(validateOrderForm(whitespaceBank, { isEdit: true, activityId: 7 }), null)
  assert.equal(buildUpdateOrderPayload(whitespaceBank, 7).subscriberBank, '')
})

test('validateOrderForm checks status fields only when editing', () => {
  const form = makeValidForm({ orderStatus: 999, paymentStatus: 999 })

  assert.equal(validateOrderForm(form, { isEdit: false, activityId: 7 }), null)
  assert.equal(
    validateOrderForm(form, { isEdit: true, activityId: 7 }),
    '請填寫：訂單狀態、付款狀態。',
  )
})

test('validateOrderForm rejects malformed email after required checks pass', () => {
  const form = makeValidForm({ subscriberEmail: 'not-an-email' })
  assert.equal(validateOrderForm(form, { isEdit: false, activityId: 7 }), 'Email 格式不正確。')
})
