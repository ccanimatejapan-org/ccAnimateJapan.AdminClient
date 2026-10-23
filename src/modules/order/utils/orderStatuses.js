export const ORDER_STATUS_OPTIONS = [
  { value: 1, label: '顧客已下單' },
  { value: 2, label: '已寄送訂單確認信' },
  { value: 3, label: '顧客已付款' },
  { value: 4, label: '預購已完成' },
  { value: 5, label: '商品已入庫' },
  { value: 6, label: '已聯絡顧客出貨事項' },
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
  { value: 4, label: '退款已完成' },
]

export const ORDER_PRODUCT_STATUS_OPTIONS = [
  { value: 1, label: '尚未出貨' },
  { value: 2, label: '已出貨' },
  { value: 3, label: '缺貨' },
]

export const SHIPPING_PAYMENT_STATUS_OPTIONS = [
  { value: 1, label: '未付款自行運費' },
  { value: 2, label: '已付款自行運費' },
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
export const getOrderProductStatusLabel = (value) => getStatusOptionLabel(ORDER_PRODUCT_STATUS_OPTIONS, value)

export const getShippingPaymentStatusLabel = (value) => getStatusOptionLabel(SHIPPING_PAYMENT_STATUS_OPTIONS, value)

// 訂單進入「預購已完成」（4）之後（含入庫、出貨、完成、取消）就不能再改商品與數量；
// 與後端 OrderItemRules.AreItemsLocked 一致，要改商品必須先把狀態調回 4 之前並存檔。
const ORDER_ITEMS_LOCKED_FROM_STATUS = 4

export const isOrderItemsLocked = (orderStatus) =>
  Number(orderStatus) >= ORDER_ITEMS_LOCKED_FROM_STATUS

export const isValidOrderStatus = (value) => isValidStatus(ORDER_STATUS_OPTIONS, value)
export const isValidPaymentStatus = (value) => isValidStatus(PAYMENT_STATUS_OPTIONS, value)
export const isValidShippingPaymentStatus = (value) => isValidStatus(SHIPPING_PAYMENT_STATUS_OPTIONS, value)
