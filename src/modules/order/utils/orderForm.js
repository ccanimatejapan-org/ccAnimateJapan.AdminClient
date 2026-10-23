import {
  formatRequiredFieldsMessage,
  hasPositiveNumberValue,
  isBlankValue,
} from '@/shared/utils/validation'
import {
  isValidOrderStatus,
  isValidPaymentStatus,
} from '@/modules/order/utils/orderStatuses'

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim())

// 商品備註 / 規格長度上限：與顧客端加入購物車的備註上限（WebAPI AddCartItemHandler.MaxNoteLength = 80、
// WebClient 的 cartStore / cartMapper / ProductAddDialog 也都是 80）以及後端 AdminAPI 的
// OrderItemRules.MaxInfoLength 一致；比顧客端短的話，編輯訂單存檔會把備註截斷。調整時這幾處要一起改。
export const ORDER_ITEM_INFO_MAX_LENGTH = 80

const clampItemInfo = (value) => String(value || '').trim().slice(0, ORDER_ITEM_INFO_MAX_LENGTH)

export const createEmptyOrderItem = () => ({
  productId: '',
  amount: 1,
  info: '',
})

// 訂單明細的一筆商品 → 編輯表單的一列。
export const createOrderItemFromDetail = (item) => ({
  productId: item.productId,
  amount: item.amount,
  info: clampItemInfo(item.info),
})

export const createEmptyOrderForm = () => ({
  subscriberName: '',
  subscriberEmail: '',
  subscriberBank: '',
  deliveryTypeId: '',
  orderStatus: 1,
  paymentStatus: 1,
  shippingFee: 0,
  shippingPaymentStatus: 0,
  items: [createEmptyOrderItem()],
})

export const buildBaseOrderPayload = (form, activityId) => ({
  activityId: Number(activityId),
  subscriberName: form.subscriberName.trim(),
  subscriberEmail: form.subscriberEmail.trim(),
  subscriberBank: form.subscriberBank.trim(),
  deliveryTypeId: Number(form.deliveryTypeId),
  items: form.items.map((item) => ({
    productId: Number(item.productId),
    amount: Number(item.amount),
    info: clampItemInfo(item.info) || null,
  })),
})

export const buildCreateOrderPayload = (form, activityId) => buildBaseOrderPayload(form, activityId)

export const buildUpdateOrderPayload = (form, activityId) => ({
  ...buildBaseOrderPayload(form, activityId),
  orderStatus: Number(form.orderStatus),
  paymentStatus: Number(form.paymentStatus),
  shippingFee: Number(form.shippingFee) || 0,
  shippingPaymentStatus: Number(form.shippingPaymentStatus) || 0,
})

export const validateOrderForm = (form, { isEdit = false, activityId } = {}) => {
  const missingFields = []
  const orderItems = Array.isArray(form.items) ? form.items : []

  if (!hasPositiveNumberValue(activityId)) missingFields.push('活動')
  if (isBlankValue(form.subscriberName)) missingFields.push('訂購人')
  if (isBlankValue(form.subscriberEmail)) missingFields.push('Email')
  if (!hasPositiveNumberValue(form.deliveryTypeId)) missingFields.push('配送方式')

  if (isEdit) {
    if (!isValidOrderStatus(form.orderStatus)) missingFields.push('訂單狀態')
    if (!isValidPaymentStatus(form.paymentStatus)) missingFields.push('付款狀態')
  }

  if (orderItems.length === 0) {
    missingFields.push('至少一筆商品')
  } else {
    orderItems.forEach((item, index) => {
      const itemLabel = `第 ${index + 1} 筆商品`

      if (!hasPositiveNumberValue(item.productId)) missingFields.push(itemLabel)
      if (!hasPositiveNumberValue(item.amount)) missingFields.push(`${itemLabel}數量`)
    })
  }

  if (missingFields.length) {
    return formatRequiredFieldsMessage(missingFields)
  }

  if (!isValidEmail(form.subscriberEmail)) {
    return 'Email 格式不正確。'
  }

  return null
}
