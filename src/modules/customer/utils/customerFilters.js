export const CUSTOMER_STATUS_FILTERS = Object.freeze({
  ALL: 'all',
  WITH_ORDERS: 'withOrders',
  NO_ORDERS: 'noOrders',
  DELETED: 'deleted',
})

export const CUSTOMER_TABS = Object.freeze([
  { key: CUSTOMER_STATUS_FILTERS.ALL, label: '全部', countKey: 'all' },
  { key: CUSTOMER_STATUS_FILTERS.WITH_ORDERS, label: '有訂單', countKey: 'withOrders' },
  { key: CUSTOMER_STATUS_FILTERS.NO_ORDERS, label: '尚未下單', countKey: 'noOrders' },
  { key: CUSTOMER_STATUS_FILTERS.DELETED, label: '已停用', countKey: 'deleted' },
])

export const getCustomerTabCount = (counts, countKey) => {
  const value = Number(counts?.[countKey] || 0)
  return Number.isFinite(value) ? value : 0
}

export const getCustomerStatusLabel = (isDelete) => (isDelete ? '已停用' : '使用中')

export const getCustomerDisplayName = (customer) =>
  customer?.displayName || customer?.name || (customer?.id ? `#${customer.id}` : '未命名顧客')
