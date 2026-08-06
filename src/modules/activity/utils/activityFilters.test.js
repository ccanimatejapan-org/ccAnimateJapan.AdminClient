import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  createEmptyActivityFilters,
  hasActiveActivityFilters,
  matchesActivityFilters,
} from './activityFilters.js'

const makeActivity = (overrides = {}) => ({
  name: '夏祭典',
  address: '東京巨蛋',
  activityTypeId: 5,
  animateTypeId: 8,
  isPreOrder: true,
  raw: {
    activeStartTime: '2024-05-12T00:00',
    activeEndTime: '2024-05-15T00:00',
    officialShippingStartTime: '2024-08-01T00:00',
    officialShippingEndTime: '2024-08-05T00:00',
  },
  ...overrides,
})

test('createEmptyActivityFilters returns blank defaults', () => {
  assert.deepEqual(createEmptyActivityFilters(), {
    activityTypeIds: [],
    animateTypeIds: [],
    name: '',
    address: '',
    activityDateStart: '',
    activityDateEnd: '',
    officialShippingStartDate: '',
    officialShippingEndDate: '',
  })
})

test('hasActiveActivityFilters detects any populated filter', () => {
  assert.equal(hasActiveActivityFilters(createEmptyActivityFilters()), false)
  assert.equal(hasActiveActivityFilters({ ...createEmptyActivityFilters(), name: '祭' }), true)
  assert.equal(hasActiveActivityFilters({ ...createEmptyActivityFilters(), activityTypeIds: [1] }), true)
  assert.equal(
    hasActiveActivityFilters({ ...createEmptyActivityFilters(), activityDateStart: '2024-05-01' }),
    true,
  )
  assert.equal(
    hasActiveActivityFilters({ ...createEmptyActivityFilters(), officialShippingStartDate: '2024-08-01' }),
    true,
  )
})

test('matchesActivityFilters returns true for empty filters', () => {
  assert.equal(matchesActivityFilters(makeActivity(), createEmptyActivityFilters()), true)
})

test('matchesActivityFilters filters by name and address keyword (case-insensitive substring)', () => {
  assert.equal(matchesActivityFilters(makeActivity(), { ...createEmptyActivityFilters(), name: '夏祭' }), true)
  assert.equal(matchesActivityFilters(makeActivity(), { ...createEmptyActivityFilters(), name: '冬' }), false)
  assert.equal(matchesActivityFilters(makeActivity(), { ...createEmptyActivityFilters(), address: '巨蛋' }), true)
  assert.equal(matchesActivityFilters(makeActivity(), { ...createEmptyActivityFilters(), address: '大阪' }), false)
})

test('matchesActivityFilters filters by selected type ids', () => {
  assert.equal(
    matchesActivityFilters(makeActivity(), { ...createEmptyActivityFilters(), activityTypeIds: [5] }),
    true,
  )
  assert.equal(
    matchesActivityFilters(makeActivity(), { ...createEmptyActivityFilters(), activityTypeIds: [6] }),
    false,
  )
  assert.equal(
    matchesActivityFilters(makeActivity(), { ...createEmptyActivityFilters(), animateTypeIds: [8] }),
    true,
  )
  assert.equal(
    matchesActivityFilters(makeActivity(), { ...createEmptyActivityFilters(), animateTypeIds: [9] }),
    false,
  )
})

test('matchesActivityFilters filters by overlapping activity date range', () => {
  const overlapping = { ...createEmptyActivityFilters(), activityDateStart: '2024-05-14', activityDateEnd: '2024-05-20' }
  const disjoint = { ...createEmptyActivityFilters(), activityDateStart: '2024-06-01', activityDateEnd: '2024-06-10' }

  assert.equal(matchesActivityFilters(makeActivity(), overlapping), true)
  assert.equal(matchesActivityFilters(makeActivity(), disjoint), false)
})

test('matchesActivityFilters filters official shipping only for pre-order activities with a period', () => {
  const officialShippingFilter = {
    ...createEmptyActivityFilters(),
    officialShippingStartDate: '2024-08-03',
    officialShippingEndDate: '2024-08-10',
  }

  assert.equal(matchesActivityFilters(makeActivity(), officialShippingFilter), true)
  assert.equal(
    matchesActivityFilters(
      makeActivity({
        isPreOrder: false,
        raw: {
          activeStartTime: '2024-05-12T00:00',
          activeEndTime: '2024-05-15T00:00',
          officialShippingStartTime: '2024-08-01T00:00',
          officialShippingEndTime: '2024-08-05T00:00',
        },
      }),
      officialShippingFilter,
    ),
    false,
  )
  assert.equal(
    matchesActivityFilters(
      makeActivity({
        raw: {
          activeStartTime: '2024-05-12T00:00',
          activeEndTime: '2024-05-15T00:00',
        },
      }),
      officialShippingFilter,
    ),
    false,
  )
  assert.equal(
    matchesActivityFilters(
      makeActivity({
        raw: {
          activeStartTime: '2024-05-12T00:00',
          activeEndTime: '2024-05-15T00:00',
          officialShippingStartTime: '2024-09-01T00:00',
          officialShippingEndTime: '2024-09-05T00:00',
        },
      }),
      officialShippingFilter,
    ),
    false,
  )
})
