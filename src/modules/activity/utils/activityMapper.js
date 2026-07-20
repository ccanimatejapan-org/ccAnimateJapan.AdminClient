const defaultFallbackActivityImage = '/cc-admin-mark.svg'

const pad = (value) => String(value).padStart(2, '0')

const toLocalDateParts = (value) => {
  if (!value) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return {
    year: date.getFullYear(),
    month: pad(date.getMonth() + 1),
    day: pad(date.getDate()),
    hour: pad(date.getHours()),
    minute: pad(date.getMinutes()),
  }
}

export const toDisplayDateTime = (value) => {
  const parts = toLocalDateParts(value)
  return parts ? `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}` : ''
}

export const toInputDateTime = (value) => {
  const parts = toLocalDateParts(value)
  return parts ? `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}` : ''
}

export const dateTimeToIso = (value) => (value ? new Date(value).toISOString() : '')

export const ActivityEnum = Object.freeze({
  NotStarted: 0,
  Preparing: 1,
  PreparationEnded: 2,
  Started: 3,
  Ended: 4,
})

export const activityStatusOptions = Object.freeze([
  { value: ActivityEnum.NotStarted, label: '活動尚未開始' },
  { value: ActivityEnum.Preparing, label: '活動準備中' },
  { value: ActivityEnum.PreparationEnded, label: '活動準備結束' },
  { value: ActivityEnum.Started, label: '活動開始' },
  { value: ActivityEnum.Ended, label: '活動結束' },
])

export const normalizeActivityStatus = (value) => {
  const status = Number(value)
  return activityStatusOptions.some((option) => option.value === status)
    ? status
    : ActivityEnum.NotStarted
}

export const toActivityStatusText = (value) => {
  const status = normalizeActivityStatus(value)
  return activityStatusOptions.find((option) => option.value === status)?.label || ''
}

export const toActivityPreOrderText = (isPreOrder) => (isPreOrder ? '預購' : '現貨')

// ---- 運費 / 開團設定（V1）：以英文字串常數對應中文標籤 ----
export const ShippingMode = Object.freeze({
  PerItemPrepaid: 'PerItemPrepaid', // 境內固定運費（每件預收）
  FreeOverAmount: 'FreeOverAmount', // 滿額免運
  NoShipping: 'NoShipping', // 買了就免運（預設）
})

export const shippingModeOptions = Object.freeze([
  { value: ShippingMode.NoShipping, label: '買了就免運' },
  { value: ShippingMode.PerItemPrepaid, label: '境內固定運費' },
  { value: ShippingMode.FreeOverAmount, label: '滿額免運' },
])

export const ShippingShareRule = Object.freeze({
  ByQuantity: 'ByQuantity', // 依商品數量分攤
  ByAmount: 'ByAmount', // 依商品金額比例分攤
})

export const shippingShareRuleOptions = Object.freeze([
  { value: ShippingShareRule.ByQuantity, label: '依數量' },
  { value: ShippingShareRule.ByAmount, label: '依金額比例' },
])

// 分攤規則由運費模式決定（唯讀顯示，不給管理員選）：滿額免運＝依金額比例、其餘＝依數量。
export const deriveShareRule = (mode) =>
  mode === ShippingMode.FreeOverAmount ? ShippingShareRule.ByAmount : ShippingShareRule.ByQuantity

export const GroupBuyStatus = Object.freeze({
  NotRequired: 'NotRequired', // 不需開團（現貨）
  Recruiting: 'Recruiting', // 募集中
  Formed: 'Formed', // 已成團
  Failed: 'Failed', // 流團
})

// 預購活動可手動調整的開團狀態（現貨固定為不需開團，不列入選項）
export const groupBuyStatusOptions = Object.freeze([
  { value: GroupBuyStatus.Recruiting, label: '募集中' },
  { value: GroupBuyStatus.Formed, label: '已成團' },
  { value: GroupBuyStatus.Failed, label: '流團' },
])

const groupBuyStatusLabels = Object.freeze({
  [GroupBuyStatus.NotRequired]: '不需開團',
  [GroupBuyStatus.Recruiting]: '募集中',
  [GroupBuyStatus.Formed]: '已成團',
  [GroupBuyStatus.Failed]: '流團',
})

export const toShippingModeText = (value) =>
  shippingModeOptions.find((option) => option.value === value)?.label || '買了就免運'

export const toShippingShareRuleText = (value) =>
  shippingShareRuleOptions.find((option) => option.value === value)?.label || '依數量'

export const toGroupBuyStatusText = (value) => groupBuyStatusLabels[value] || '不需開團'

export const mapActivityFromApi = (
  activity,
  { fallbackActivityImage = defaultFallbackActivityImage } = {},
) => {
  const status = normalizeActivityStatus(activity.status)
  const isPreOrder = activity.isPreOrder === true

  const shippingMode = activity.shippingMode || ShippingMode.NoShipping
  const groupBuyStatus = activity.groupBuyStatus || GroupBuyStatus.NotRequired

  return {
    id: activity.id,
    shippingMode,
    shippingModeText: toShippingModeText(shippingMode),
    groupBuyThreshold: Number(activity.groupBuyThreshold ?? 0),
    perItemShipping: Number(activity.perItemShipping ?? 0),
    shippingCost: Number(activity.shippingCost ?? 0),
    freeShippingThreshold: Number(activity.freeShippingThreshold ?? 0),
    allowCustomerShippingTopUp: activity.allowCustomerShippingTopUp === true,
    // 分攤規則一律由運費模式推導（與表單同一套規則），不直接採用後端回傳值，避免不一致
    shippingShareRule: deriveShareRule(shippingMode),
    groupBuyStatus,
    groupBuyStatusText: toGroupBuyStatusText(groupBuyStatus),
    activityStartDate: toDisplayDateTime(activity.activeStartTime),
    activityEndDate: toDisplayDateTime(activity.activeEndTime),
    image: activity.imageUrl || fallbackActivityImage,
    name: activity.name || '',
    address: activity.address || '',
    status,
    statusText: toActivityStatusText(status),
    isPreOrder,
    preOrderText: toActivityPreOrderText(isPreOrder),
    isEnded: status === ActivityEnum.Ended,
    info: activity.info || '',
    activityTypeId: activity.activityTypeId || '',
    activityType: activity.activityTypeId ? `#${activity.activityTypeId}` : '-',
    animateTypeId: activity.animateTypeId || '',
    animateType: activity.animateTypeId ? `#${activity.animateTypeId}` : '-',
    prepStartDate: toDisplayDateTime(activity.prepareStartTime),
    prepEndDate: toDisplayDateTime(activity.prepareEndTime),
    raw: activity,
  }
}
