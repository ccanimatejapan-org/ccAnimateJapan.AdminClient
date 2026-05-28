export const ORDER_STATUS_OPTIONS = [
  { value: 1, label: '顧客已下單' },
  { value: 2, label: '已寄送訂單確認信' },
  { value: 3, label: '顧客已付款' },
  { value: 4, label: '預購已完成' },
  { value: 5, label: '商品已入庫' },
  { value: 6, label: '已出貨給顧客' },
  { value: 7, label: '訂單已完成' },
  { value: 8, label: '訂單已取消' },
]

export const ORDER_STATUS_FILTER_OPTIONS = [
  { value: '', label: '全部狀態' },
  ...ORDER_STATUS_OPTIONS,
]

export const PAYMENT_STATUS_OPTIONS = [
  { value: 5, label: '尚未付款' },
  { value: 1, label: '已寄送訂單確認信' },
  { value: 2, label: '款項已收到' },
  { value: 3, label: '退款處理中' },
  { value: 4, label: '退款已完成' },
]

export const DELIVERY_STATUS_OPTIONS = [
  { value: 6, label: '尚未處理物流' },
  { value: 1, label: '賣貨便網址已提供' },
  { value: 2, label: '顧客已完成物流下單' },
  { value: 3, label: '商品已寄出' },
  { value: 4, label: '商品已到店' },
  { value: 5, label: '顧客已取貨' },
]

export const ORDER_PRODUCT_STATUS_OPTIONS = [
  { value: 1, label: '尚未出貨' },
  { value: 2, label: '已出貨' },
  { value: 3, label: '缺貨' },
]

const getStatusOptionLabel = (options, value) => {
  const numberValue = Number(value)
  const option = options.find((statusOption) => Number(statusOption.value) === numberValue)
  return option?.label || `#${value || '-'}`
}

const isValidStatus = (options, value) => {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) && options.some((option) => Number(option.value) === numberValue)
}

export const getOrderStatusLabel = (value) => getStatusOptionLabel(ORDER_STATUS_OPTIONS, value)
export const getPaymentStatusLabel = (value) => getStatusOptionLabel(PAYMENT_STATUS_OPTIONS, value)
export const getDeliveryStatusLabel = (value) => getStatusOptionLabel(DELIVERY_STATUS_OPTIONS, value)
export const getOrderProductStatusLabel = (value) => getStatusOptionLabel(ORDER_PRODUCT_STATUS_OPTIONS, value)

export const isValidOrderStatus = (value) => isValidStatus(ORDER_STATUS_OPTIONS, value)
export const isValidPaymentStatus = (value) => isValidStatus(PAYMENT_STATUS_OPTIONS, value)
export const isValidDeliveryStatus = (value) => isValidStatus(DELIVERY_STATUS_OPTIONS, value)
