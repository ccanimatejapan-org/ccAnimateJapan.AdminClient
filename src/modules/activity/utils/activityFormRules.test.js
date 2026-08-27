import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  ActivityEnum,
  GroupBuyStatus,
  ShippingMode,
  ShippingShareRule,
} from './activityMapper.js'
import {
  ACTIVITY_FORM_MODES,
  buildActivityFormPayloadEntries,
  createEmptyActivityForm,
  formatActivityFormValidationMessage,
  mapActivityToActivityFormValues,
  normalizeActivityFormValuesForMode,
  validateActivityFormValues,
  MAX_SHIPPING_AMOUNT,
  MAX_GROUP_BUY_THRESHOLD,
} from './activityFormRules.js'

const entriesToObject = (entries) =>
  Object.fromEntries(entries.map(([key, value]) => [key, String(value)]))

const validBaseForm = (overrides = {}) => ({
  ...createEmptyActivityForm(),
  activityStartDate: '2024-05-01T00:00',
  activityEndDate: '2024-05-05T23:59',
  name: '夏祭',
  imageUrl: 'https://img.example/activity.png',
  address: '東京',
  activityTypeId: 7,
  animateTypeId: 9,
  status: ActivityEnum.NotStarted,
  ...overrides,
})

test('createEmptyActivityForm uses official shipping fields and blank in-stock defaults', () => {
  assert.deepEqual(createEmptyActivityForm(), {
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
})

test('normalizes in-stock values by clearing official shipping and group-buy settings', () => {
  const normalized = normalizeActivityFormValuesForMode({
    isPreOrder: false,
    officialShippingStartDate: '2024-08-01T00:00',
    officialShippingEndDate: '2024-08-05T23:59',
    shippingMode: ShippingMode.FreeOverAmount,
    groupBuyStatus: GroupBuyStatus.Formed,
    allowCustomerShippingTopUp: true,
  })

  assert.equal(normalized.officialShippingStartDate, '')
  assert.equal(normalized.officialShippingEndDate, '')
  assert.equal(normalized.shippingMode, ShippingMode.NoShipping)
  assert.equal(normalized.groupBuyStatus, GroupBuyStatus.NotRequired)
  assert.equal(normalized.allowCustomerShippingTopUp, false)
})

test('mapActivityToActivityFormValues maps edit and copy mode values', () => {
  const source = {
    id: 10,
    shippingMode: ShippingMode.PerItemPrepaid,
    groupBuyThreshold: 3,
    groupBuyStatus: GroupBuyStatus.Formed,
    raw: {
      id: 10,
      activeStartTime: '2024-05-01T00:00',
      activeEndTime: '2024-05-05T23:59',
      officialShippingStartTime: '2024-08-01T00:00',
      officialShippingEndTime: '2024-08-05T23:59',
      name: '夏祭',
      imageUrl: 'https://img.example/a.png',
      address: '東京',
      activityTypeId: 7,
      animateTypeId: 9,
      info: '<p>hi</p>',
      status: ActivityEnum.Started,
      isPreOrder: true,
      shippingMode: ShippingMode.PerItemPrepaid,
      groupBuyStatus: GroupBuyStatus.Formed,
    },
  }

  const edit = mapActivityToActivityFormValues(source, { mode: ACTIVITY_FORM_MODES.edit })
  assert.equal(edit.name, '夏祭')
  assert.equal(edit.status, ActivityEnum.Started)
  assert.equal(edit.groupBuyStatus, GroupBuyStatus.Formed)
  assert.equal(edit.officialShippingStartDate, '2024-08-01T00:00')

  const copy = mapActivityToActivityFormValues(source, { mode: ACTIVITY_FORM_MODES.copy })
  assert.equal(copy.name, '夏祭（複製）')
  assert.equal(copy.status, ActivityEnum.NotStarted)
  assert.equal(copy.groupBuyStatus, GroupBuyStatus.Recruiting)
  assert.equal(copy.officialShippingStartDate, '2024-08-01T00:00')
})

test('copy mode resets in-stock group-buy status to NotRequired', () => {
  const copy = mapActivityToActivityFormValues({
    raw: {
      name: '現貨活動',
      isPreOrder: false,
      status: ActivityEnum.Ended,
      groupBuyStatus: GroupBuyStatus.Failed,
    },
  }, { mode: ACTIVITY_FORM_MODES.copy })

  assert.equal(copy.name, '現貨活動（複製）')
  assert.equal(copy.status, ActivityEnum.NotStarted)
  assert.equal(copy.groupBuyStatus, GroupBuyStatus.NotRequired)
})

test('validation requires official shipping only for pre-order activities and rejects legacy status writes', () => {
  const preOrderMissingOfficialShipping = validateActivityFormValues({
    form: validBaseForm({
      isPreOrder: true,
      shippingMode: ShippingMode.NoShipping,
      groupBuyThreshold: 10,
    }),
    hasSelectedImageFile: false,
  })

  assert.equal(preOrderMissingOfficialShipping.isValid, false)
  assert.deepEqual(preOrderMissingOfficialShipping.missingFields, ['官方出貨期間'])
  assert.equal(
    formatActivityFormValidationMessage(preOrderMissingOfficialShipping),
    '請填寫：官方出貨期間。',
  )

  const inStockWithLegacyStatus = validateActivityFormValues({
    form: validBaseForm({
      isPreOrder: false,
      status: ActivityEnum.Preparing,
    }),
    hasSelectedImageFile: false,
  })

  assert.equal(inStockWithLegacyStatus.isValid, false)
  assert.deepEqual(inStockWithLegacyStatus.missingFields, ['活動狀態'])
})

test('validation rejects shipping amounts and group-buy threshold above the max (M-05)', () => {
  const overMaxCost = validateActivityFormValues({
    form: validBaseForm({ shippingCost: MAX_SHIPPING_AMOUNT + 1 }),
    hasSelectedImageFile: false,
  })
  assert.equal(overMaxCost.isValid, false)
  assert.ok(overMaxCost.invalidFields.some((f) => f.includes('運費成本') && f.includes('不可超過')))

  const overMaxThreshold = validateActivityFormValues({
    form: validBaseForm({ groupBuyThreshold: MAX_GROUP_BUY_THRESHOLD + 1 }),
    hasSelectedImageFile: false,
  })
  assert.equal(overMaxThreshold.isValid, false)
  assert.ok(overMaxThreshold.invalidFields.some((f) => f.includes('開團/成團數量')))

  // 邊界：剛好等於上限，不因上限被擋
  const atMax = validateActivityFormValues({
    form: validBaseForm({
      shippingCost: MAX_SHIPPING_AMOUNT,
      groupBuyThreshold: MAX_GROUP_BUY_THRESHOLD,
    }),
    hasSelectedImageFile: false,
  })
  assert.deepEqual(atMax.invalidFields, [])
})

test('validation accepts pre-order official shipping and rejects reversed ranges', () => {
  const validPreOrder = validateActivityFormValues({
    form: validBaseForm({
      isPreOrder: true,
      officialShippingStartDate: '2024-08-01T00:00',
      officialShippingEndDate: '2024-08-05T23:59',
      shippingMode: ShippingMode.NoShipping,
      groupBuyThreshold: 10,
      status: ActivityEnum.Started,
    }),
  })
  assert.equal(validPreOrder.isValid, true)

  const reversedOfficialShipping = validateActivityFormValues({
    form: validBaseForm({
      isPreOrder: true,
      officialShippingStartDate: '2024-08-05T23:59',
      officialShippingEndDate: '2024-08-01T00:00',
      shippingMode: ShippingMode.NoShipping,
      groupBuyThreshold: 10,
      status: ActivityEnum.Started,
    }),
  })
  assert.equal(reversedOfficialShipping.isValid, false)
  assert.deepEqual(reversedOfficialShipping.invalidFields, ['官方出貨期間結束不可早於開始'])
})

test('payload entries omit official shipping for in-stock create payloads', () => {
  const entries = buildActivityFormPayloadEntries(validBaseForm({
    isPreOrder: false,
    officialShippingStartDate: '2024-08-01T00:00',
    officialShippingEndDate: '2024-08-05T23:59',
  }), { mode: ACTIVITY_FORM_MODES.create })
  const payload = entriesToObject(entries)

  assert.equal(payload.id, undefined)
  assert.equal(payload.isPreOrder, 'false')
  assert.equal(payload.officialShippingStartTime, undefined)
  assert.equal(payload.officialShippingEndTime, undefined)
  assert.equal(payload.imageUrl, 'https://img.example/activity.png')
  assert.equal(payload.status, String(ActivityEnum.NotStarted))
})

test('payload entries include id only for edit and official shipping/group-buy status for pre-order edit', () => {
  const entries = buildActivityFormPayloadEntries(validBaseForm({
    isPreOrder: true,
    officialShippingStartDate: '2024-08-01T00:00',
    officialShippingEndDate: '2024-08-05T23:59',
    shippingMode: ShippingMode.NoShipping,
    groupBuyThreshold: 10,
    groupBuyStatus: GroupBuyStatus.Formed,
    status: ActivityEnum.Ended,
  }), { mode: ACTIVITY_FORM_MODES.edit, activityId: 22 })
  const payload = entriesToObject(entries)

  assert.equal(payload.id, '22')
  assert.match(payload.officialShippingStartTime, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
  assert.match(payload.officialShippingEndTime, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
  assert.equal(payload.groupBuyStatus, GroupBuyStatus.Formed)
  assert.equal(payload.status, String(ActivityEnum.Ended))
})

test('copy payload does not append source id as payload id, forces status, and keeps source imageUrl when no file is selected', () => {
  const entries = buildActivityFormPayloadEntries(validBaseForm({
    name: '夏祭（複製）',
    isPreOrder: true,
    officialShippingStartDate: '2024-08-01T00:00',
    officialShippingEndDate: '2024-08-05T23:59',
    shippingMode: ShippingMode.NoShipping,
    groupBuyThreshold: 10,
    groupBuyStatus: GroupBuyStatus.Failed,
    status: ActivityEnum.Ended,
  }), { mode: ACTIVITY_FORM_MODES.copy, activityId: 99 })
  const payload = entriesToObject(entries)

  assert.equal(payload.id, undefined)
  assert.equal(payload.name, '夏祭（複製）')
  assert.equal(payload.status, String(ActivityEnum.NotStarted))
  assert.equal(payload.groupBuyStatus, GroupBuyStatus.Recruiting)
  assert.equal(payload.imageUrl, 'https://img.example/activity.png')
})

test('copy payload can carry a replacement image file instead of imageUrl', () => {
  const file = { name: 'new.png' }
  const entries = buildActivityFormPayloadEntries(validBaseForm({
    isPreOrder: false,
  }), { mode: ACTIVITY_FORM_MODES.copy, selectedImageFile: file })

  assert.equal(entries.some(([key]) => key === 'imageUrl'), false)
  assert.equal(entries.find(([key]) => key === 'imageFile')?.[1], file)
})
