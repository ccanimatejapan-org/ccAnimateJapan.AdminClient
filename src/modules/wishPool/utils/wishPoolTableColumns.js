export const createWishPoolTableColumns = () => [
  { key: 'id', label: '編號', sortable: true, getValue: (item) => Number(item.id || 0) },
  { key: 'animateTypeName', label: '作品', sortable: true, getValue: (item) => item.animateTypeName || '' },
  { key: 'activityName', label: '活動名稱', sortable: true, getValue: (item) => item.activityName || '' },
  { key: 'productImageUrl', label: '商品圖片', sortable: true, getValue: (item) => item.productImageUrl || '' },
  { key: 'productUrl', label: '商品連結', sortable: true, getValue: (item) => item.productUrl || '' },
  { key: 'createdAt', label: '建立時間', sortable: true, getValue: (item) => new Date(item.createdAt || 0) },
  { key: 'reactionCount', label: '支持數', sortable: true, getValue: (item) => Number(item.reactionCount || 0) },
  { key: 'groupBuyDecision', label: '開團狀態', sortable: true, getValue: (item) => item.groupBuyDecision || '' },
  { key: 'actions', label: '操作', sortable: false },
]
