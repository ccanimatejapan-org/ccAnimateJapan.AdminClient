import { toNumber } from '@/modules/activityProduct/utils/productMapper'

export const createProductTableColumns = ({
  getProductTypeName,
  getCostTwd,
  stripHtml,
  includeActions = true,
  includeOrderedAmount = false,
}) => {
  const columns = [
    {
      key: 'name',
      label: '商品名稱',
      sortable: true,
      getValue: (product) => product.name || '',
    },
    {
      key: 'image',
      label: '商品圖片',
      sortable: true,
      getValue: (product) => product.images?.[0]?.productImageUrl || '',
    },
    {
      key: 'productType',
      label: '商品類型',
      sortable: true,
      getValue: (product) => getProductTypeName(product.productTypeId),
    },
    {
      key: 'costTwd',
      label: '台幣成本',
      sortable: true,
      getValue: (product) => getCostTwd(product),
    },
    {
      key: 'price',
      label: '售價',
      sortable: true,
      getValue: (product) => toNumber(product.price),
    },
    {
      key: 'amount',
      label: '庫存數量',
      sortable: true,
      getValue: (product) => toNumber(product.amount),
    },
    {
      key: 'activityKind',
      label: '活動模式',
      sortable: true,
      getValue: (product) => (product.isPreOrder ? '預購' : '現貨'),
    },
    {
      key: 'stockStatus',
      label: '庫存狀態',
      sortable: true,
      getValue: (product) => (product.isOutStock ? '缺貨' : '尚有庫存'),
    },
    {
      key: 'info',
      label: '備註',
      sortable: true,
      getValue: (product) => stripHtml(product.info),
    },
    {
      key: 'updatedAt',
      label: '更新時間',
      sortable: true,
      getValue: (product) => product.updateAt || product.createdAt || '',
    },
  ]

  if (includeOrderedAmount) {
    columns.splice(6, 0, {
      key: 'orderedAmount',
      label: '訂購數量',
      sortable: true,
      getValue: (product) => toNumber(product.orderedAmount),
    })
  }

  if (includeActions) {
    columns.push({
      key: 'actions',
      label: '操作',
      sortable: false,
    })
  }

  return columns
}
