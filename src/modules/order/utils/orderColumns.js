export const createOrderColumns = () => [
  { key: 'id', label: '訂單', sortable: true, getValue: (order) => Number(order.id || 0) },
  { key: 'subscriberName', label: '訂購人', sortable: true, getValue: (order) => order.subscriberName || '' },
  { key: 'subscriberBank', label: '帳號後五碼', sortable: true, getValue: (order) => order.subscriberBank || '' },
  { key: 'total', label: '金額', sortable: true, getValue: (order) => Number(order.total || 0) },
  { key: 'orderStatus', label: '訂單狀態', sortable: true, getValue: (order) => Number(order.orderStatus || 0) },
  { key: 'createdAt', label: '建立時間', sortable: true, getValue: (order) => new Date(order.createdAt || 0) },
  { key: 'actions', label: '', sortable: false },
]
