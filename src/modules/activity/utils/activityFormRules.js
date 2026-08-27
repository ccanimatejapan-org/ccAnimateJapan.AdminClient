import {
  ActivityEnum,
  GroupBuyStatus,
  ShippingMode,
  ShippingShareRule,
  dateTimeToIso,
  deriveShareRule,
  isWritableActivityStatus,
  normalizeActivityStatusForDisplay,
  toInputDateTime,
} from '@/modules/activity/utils/activityMapper'
import { sanitizeHtml } from '@/shared/utils/html'
import { appendIfValue } from '@/shared/utils/formData'
import { formatRequiredFieldsMessage, isBlankValue } from '@/shared/utils/validation'

// 與後端 ActivityShippingRules 上限一致：避免超大金額在補運費分攤計算時 long 溢位(M-05)
export const MAX_SHIPPING_AMOUNT = 100_000_000
export const MAX_GROUP_BUY_THRESHOLD = 1_000_000

export const ACTIVITY_FORM_MODES = Object.freeze({
  create: 'create',
  edit: 'edit',
  copy: 'copy',
})

export const createEmptyActivityForm = () => ({
  activityStartDate: '',
  activityEndDate: '',
  officialShippingStartDate: '',
  officialShippingEndDate: '',
  name: '',
  imageUrl: '',
  address: '',
  activityTypeId: '',
  animateTypeId: '',
  info: '',
  status: ActivityEnum.NotStarted,
  isPreOrder: false,
  shippingMode: ShippingMode.NoShipping,
  groupBuyThreshold: 0,
  perItemShipping: 0,
  shippingCost: 0,
  freeShippingThreshold: 0,
  allowCustomerShippingTopUp: false,
  shippingShareRule: ShippingShareRule.ByQuantity,
  groupBuyStatus: GroupBuyStatus.NotRequired,
})

const normalizeMode = (mode) =>
  Object.values(ACTIVITY_FORM_MODES).includes(mode) ? mode : ACTIVITY_FORM_MODES.create

const toCopyActivityName = (name) => `${String(name || '').trim()}（複製）`

const hasInvalidDateRange = (startValue, endValue) => {
  if (isBlankValue(startValue) || isBlankValue(endValue)) return false

  const start = new Date(startValue)
  const end = new Date(endValue)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return true

  return start > end
}

export const getGroupBuyStatusForActivityKind = (isPreOrder) =>
  isPreOrder ? GroupBuyStatus.Recruiting : GroupBuyStatus.NotRequired

export const normalizeActivityFormValuesForMode = (values = {}, mode = ACTIVITY_FORM_MODES.create) => {
  const normalizedMode = normalizeMode(mode)
  const isPreOrder = values.isPreOrder === true
  const shippingMode = isPreOrder ? values.shippingMode || ShippingMode.NoShipping : ShippingMode.NoShipping
  const status =
    normalizedMode === ACTIVITY_FORM_MODES.copy
      ? ActivityEnum.NotStarted
      : normalizeActivityStatusForDisplay(values.status)
  const groupBuyStatus =
    normalizedMode === ACTIVITY_FORM_MODES.copy
      ? getGroupBuyStatusForActivityKind(isPreOrder)
      : isPreOrder
        ? values.groupBuyStatus || GroupBuyStatus.Recruiting
        : GroupBuyStatus.NotRequired

  return {
    ...createEmptyActivityForm(),
    ...values,
    status,
    isPreOrder,
    officialShippingStartDate: isPreOrder ? values.officialShippingStartDate || '' : '',
    officialShippingEndDate: isPreOrder ? values.officialShippingEndDate || '' : '',
    shippingMode,
    shippingShareRule: deriveShareRule(shippingMode),
    groupBuyStatus,
    allowCustomerShippingTopUp:
      isPreOrder && values.allowCustomerShippingTopUp === true,
  }
}

export const mapActivityToActivityFormValues = (
  activity,
  { mode = ACTIVITY_FORM_MODES.edit } = {},
) => {
  const normalizedMode = normalizeMode(mode)
  const raw = activity?.raw || activity || {}
  const isCopyMode = normalizedMode === ACTIVITY_FORM_MODES.copy
  const isPreOrder = raw.isPreOrder === true
  const shippingMode = activity?.shippingMode ?? raw.shippingMode ?? ShippingMode.NoShipping
  const baseValues = {
    activityStartDate: toInputDateTime(raw.activeStartTime),
    activityEndDate: toInputDateTime(raw.activeEndTime),
    officialShippingStartDate: isPreOrder ? toInputDateTime(raw.officialShippingStartTime) : '',
    officialShippingEndDate: isPreOrder ? toInputDateTime(raw.officialShippingEndTime) : '',
    name: isCopyMode ? toCopyActivityName(raw.name) : raw.name || '',
    imageUrl: raw.imageUrl || '',
    address: raw.address || '',
    activityTypeId: raw.activityTypeId || '',
    animateTypeId: raw.animateTypeId || '',
    info: raw.info || '',
    status: isCopyMode
      ? ActivityEnum.NotStarted
      : normalizeActivityStatusForDisplay(raw.status),
    isPreOrder,
    shippingMode,
    groupBuyThreshold: activity?.groupBuyThreshold ?? raw.groupBuyThreshold ?? 0,
    perItemShipping: activity?.perItemShipping ?? raw.perItemShipping ?? 0,
    shippingCost: activity?.shippingCost ?? raw.shippingCost ?? 0,
    freeShippingThreshold: activity?.freeShippingThreshold ?? raw.freeShippingThreshold ?? 0,
    allowCustomerShippingTopUp:
      activity?.allowCustomerShippingTopUp === true || raw.allowCustomerShippingTopUp === true,
    shippingShareRule: deriveShareRule(shippingMode),
    groupBuyStatus: isCopyMode
      ? getGroupBuyStatusForActivityKind(isPreOrder)
      : activity?.groupBuyStatus ?? raw.groupBuyStatus ?? GroupBuyStatus.NotRequired,
  }

  return normalizeActivityFormValuesForMode(baseValues, normalizedMode)
}

export const validateActivityFormValues = ({ form, hasSelectedImageFile = false } = {}) => {
  const values = normalizeActivityFormValuesForMode(form || {}, ACTIVITY_FORM_MODES.edit)
  const missingFields = []
  const invalidFields = []

  if (isBlankValue(values.activityStartDate) || isBlankValue(values.activityEndDate)) {
    missingFields.push('活動期間')
  } else if (hasInvalidDateRange(values.activityStartDate, values.activityEndDate)) {
    invalidFields.push('活動期間結束不可早於開始')
  }

  if (
    values.isPreOrder &&
    (isBlankValue(values.officialShippingStartDate) || isBlankValue(values.officialShippingEndDate))
  ) {
    missingFields.push('官方出貨期間')
  } else if (
    values.isPreOrder &&
    hasInvalidDateRange(values.officialShippingStartDate, values.officialShippingEndDate)
  ) {
    invalidFields.push('官方出貨期間結束不可早於開始')
  }

  if (isBlankValue(values.name)) missingFields.push('活動名稱')
  if (!hasSelectedImageFile && isBlankValue(values.imageUrl)) missingFields.push('活動圖片')
  if (isBlankValue(values.address)) missingFields.push('活動地址')
  if (isBlankValue(values.activityTypeId)) missingFields.push('活動類型')
  if (isBlankValue(values.animateTypeId)) missingFields.push('動漫')

  if (
    values.isPreOrder &&
    values.shippingMode === ShippingMode.PerItemPrepaid &&
    !(Number(values.groupBuyThreshold) > 0)
  ) {
    missingFields.push('成團數量')
  }
  if (
    values.isPreOrder &&
    values.shippingMode === ShippingMode.NoShipping &&
    !(Number(values.groupBuyThreshold) > 0)
  ) {
    missingFields.push('開團數量')
  }
  if (
    values.isPreOrder &&
    values.shippingMode === ShippingMode.FreeOverAmount &&
    !(Number(values.freeShippingThreshold) > 0)
  ) {
    missingFields.push('免運門檻')
  }
  if (
    values.isPreOrder &&
    values.shippingMode === ShippingMode.FreeOverAmount &&
    !(Number(values.shippingCost) > 0)
  ) {
    missingFields.push('運費成本')
  }

  const shippingAmountFields = [
    ['運費成本', values.shippingCost],
    ['每件預收運費', values.perItemShipping],
    ['免運門檻', values.freeShippingThreshold],
  ]
  for (const [label, amount] of shippingAmountFields) {
    if (Number(amount) > MAX_SHIPPING_AMOUNT) {
      invalidFields.push(`${label}不可超過 ${MAX_SHIPPING_AMOUNT.toLocaleString()}`)
    }
  }
  if (Number(values.groupBuyThreshold) > MAX_GROUP_BUY_THRESHOLD) {
    invalidFields.push(`開團/成團數量不可超過 ${MAX_GROUP_BUY_THRESHOLD.toLocaleString()}`)
  }

  if (!isWritableActivityStatus(values.status)) missingFields.push('活動狀態')

  return {
    isValid: missingFields.length === 0 && invalidFields.length === 0,
    missingFields,
    invalidFields,
  }
}

export const formatActivityFormValidationMessage = (validationResult) => {
  if (!validationResult) return ''
  if (validationResult.missingFields?.length) {
    return formatRequiredFieldsMessage(validationResult.missingFields)
  }
  if (validationResult.invalidFields?.length) {
    return `請確認：${validationResult.invalidFields.join('、')}。`
  }

  return ''
}

const appendPayloadEntry = (entries, key, value) => {
  if (value !== undefined && value !== null && value !== '') {
    entries.push([key, value])
  }
}

export const buildActivityFormPayloadEntries = (
  form,
  {
    mode = ACTIVITY_FORM_MODES.create,
    activityId = null,
    selectedImageFile = null,
  } = {},
) => {
  const normalizedMode = normalizeMode(mode)
  const values = normalizeActivityFormValuesForMode(form || {}, normalizedMode)
  const entries = []

  if (normalizedMode === ACTIVITY_FORM_MODES.edit) {
    appendPayloadEntry(entries, 'id', activityId)
  }

  appendPayloadEntry(entries, 'name', String(values.name || '').trim())
  appendPayloadEntry(entries, 'activeStartTime', dateTimeToIso(values.activityStartDate))
  appendPayloadEntry(entries, 'activeEndTime', dateTimeToIso(values.activityEndDate))

  if (values.isPreOrder) {
    appendPayloadEntry(entries, 'officialShippingStartTime', dateTimeToIso(values.officialShippingStartDate))
    appendPayloadEntry(entries, 'officialShippingEndTime', dateTimeToIso(values.officialShippingEndDate))
  }

  appendPayloadEntry(entries, 'address', String(values.address || '').trim())
  appendPayloadEntry(entries, 'activityTypeId', values.activityTypeId)
  appendPayloadEntry(entries, 'animateTypeId', values.animateTypeId)
  appendPayloadEntry(entries, 'info', sanitizeHtml(values.info).trim())
  appendPayloadEntry(entries, 'status', normalizedMode === ACTIVITY_FORM_MODES.copy
    ? ActivityEnum.NotStarted
    : values.status)
  entries.push(['isPreOrder', values.isPreOrder ? 'true' : 'false'])

  if (selectedImageFile) {
    entries.push(['imageFile', selectedImageFile])
  } else {
    appendPayloadEntry(entries, 'imageUrl', values.imageUrl)
  }

  appendPayloadEntry(entries, 'shippingMode', values.shippingMode)
  appendPayloadEntry(entries, 'groupBuyThreshold', values.groupBuyThreshold)
  appendPayloadEntry(entries, 'perItemShipping', values.perItemShipping)
  appendPayloadEntry(entries, 'shippingCost', values.shippingCost)
  appendPayloadEntry(entries, 'freeShippingThreshold', values.freeShippingThreshold)
  entries.push(['allowCustomerShippingTopUp', values.allowCustomerShippingTopUp ? 'true' : 'false'])
  appendPayloadEntry(entries, 'shippingShareRule', values.shippingShareRule)

  if (values.isPreOrder && normalizedMode !== ACTIVITY_FORM_MODES.create) {
    appendPayloadEntry(entries, 'groupBuyStatus', values.groupBuyStatus)
  }

  return entries
}

export const buildActivityFormDataFromEntries = (entries, FormDataCtor = FormData) => {
  const formData = new FormDataCtor()
  entries.forEach(([key, value]) => appendIfValue(formData, key, value))
  return formData
}
