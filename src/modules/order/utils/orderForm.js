import {
  formatRequiredFieldsMessage,
  hasPositiveNumberValue,
  isBlankValue,
} from '@/shared/utils/validation'
import {
  isValidDeliveryStatus,
  isValidOrderStatus,
  isValidPaymentStatus,
} from '@/modules/order/utils/orderStatuses'

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim())

export const createEmptyOrderItem = () => ({
  productId: '',
  amount: 1,
  info: '',
})

export const createEmptyOrderForm = () => ({
  subscriberName: '',
  subscriberEmail: '',
  subscriberBank: '',
  deliveryTypeId: '',
  orderStatus: 1,
  paymentStatus: 1,
  deliveryStatus: 1,
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
    info: String(item.info || '').trim().slice(0, 10) || null,
  })),
})

export const buildCreateOrderPayload = (form, activityId) => buildBaseOrderPayload(form, activityId)

export const buildUpdateOrderPayload = (form, activityId) => ({
  ...buildBaseOrderPayload(form, activityId),
  orderStatus: Number(form.orderStatus),
  paymentStatus: Number(form.paymentStatus),
  deliveryStatus: Number(form.deliveryStatus),
})

export const validateOrderForm = (form, { isEdit = false, activityId } = {}) => {
  const missingFields = []
  const orderItems = Array.isArray(form.items) ? form.items : []

  if (!hasPositiveNumberValue(activityId)) missingFields.push('活動')
  if (isBlankValue(form.subscriberName)) missingFields.push('訂購人')
  if (isBlankValue(form.subscriberEmail)) missingFields.push('Email')
  if (isBlankValue(form.subscriberBank)) missingFields.push('帳號後五碼')
  if (!hasPositiveNumberValue(form.deliveryTypeId)) missingFields.push('配送方式')

  if (isEdit) {
    if (!isValidOrderStatus(form.orderStatus)) missingFields.push('訂單狀態')
    if (!isValidPaymentStatus(form.paymentStatus)) missingFields.push('付款狀態')
    if (!isValidDeliveryStatus(form.deliveryStatus)) missingFields.push('物流狀態')
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
