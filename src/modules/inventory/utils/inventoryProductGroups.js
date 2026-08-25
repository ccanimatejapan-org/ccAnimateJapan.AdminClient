export const INVENTORY_MODES = Object.freeze({
  readyStock: 'readyStock',
  preOrder: 'preOrder',
})

export const UNCLASSIFIED_ACTIVITY_ID = null
export const UNCLASSIFIED_ACTIVITY_NAME = '未分類活動'
export const UNNAMED_ACTIVITY_NAME = '未命名活動'

const isPreOrderProduct = (product) => product?.isPreOrder === true
const hasInventoryAmount = (product) =>
  product?.amount !== 0 || product?.orderedAmount !== 0

export const filterInventoryProductsByInventoryVisibility = (products = []) =>
  products.filter(hasInventoryAmount)

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
