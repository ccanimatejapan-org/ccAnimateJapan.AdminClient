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

export const mapActivityFromApi = (
  activity,
  { fallbackActivityImage = defaultFallbackActivityImage } = {},
) => {
  const status = normalizeActivityStatus(activity.status)
  const isPreOrder = activity.isPreOrder === true

  return {
    id: activity.id,
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
