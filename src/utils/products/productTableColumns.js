import { toNumber } from '@/utils/products/productMapper'

export const createProductTableColumns = ({
  getProductTypeName,
  getCostTwd,
  stripHtml,
  includeActions = true,
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
      label: '成本台幣',
      sortable: true,
      getValue: (product) => getCostTwd(product),
    },
    {
      key: 'price',
      label: '售價台幣',
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

  if (includeActions) {
    columns.push({
      key: 'actions',
      label: '操作',
      sortable: false,
    })
  }

  return columns
}
