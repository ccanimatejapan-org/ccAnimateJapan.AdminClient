import { getCustomerDisplayName } from '@/modules/customer/utils/customerFilters'

export const createCustomerTableColumns = () => [
  {
    key: 'name',
    label: '顧客',
    sortable: true,
    getValue: (item) => getCustomerDisplayName(item),
  },
  {
    key: 'email',
    label: 'Email',
    sortable: true,
    getValue: (item) => item.email || '',
  },
  {
    key: 'phone',
    label: '電話',
    sortable: true,
    getValue: (item) => item.phone || '',
  },
  {
    key: 'orderCount',
    label: '訂單數',
    sortable: true,
    getValue: (item) => Number(item.orderCount || 0),
  },
  {
    key: 'totalSpent',
    label: '累計消費',
    sortable: true,
    getValue: (item) => Number(item.totalSpent || 0),
  },
  {
    key: 'lastOrderedAt',
    label: '最近下單',
    sortable: true,
    getValue: (item) => new Date(item.lastOrderedAt || 0),
  },
  {
    key: 'status',
    label: '狀態',
    sortable: true,
    getValue: (item) => (item.isDelete ? 1 : 0),
  },
  {
    key: 'actions',
    label: '操作',
    sortable: false,
  },
]
