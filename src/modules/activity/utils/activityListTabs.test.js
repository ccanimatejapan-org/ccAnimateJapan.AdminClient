import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  ACTIVITY_LIST_TAB_KEYS,
  DEFAULT_ACTIVITY_LIST_TAB_KEY,
  getActivityListTabs,
  filterActivitiesByActivityListTab,
} from './activityListTabs.js'

test('has stable tab keys and a default key', () => {
  assert.deepEqual(ACTIVITY_LIST_TAB_KEYS, {
    upcomingOrInProgress: 'upcomingOrInProgress',
    ended: 'ended',
  })
  assert.equal(
    DEFAULT_ACTIVITY_LIST_TAB_KEY,
    ACTIVITY_LIST_TAB_KEYS.upcomingOrInProgress,
  )
})

test('filters upcoming/in-progress including legacy readable statuses and ended activities by status', () => {
  const activities = [
    { id: 1, status: 0 },
    { id: 2, status: 1 },
    { id: 3, status: 2 },
    { id: 4, status: 3 },
    { id: 5, status: 4 },
  ]

  assert.deepEqual(
    filterActivitiesByActivityListTab(activities, ACTIVITY_LIST_TAB_KEYS.upcomingOrInProgress).map(
      (activity) => activity.id,
    ),
    [1, 2, 3, 4],
  )
  assert.deepEqual(
    filterActivitiesByActivityListTab(activities, ACTIVITY_LIST_TAB_KEYS.ended).map(
      (activity) => activity.id,
    ),
    [5],
  )
  assert.deepEqual(
    filterActivitiesByActivityListTab(activities, 'unknown').map((activity) => activity.id),
    [1, 2, 3, 4],
  )
})

test('returns active tab fallback, filtered counts and default counts with unknown keys', () => {
  const totalActivities = [
    { id: 1, status: 0 },
    { id: 2, status: 3 },
    { id: 3, status: 4 },
    { id: 4, status: 4 },
    { id: 5, status: 2 },
  ]
  const filteredActivities = [{ id: 5, status: 2 }]

  assert.equal(
    getActivityListTabs({
      filteredActivities,
      totalActivities,
      activeTabKey: ACTIVITY_LIST_TAB_KEYS.ended,
    })[1].count,
    0,
  )
  assert.equal(
    getActivityListTabs({
      filteredActivities,
      totalActivities,
      activeTabKey: 'does-not-exist',
    })[0].isActive,
    true,
  )
  assert.equal(
    getActivityListTabs({
      filteredActivities,
      totalActivities,
      activeTabKey: ACTIVITY_LIST_TAB_KEYS.upcomingOrInProgress,
    })[0].count,
    1,
  )
})

test('returns active tab empty text for default and filtered-no-result cases', () => {
  const totalActivities = [
    { id: 1, status: 0 },
    { id: 2, status: 4 },
  ]
  const filteredActivities = [
    { id: 2, status: 4 },
  ]

  assert.equal(
    getActivityListTabs({
      filteredActivities,
      totalActivities,
      activeTabKey: ACTIVITY_LIST_TAB_KEYS.upcomingOrInProgress,
    }).find((tab) => tab.key === ACTIVITY_LIST_TAB_KEYS.upcomingOrInProgress).emptyText,
    '沒有符合條件的活動',
  )
  assert.equal(
    getActivityListTabs({
      filteredActivities,
      totalActivities,
      activeTabKey: ACTIVITY_LIST_TAB_KEYS.ended,
    }).find((tab) => tab.key === ACTIVITY_LIST_TAB_KEYS.ended).count,
    1,
  )
  assert.equal(
    getActivityListTabs({
      filteredActivities: [],
      totalActivities: [],
      activeTabKey: ACTIVITY_LIST_TAB_KEYS.ended,
    }).find((tab) => tab.key === ACTIVITY_LIST_TAB_KEYS.ended).emptyText,
    '目前沒有已結束活動',
  )
})

test('does not mutate input arrays while filtering and counting', () => {
  const first = { id: 1, status: 0 }
  const second = { id: 2, status: 4 }
  const frozenInput = Object.freeze([{ ...first }, { ...second }])

  const tabs = getActivityListTabs({
    filteredActivities: frozenInput,
    totalActivities: frozenInput,
    activeTabKey: ACTIVITY_LIST_TAB_KEYS.ended,
  })

  assert.deepEqual(frozenInput, [{ ...first }, { ...second }])
  assert.equal(tabs[1].count, 1)
  assert.equal(tabs[0].count, 1)
})