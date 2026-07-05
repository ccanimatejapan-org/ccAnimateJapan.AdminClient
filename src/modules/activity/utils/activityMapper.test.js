import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  ActivityEnum,
  activityStatusOptions,
  dateTimeToIso,
  mapActivityFromApi,
  normalizeActivityStatus,
  toActivityPreOrderText,
  toActivityStatusText,
  toDisplayDateTime,
  toInputDateTime,
} from './activityMapper.js'

test('ActivityEnum and activityStatusOptions expose the five activity states', () => {
  assert.deepEqual(ActivityEnum, {
    NotStarted: 0,
    Preparing: 1,
    PreparationEnded: 2,
    Started: 3,
    Ended: 4,
  })
  assert.deepEqual(
    activityStatusOptions.map((option) => option.value),
    [0, 1, 2, 3, 4],
  )
})

test('normalizeActivityStatus keeps valid statuses and falls back to NotStarted', () => {
  assert.equal(normalizeActivityStatus(3), 3)
  assert.equal(normalizeActivityStatus('4'), 4)
  assert.equal(normalizeActivityStatus(99), ActivityEnum.NotStarted)
  assert.equal(normalizeActivityStatus(undefined), ActivityEnum.NotStarted)
})

test('toActivityStatusText and toActivityPreOrderText return the expected labels', () => {
  assert.equal(toActivityStatusText(3), '活動開始')
  assert.equal(toActivityStatusText(99), '活動尚未開始')
  assert.equal(toActivityPreOrderText(true), '預購')
  assert.equal(toActivityPreOrderText(false), '現貨')
})

test('dateTimeToIso returns an ISO string for values and empty string for blanks', () => {
  assert.equal(dateTimeToIso(''), '')
  assert.equal(dateTimeToIso(null), '')
  const iso = dateTimeToIso('2024-01-02T03:04')
  assert.match(iso, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
})

test('toInputDateTime / toDisplayDateTime format local datetime parts (and blank on invalid)', () => {
  assert.equal(toInputDateTime('2024-05-06T07:08'), '2024-05-06T07:08')
  assert.equal(toDisplayDateTime('2024-05-06T07:08'), '2024-05-06 07:08')
  assert.equal(toInputDateTime(''), '')
  assert.equal(toDisplayDateTime('not-a-date'), '')
})

test('mapActivityFromApi maps raw API fields into the view model', () => {
  const mapped = mapActivityFromApi({
    id: 12,
    name: '夏祭',
    address: '東京',
    status: 3,
    isPreOrder: true,
    info: '<p>note</p>',
    activityTypeId: 5,
    animateTypeId: 8,
    imageUrl: '',
    activeStartTime: '2024-05-06T07:08',
    activeEndTime: '2024-05-07T07:08',
  })

  assert.equal(mapped.id, 12)
  assert.equal(mapped.name, '夏祭')
  assert.equal(mapped.address, '東京')
  assert.equal(mapped.status, 3)
  assert.equal(mapped.statusText, '活動開始')
  assert.equal(mapped.isPreOrder, true)
  assert.equal(mapped.preOrderText, '預購')
  assert.equal(mapped.isEnded, false)
  assert.equal(mapped.info, '<p>note</p>')
  assert.equal(mapped.activityTypeId, 5)
  assert.equal(mapped.activityType, '#5')
  assert.equal(mapped.animateTypeId, 8)
  assert.equal(mapped.animateType, '#8')
  assert.equal(mapped.image, '/cc-admin-mark.svg')
  assert.equal(mapped.activityStartDate, '2024-05-06 07:08')
  assert.equal(mapped.raw.id, 12)
})

test('mapActivityFromApi falls back for missing optional fields', () => {
  const mapped = mapActivityFromApi({ id: 1 })

  assert.equal(mapped.name, '')
  assert.equal(mapped.address, '')
  assert.equal(mapped.status, ActivityEnum.NotStarted)
  assert.equal(mapped.isPreOrder, false)
  assert.equal(mapped.preOrderText, '現貨')
  assert.equal(mapped.activityType, '-')
  assert.equal(mapped.animateType, '-')
  assert.equal(mapped.image, '/cc-admin-mark.svg')
})
