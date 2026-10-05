export const WISH_POOL_DECISIONS = Object.freeze({
  PENDING: 'Pending',
  OPENED: 'Opened',
  NOT_OPENED: 'NotOpened',
})

export const WISH_POOL_DECISION_LABELS = Object.freeze({
  [WISH_POOL_DECISIONS.PENDING]: '尚未回覆',
  [WISH_POOL_DECISIONS.OPENED]: '已開團',
  [WISH_POOL_DECISIONS.NOT_OPENED]: '不開團',
})

export const WISH_POOL_TABS = Object.freeze([
  { key: 'all', label: '全部', decision: '', countKey: 'all' },
  { key: 'pending', label: '尚未回覆', decision: WISH_POOL_DECISIONS.PENDING, countKey: 'pending' },
  { key: 'opened', label: '已開團', decision: WISH_POOL_DECISIONS.OPENED, countKey: 'opened' },
  { key: 'notOpened', label: '不開團', decision: WISH_POOL_DECISIONS.NOT_OPENED, countKey: 'notOpened' },
])

export const isWishPoolDecision = (value) =>
  Object.values(WISH_POOL_DECISIONS).includes(value)

export const getWishPoolDecisionLabel = (value) =>
  WISH_POOL_DECISION_LABELS[value] || '未知狀態'

export const getWishPoolDecisionBadgeClass = (value) => {
  if (value === WISH_POOL_DECISIONS.OPENED) return 'wish-pool-badge--opened'
  if (value === WISH_POOL_DECISIONS.NOT_OPENED) return 'wish-pool-badge--not-opened'
  if (value === WISH_POOL_DECISIONS.PENDING) return 'wish-pool-badge--pending'
  return 'wish-pool-badge--unknown'
}

export const isSafeHttpUrl = (value) => {
  if (!value) return false
  try {
    const url = new URL(String(value))
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export const getWishPoolTabCount = (counts, countKey) => {
  const value = Number(counts?.[countKey] || 0)
  return Number.isFinite(value) ? value : 0
}
