export const INVENTORY_MODES = Object.freeze({
  readyStock: 'readyStock',
  preOrder: 'preOrder',
})

export const UNCLASSIFIED_ACTIVITY_ID = null
export const UNCLASSIFIED_ACTIVITY_NAME = '未分類活動'
export const UNNAMED_ACTIVITY_NAME = '未命名活動'

// 活動狀態「已結束」，對應後端 ActivityEnum.Ended = 4（見 AdminAPI docs/STATUS_CODES.md）。
const ACTIVITY_STATUS_ENDED = 4

const isPreOrderProduct = (product) => product?.isPreOrder === true
const isEndedActivityProduct = (product) =>
  Number(product?.activityStatus) === ACTIVITY_STATUS_ENDED
const hasInventoryAmount = (product) =>
  product?.amount !== 0 || product?.orderedAmount !== 0

// 庫存管理清單的可見規則：
// - 庫存或訂購量不是 0 的商品一律顯示；
// - 現貨商品庫存 0 也要顯示（活動還沒結束時），才能在這裡進貨——商品編輯的數量欄是唯讀的，庫存只能從庫存管理異動；
// - 預購商品沒有訂購量就不顯示；已結束活動的 0 / 0 商品也不顯示，避免清單雜亂。
// activityStatus 缺值（舊版後端）當作未結束，現貨 0 庫存照樣顯示。
const isInventoryProductVisible = (product) =>
  hasInventoryAmount(product) ||
  (!isPreOrderProduct(product) && !isEndedActivityProduct(product))

export const filterInventoryProductsByInventoryVisibility = (products = []) =>
  products.filter(isInventoryProductVisible)

export const filterInventoryProductsByMode = (products = [], mode) =>
  products.filter((product) =>
    mode === INVENTORY_MODES.preOrder
      ? isPreOrderProduct(product)
      : !isPreOrderProduct(product),
  )

export const countInventoryProductsByMode = (products = []) => ({
  [INVENTORY_MODES.readyStock]: filterInventoryProductsByMode(
    products,
    INVENTORY_MODES.readyStock,
  ).length,
  [INVENTORY_MODES.preOrder]: filterInventoryProductsByMode(
    products,
    INVENTORY_MODES.preOrder,
  ).length,
})

export const createInventoryActivityGroups = (products = []) => {
  const groupsByKey = new Map()

  products.forEach((product) => {
    const normalizedActivityId = Number(product?.activityId)
    const hasActivityId =
      Number.isFinite(normalizedActivityId) && normalizedActivityId > 0
    const activityId = hasActivityId
      ? normalizedActivityId
      : UNCLASSIFIED_ACTIVITY_ID
    const key = hasActivityId ? String(activityId) : 'unclassified'
    const rawActivityName = String(product?.activityName || '').trim()

    if (!groupsByKey.has(key)) {
      groupsByKey.set(key, {
        key,
        activityId,
        activityName: hasActivityId
          ? rawActivityName || UNNAMED_ACTIVITY_NAME
          : UNCLASSIFIED_ACTIVITY_NAME,
        products: [],
      })
    }

    const group = groupsByKey.get(key)
    if (
      hasActivityId &&
      group.activityName === UNNAMED_ACTIVITY_NAME &&
      rawActivityName
    ) {
      group.activityName = rawActivityName
    }

    group.products.push(product)
  })

  return Array.from(groupsByKey.values())
    .map((group) => ({
      ...group,
      count: group.products.length,
    }))
    .sort((left, right) => {
      if (left.activityId === UNCLASSIFIED_ACTIVITY_ID) return 1
      if (right.activityId === UNCLASSIFIED_ACTIVITY_ID) return -1
      return right.activityId - left.activityId
    })
}

export const createInventoryActivityCollapseKey = (mode, activityId) =>
  `${mode}:${activityId === UNCLASSIFIED_ACTIVITY_ID ? 'unclassified' : activityId}`

export const getInventoryModeEmptyText = ({
  mode,
  modeTotalCount,
  modeFilteredCount,
}) => {
  if (modeFilteredCount > 0) return ''
  if (modeTotalCount > 0) return '沒有符合篩選條件的商品'
  return mode === INVENTORY_MODES.preOrder
    ? '目前沒有預購商品'
    : '目前沒有現貨商品'
}
