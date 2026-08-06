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

export const activityStatusDisplayOptions = Object.freeze([
  { value: ActivityEnum.NotStarted, label: '活動尚未開始' },
  { value: ActivityEnum.Preparing, label: '活動準備中' },
  { value: ActivityEnum.PreparationEnded, label: '活動準備結束' },
  { value: ActivityEnum.Started, label: '活動開始' },
  { value: ActivityEnum.Ended, label: '活動結束' },
])

// 可寫入選項刻意排除 legacy Preparing (1)／PreparationEnded (2)。
export const activityStatusOptions = Object.freeze([
  { value: ActivityEnum.NotStarted, label: '活動尚未開始' },
  { value: ActivityEnum.Started, label: '活動開始' },
  { value: ActivityEnum.Ended, label: '活動結束' },
])

const activityStatusDisplayValues = new Set(activityStatusDisplayOptions.map((option) => option.value))
const writableActivityStatusValues = new Set(activityStatusOptions.map((option) => option.value))

export const normalizeActivityStatusForDisplay = (value) => {
  const status = Number(value)
  return activityStatusDisplayValues.has(status) ? status : ActivityEnum.NotStarted
}

export const normalizeWritableActivityStatus = (value) => {
  const status = Number(value)
  return writableActivityStatusValues.has(status) ? status : null
}

export const isWritableActivityStatus = (value) => writableActivityStatusValues.has(Number(value))

// 保留向後相容的顯示正規化；不可用於表單可寫入狀態驗證。
export const normalizeActivityStatus = normalizeActivityStatusForDisplay

export const toActivityStatusText = (value) => {
  const status = normalizeActivityStatusForDisplay(value)
  return activityStatusDisplayOptions.find((option) => option.value === status)?.label || ''
}

export const toActivityPreOrderText = (isPreOrder) => (isPreOrder ? '預購' : '現貨')

export const ShippingMode = Object.freeze({
  PerItemPrepaid: 'PerItemPrepaid',
  FreeOverAmount: 'FreeOverAmount',
  NoShipping: 'NoShipping',
})

export const shippingModeOptions = Object.freeze([
  { value: ShippingMode.NoShipping, label: '買了就免運' },
  { value: ShippingMode.PerItemPrepaid, label: '境內固定運費' },
  { value: ShippingMode.FreeOverAmount, label: '滿額免運' },
])

export const ShippingShareRule = Object.freeze({
  ByQuantity: 'ByQuantity',
  ByAmount: 'ByAmount',
})

export const shippingShareRuleOptions = Object.freeze([
  { value: ShippingShareRule.ByQuantity, label: '依數量' },
  { value: ShippingShareRule.ByAmount, label: '依金額比例' },
])

export const deriveShareRule = (mode) =>
  mode === ShippingMode.FreeOverAmount ? ShippingShareRule.ByAmount : ShippingShareRule.ByQuantity

export const GroupBuyStatus = Object.freeze({
  NotRequired: 'NotRequired',
  Recruiting: 'Recruiting',
  Formed: 'Formed',
  Failed: 'Failed',
})

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
  const status = normalizeActivityStatusForDisplay(activity.status)
  const isPreOrder = activity.isPreOrder === true

  const shippingMode = activity.shippingMode || ShippingMode.NoShipping
  const groupBuyStatus = activity.groupBuyStatus || GroupBuyStatus.NotRequired
  const officialShippingStartDate = isPreOrder
    ? toDisplayDateTime(activity.officialShippingStartTime)
    : ''
  const officialShippingEndDate = isPreOrder
    ? toDisplayDateTime(activity.officialShippingEndTime)
    : ''

  return {
    id: activity.id,
    shippingMode,
    shippingModeText: toShippingModeText(shippingMode),
    groupBuyThreshold: Number(activity.groupBuyThreshold ?? 0),
    perItemShipping: Number(activity.perItemShipping ?? 0),
    shippingCost: Number(activity.shippingCost ?? 0),
    freeShippingThreshold: Number(activity.freeShippingThreshold ?? 0),
    allowCustomerShippingTopUp: activity.allowCustomerShippingTopUp === true,
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
    officialShippingStartDate,
    officialShippingEndDate,
    raw: activity,
  }
}
