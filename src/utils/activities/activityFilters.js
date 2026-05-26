const normalizeText = (value) => String(value || '').trim().toLowerCase()

const parseFilterDate = (value, boundary) => {
  if (!value) return null

  const normalizedValue =
    typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? `${value}${boundary === 'end' ? 'T23:59:59.999' : 'T00:00:00.000'}`
      : value
  const parsed = new Date(normalizedValue)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const parseActivityDate = (value) => {
  if (!value) return null

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const overlapsRange = (itemStart, itemEnd, filterStart, filterEnd) => {
  if (!filterStart && !filterEnd) return true

  const resolvedItemStart = parseActivityDate(itemStart)
  const resolvedItemEnd = parseActivityDate(itemEnd)
  if (!resolvedItemStart || !resolvedItemEnd) return false

  if (filterStart && resolvedItemEnd < filterStart) return false
  if (filterEnd && resolvedItemStart > filterEnd) return false

  return true
}

export const createEmptyActivityFilters = () => ({
  activityTypeIds: [],
  animateTypeIds: [],
  name: '',
  address: '',
  activityDateStart: '',
  activityDateEnd: '',
  prepDateStart: '',
  prepDateEnd: '',
})

export const hasActiveActivityFilters = (filters) =>
  Boolean(
    filters.activityTypeIds.length ||
      filters.animateTypeIds.length ||
      normalizeText(filters.name) ||
      normalizeText(filters.address) ||
      filters.activityDateStart ||
      filters.activityDateEnd ||
      filters.prepDateStart ||
      filters.prepDateEnd,
  )

export const matchesActivityFilters = (activity, filters) => {
  const selectedActivityTypeIds = filters.activityTypeIds.map(Number)
  if (
    selectedActivityTypeIds.length &&
    !selectedActivityTypeIds.includes(Number(activity.activityTypeId || 0))
  ) {
    return false
  }

  const selectedAnimateTypeIds = filters.animateTypeIds.map(Number)
  if (
    selectedAnimateTypeIds.length &&
    !selectedAnimateTypeIds.includes(Number(activity.animateTypeId || 0))
  ) {
    return false
  }

  const nameKeyword = normalizeText(filters.name)
  if (nameKeyword && !normalizeText(activity.name).includes(nameKeyword)) {
    return false
  }

  const addressKeyword = normalizeText(filters.address)
  if (addressKeyword && !normalizeText(activity.address).includes(addressKeyword)) {
    return false
  }

  const activityDateStart = parseFilterDate(filters.activityDateStart, 'start')
  const activityDateEnd = parseFilterDate(filters.activityDateEnd, 'end')
  if (
    !overlapsRange(
      activity.raw?.activeStartTime,
      activity.raw?.activeEndTime,
      activityDateStart,
      activityDateEnd,
    )
  ) {
    return false
  }

  const prepDateStart = parseFilterDate(filters.prepDateStart, 'start')
  const prepDateEnd = parseFilterDate(filters.prepDateEnd, 'end')
  if (
    !overlapsRange(
      activity.raw?.prepareStartTime,
      activity.raw?.prepareEndTime,
      prepDateStart,
      prepDateEnd,
    )
  ) {
    return false
  }

  return true
}
